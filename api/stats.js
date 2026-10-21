// Tableau de bord privé (JSON) pour le pilotage — protégé par ADMIN_TOKEN.
// GET /api/stats?days=14  avec l'en-tête  Authorization: Bearer <ADMIN_TOKEN>

import crypto from 'node:crypto';
import { pipeline, today, month, hgetallToObject, hasRedis } from './_lib/store.js';

function authorized(req) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  const given = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (!authorized(req)) return res.status(401).json({ error: 'Non autorisé' });

  const days = Math.min(Math.max(Number(req.query?.days) || 14, 1), 90);
  const dates = Array.from({ length: days }, (_, i) => today(-i));

  const commands = [];
  for (const d of dates) {
    commands.push(
      ['HGETALL', `ev:${d}`],
      ['HGETALL', `ev:${d}:financement`],
      ['HGETALL', `ev:${d}:details`],
      ['GET', `chat:day:${d}`],
      ['HGETALL', `chat:tokens:${d}`]
    );
  }
  commands.push(['GET', `chat:cost:${month()}`], ['LRANGE', `chat:q:${month()}`, 0, 199]);

  const results = await pipeline(commands);

  const parDate = {};
  const totaux = { evenements: {}, parSource: {}, financement: {}, details: {} };
  dates.forEach((d, i) => {
    const [ev, fin, det, chat, tokens] = results.slice(i * 5, i * 5 + 5);
    const events = hgetallToObject(ev);
    parDate[d] = { evenements: events, questionsChat: Number(chat || 0), tokens: hgetallToObject(tokens) };
    for (const [k, v] of Object.entries(events)) {
      const [event, src] = k.split('|');
      totaux.evenements[event] = (totaux.evenements[event] || 0) + v;
      totaux.parSource[src] ||= {};
      totaux.parSource[src][event] = (totaux.parSource[src][event] || 0) + v;
    }
    for (const [k, v] of Object.entries(hgetallToObject(fin))) totaux.financement[k] = (totaux.financement[k] || 0) + v;
    for (const [k, v] of Object.entries(hgetallToObject(det))) totaux.details[k] = (totaux.details[k] || 0) + v;
  });

  const tail = results.slice(dates.length * 5);
  const questions = (tail[1] || []).map((q) => {
    try {
      return JSON.parse(q);
    } catch {
      return { q };
    }
  });

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    stockage: hasRedis ? 'upstash' : 'memoire (non persistant)',
    periode: { du: dates[dates.length - 1], au: dates[0] },
    coutChatMoisUsd: Number(tail[0] || 0) / 1e6,
    totaux,
    parDate,
    dernieresQuestions: questions,
  });
}
