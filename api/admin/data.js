// GET /api/admin/data?days=30 : tout le tableau de bord en un appel.

import { isAdmin } from '../_lib/auth.js';
import { computeStats } from '../_lib/stats.js';
import { listConversations } from '../_lib/conversations.js';

const add = (obj, k, v = 1) => {
  obj[k] = (obj[k] || 0) + v;
};

// Heure de Paris (0-23) et jour de la semaine
const parisHour = (iso) => Number(new Date(iso).toLocaleString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', hour12: false }));
const parisWeekday = (iso) => new Date(iso).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long' });

export default async function handler(req, res) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Non autorisé' });
  const days = Math.min(Math.max(Number(req.query?.days) || 30, 1), 180);
  const sinceMs = Date.now() - days * 86400000;

  const [stats, convs] = await Promise.all([computeStats(Math.min(days, 90)), listConversations({ sinceMs })]);

  const parHeure = Array(24).fill(0);
  const parJourSemaine = {};
  const parVille = {};
  const parSource = {};
  const parAppareil = {};
  const visiteurs = new Set();
  let questions = 0;
  let dureeTotale = 0;
  let cout = 0;

  for (const c of convs) {
    visiteurs.add(c.visiteur);
    questions += c.questions;
    dureeTotale += c.dureeSec || 0;
    cout += c.coutUsd || 0;
    add(parVille, [c.geo?.ville, c.geo?.pays].filter(Boolean).join(', ') || 'inconnue');
    add(parSource, c.source || 'direct');
    add(parAppareil, `${c.appareil?.type || '?'} · ${c.appareil?.os || '?'}`);
    for (const m of c.messages) {
      if (m.role !== 'user') continue;
      parHeure[parisHour(m.t)] += 1;
      add(parJourSemaine, parisWeekday(m.t));
    }
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    periodeJours: days,
    chat: {
      conversations: convs.length,
      visiteursUniques: visiteurs.size,
      questions,
      questionsParConversation: convs.length ? Math.round((questions / convs.length) * 10) / 10 : 0,
      dureeMoyenneSec: convs.length ? Math.round(dureeTotale / convs.length) : 0,
      coutUsd: Math.round(cout * 10000) / 10000,
      tresInteresses: new Set(convs.filter((c) => c.messages.some((m) => m.limite === 'quota')).map((c) => c.visiteur)).size,
      parHeure,
      parJourSemaine,
      parVille,
      parSource,
      parAppareil,
    },
    site: stats,
    conversations: convs.map((c) => ({
      id: c.id,
      debut: c.debut,
      fin: c.fin,
      dureeSec: c.dureeSec,
      questions: c.questions,
      visiteur: c.visiteur,
      source: c.source,
      ville: [c.geo?.ville, c.geo?.codePostal, c.geo?.pays].filter(Boolean).join(' · '),
      appareil: `${c.appareil?.type || ''} · ${c.appareil?.os || ''} · ${c.appareil?.browser || ''}`,
      premiereQuestion: c.messages.find((m) => m.role === 'user')?.texte || '',
      limite: c.messages.some((m) => m.limite === 'quota') ? 'quota' : c.messages.find((m) => m.limite)?.limite || null,
    })),
  });
}
