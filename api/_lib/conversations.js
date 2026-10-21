// Journal complet des conversations avec l'assistant, consultable dans /admin.
// Une conversation = un onglet de navigateur ; un document JSON par conversation
// + un index trié par date de dernier message.

import { pipeline, today } from './store.js';

const TTL = 60 * 60 * 24 * 180; // 6 mois
export const INDEX = 'convs';

export const validId = (id) => typeof id === 'string' && /^[a-z0-9]{8,40}$/.test(id);
export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

export async function getConversation(id) {
  const [raw] = await pipeline([['GET', `conv:${id}`]]);
  return raw ? JSON.parse(raw) : null;
}

export async function recordTurn({ id, who, src, question, reply, receivedAt, usage, costUsd, limited }) {
  const now = new Date();
  const conv = (await getConversation(id)) || {
    id,
    debut: receivedAt.toISOString(),
    visiteur: who.visitorHash,
    ip: who.ipHash,
    source: src,
    geo: who.geo,
    appareil: who.appareil,
    langue: who.langue,
    messages: [],
    questions: 0,
    coutUsd: 0,
  };
  conv.messages.push({ role: 'user', t: receivedAt.toISOString(), texte: question });
  conv.messages.push({
    role: 'assistant',
    t: now.toISOString(),
    texte: reply,
    ms: now - receivedAt,
    ...(limited ? { limite: limited } : {}),
    ...(usage ? { tokens: { entree: usage.input_tokens + (usage.cache_read_input_tokens || 0), sortie: usage.output_tokens } } : {}),
  });
  conv.questions += 1;
  conv.coutUsd = Math.round((conv.coutUsd + (costUsd || 0)) * 1e6) / 1e6;
  conv.fin = now.toISOString();
  conv.dureeSec = Math.round((now - new Date(conv.debut)) / 1000);

  await pipeline([
    ['SET', `conv:${id}`, JSON.stringify(conv)],
    ['EXPIRE', `conv:${id}`, TTL],
    ['ZADD', INDEX, now.getTime(), id],
    ['SADD', `chat:visiteurs:${today()}`, who.visitorHash],
    ['EXPIRE', `chat:visiteurs:${today()}`, TTL],
  ]);
  return conv;
}

export async function listConversations({ sinceMs, limit = 500 }) {
  const ids = await pipeline([['ZREVRANGEBYSCORE', INDEX, '+inf', sinceMs, 'LIMIT', 0, limit]]).then((r) => r[0] || []);
  if (!ids.length) return [];
  const [raws] = await pipeline([['MGET', ...ids.map((id) => `conv:${id}`)]]);
  return (raws || []).filter(Boolean).map((r) => JSON.parse(r));
}
