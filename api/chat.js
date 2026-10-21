// Assistant de l'annonce — Claude Haiku 5.5 (le modèle le moins cher),
// avec quotas par visiteur, par IP, par jour et un budget mensuel.
// Au-delà : réponse fixe qui renvoie vers WhatsApp, sans appel à l'API.

import crypto from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from './_lib/knowledge.js';
import { pipeline, today, month } from './_lib/store.js';

const MODEL = 'claude-haiku-5-5';

const num = (name, fallback) => Number(process.env[name] || fallback);
const LIMITS = {
  perVisitorPerDay: num('CHAT_MAX_PER_VISITOR', 12),
  perIpPerDay: num('CHAT_MAX_PER_IP', 30),
  globalPerDay: num('CHAT_MAX_PER_DAY', 800),
  monthlyBudgetUsd: num('CHAT_MONTHLY_BUDGET_USD', 15),
  suggestWhatsAppAfter: 5,
};
const MAX_QUESTION_CHARS = 500;
const MAX_HISTORY = 10;

// Tarifs Haiku 5.5 en $ par million de tokens (prompt < 100K tokens)
const PRICE = { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 };

const TTL_DAY = 60 * 60 * 48;
const TTL_LOG = 60 * 60 * 24 * 90;

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

const WHATSAPP_REPLY =
  'Vous avez posé beaucoup de questions — c’est bon signe ! Pour aller plus loin, le plus simple est d’échanger directement avec Corinne & Arnaud sur WhatsApp : ils vous répondront personnellement.';
const UNAVAILABLE_REPLY =
  'L’assistant fait une pause. Corinne & Arnaud vous répondent directement sur WhatsApp ou au téléphone.';

function hash(value) {
  const salt = process.env.HASH_SALT || 't4a';
  return crypto.createHash('sha256').update(`${salt}:${value}`).digest('hex').slice(0, 16);
}

// Ne garde que des échanges texte user/assistant valides, en alternance,
// commençant et finissant par une question de l'utilisateur.
function sanitize(messages) {
  if (!Array.isArray(messages)) return null;
  const clean = [];
  for (const m of messages.slice(-MAX_HISTORY)) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') continue;
    const content = m.content.trim().slice(0, m.role === 'user' ? MAX_QUESTION_CHARS : 2000);
    if (!content) continue;
    if (clean.length && clean[clean.length - 1].role === m.role) clean[clean.length - 1].content = content;
    else clean.push({ role: m.role, content });
  }
  while (clean.length && clean[0].role !== 'user') clean.shift();
  if (!clean.length || clean[clean.length - 1].role !== 'user') return null;
  return clean;
}

function costUsd(usage) {
  const u = usage || {};
  return (
    ((u.input_tokens || 0) * PRICE.input +
      (u.output_tokens || 0) * PRICE.output +
      (u.cache_read_input_tokens || 0) * PRICE.cacheRead +
      (u.cache_creation_input_tokens || 0) * PRICE.cacheWrite) /
    1e6
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const messages = sanitize(body.messages);
  if (!messages) return res.status(400).json({ error: 'Question manquante' });
  const question = messages[messages.length - 1].content;
  const src = String(body.src || 'direct').slice(0, 20);

  const day = today();
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const visitor = String(req.headers['x-visitor'] || '').slice(0, 64) || ip;
  const kVisitor = `chat:v:${day}:${hash(visitor)}`;
  const kIp = `chat:ip:${day}:${hash(ip)}`;
  const kDay = `chat:day:${day}`;
  const kCost = `chat:cost:${month()}`; // en micro-dollars

  let counts;
  try {
    counts = await pipeline([
      ['INCR', kVisitor],
      ['EXPIRE', kVisitor, TTL_DAY],
      ['INCR', kIp],
      ['EXPIRE', kIp, TTL_DAY],
      ['INCR', kDay],
      ['EXPIRE', kDay, TTL_LOG],
      ['GET', kCost],
    ]);
  } catch (err) {
    console.error('store', err);
    return res.status(200).json({ reply: UNAVAILABLE_REPLY, limitReached: true });
  }
  const [nVisitor, , nIp, , nDay, , microUsd] = counts;
  const remaining = Math.max(0, LIMITS.perVisitorPerDay - nVisitor);

  const overQuota = nVisitor > LIMITS.perVisitorPerDay || nIp > LIMITS.perIpPerDay;
  const overBudget = nDay > LIMITS.globalPerDay || Number(microUsd || 0) / 1e6 >= LIMITS.monthlyBudgetUsd;

  if (overQuota) return res.status(200).json({ reply: WHATSAPP_REPLY, remaining: 0, limitReached: true });
  if (overBudget || !client) return res.status(200).json({ reply: UNAVAILABLE_REPLY, remaining, limitReached: true });

  let reply;
  let usage;
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      thinking: { type: 'disabled' },
      output_config: { effort: 'low' },
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages,
    });
    usage = response.usage;
    if (response.stop_reason === 'refusal') {
      reply = 'Je ne peux pas répondre à cette question. Corinne & Arnaud peuvent vous répondre directement sur WhatsApp.';
    } else {
      reply = response.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();
    }
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) console.warn('anthropic rate limit');
    else if (err instanceof Anthropic.APIError) console.error('anthropic', err.status, err.message);
    else console.error('chat', err);
    return res.status(200).json({ reply: UNAVAILABLE_REPLY, remaining, suggestWhatsApp: true });
  }

  // Journal anonyme des questions (pour améliorer la FAQ) + suivi du coût
  const micro = Math.round(costUsd(usage) * 1e6);
  const kLog = `chat:q:${month()}`;
  pipeline([
    ['INCRBY', kCost, micro],
    ['EXPIRE', kCost, TTL_LOG],
    ['HINCRBY', `chat:tokens:${day}`, 'input', (usage?.input_tokens || 0) + (usage?.cache_read_input_tokens || 0)],
    ['HINCRBY', `chat:tokens:${day}`, 'output', usage?.output_tokens || 0],
    ['EXPIRE', `chat:tokens:${day}`, TTL_LOG],
    ['LPUSH', kLog, JSON.stringify({ t: new Date().toISOString(), src, n: nVisitor, q: question })],
    ['LTRIM', kLog, 0, 1999],
    ['EXPIRE', kLog, TTL_LOG],
  ]).catch((err) => console.error('store log', err));

  return res.status(200).json({
    reply: reply || UNAVAILABLE_REPLY,
    remaining,
    suggestWhatsApp: nVisitor >= LIMITS.suggestWhatsAppAfter,
  });
}
