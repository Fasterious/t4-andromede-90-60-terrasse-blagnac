// Agrégation des compteurs d'audience et de l'assistant (utilisée par
// /api/stats et par le tableau de bord /admin).

import { pipeline, today, month, hgetallToObject, hasRedis } from './store.js';

const add = (obj, k, v) => {
  obj[k] = (obj[k] || 0) + v;
};

export async function computeStats(daysParam) {
  const days = Math.min(Math.max(Number(daysParam) || 14, 1), 90);
  const dates = Array.from({ length: days }, (_, i) => today(-i));

  const commands = [];
  for (const d of dates) {
    commands.push(
      ['HGETALL', `ev:${d}`],
      ['HGETALL', `ev:${d}:financement`],
      ['HGETALL', `ev:${d}:details`],
      ['GET', `chat:day:${d}`],
      ['HGETALL', `chat:tokens:${d}`],
      ['HGETALL', `ev:${d}:villes`],
      ['HGETALL', `ev:${d}:appareils`],
      ['SCARD', `chat:visiteurs:${d}`]
    );
  }
  commands.push(['GET', `chat:cost:${month()}`], ['LRANGE', `chat:q:${month()}`, 0, 199]);

  const results = await pipeline(commands);

  const parDate = {};
  const totaux = { evenements: {}, parSource: {}, financement: {}, details: {}, villes: {}, appareils: {} };
  dates.forEach((d, i) => {
    const [ev, fin, det, chat, tokens, villes, appareils, visiteursChat] = results.slice(i * 8, i * 8 + 8);
    const events = hgetallToObject(ev);
    parDate[d] = {
      evenements: events,
      questionsChat: Number(chat || 0),
      visiteursChat: Number(visiteursChat || 0),
      tokens: hgetallToObject(tokens),
    };
    for (const [k, v] of Object.entries(hgetallToObject(villes))) add(totaux.villes, k, v);
    for (const [k, v] of Object.entries(hgetallToObject(appareils))) add(totaux.appareils, k, v);
    for (const [k, v] of Object.entries(events)) {
      const [event, src] = k.split('|');
      totaux.evenements[event] = (totaux.evenements[event] || 0) + v;
      totaux.parSource[src] ||= {};
      totaux.parSource[src][event] = (totaux.parSource[src][event] || 0) + v;
    }
    for (const [k, v] of Object.entries(hgetallToObject(fin))) totaux.financement[k] = (totaux.financement[k] || 0) + v;
    for (const [k, v] of Object.entries(hgetallToObject(det))) totaux.details[k] = (totaux.details[k] || 0) + v;
  });

  const tail = results.slice(dates.length * 8);
  const questions = (tail[1] || []).map((q) => {
    try {
      return JSON.parse(q);
    } catch {
      return { q };
    }
  });

  return {
    stockage: hasRedis ? 'upstash' : 'memoire (non persistant)',
    periode: { du: dates[dates.length - 1], au: dates[0] },
    coutChatMoisUsd: Number(tail[0] || 0) / 1e6,
    totaux,
    parDate,
    dernieresQuestions: questions,
  };
}
