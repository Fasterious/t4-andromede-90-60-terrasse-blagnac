// GET /api/admin/export?days=180 : toutes les questions/réponses en CSV (Excel, Sheets).

import { isAdmin } from '../_lib/auth.js';
import { listConversations } from '../_lib/conversations.js';

const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default async function handler(req, res) {
  if (!isAdmin(req)) return res.status(401).end('Non autorisé');
  const days = Math.min(Math.max(Number(req.query?.days) || 180, 1), 180);
  const convs = await listConversations({ sinceMs: Date.now() - days * 86400000, limit: 5000 });
  const rows = [['conversation', 'visiteur', 'heure', 'role', 'message', 'source', 'ville', 'appareil', 'limite']];
  for (const c of convs) {
    for (const m of c.messages) {
      rows.push([
        c.id,
        c.visiteur,
        new Date(m.t).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
        m.role === 'user' ? 'visiteur' : 'assistant',
        m.texte,
        c.source,
        [c.geo?.ville, c.geo?.pays].filter(Boolean).join(', '),
        c.appareil?.type,
        m.limite || '',
      ]);
    }
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="conversations-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send('﻿' + rows.map((r) => r.map(cell).join(';')).join('\r\n'));
}
