// Statistiques JSON pour le pilotage (scripts, agent analyste).
// GET /api/stats?days=14 avec « Authorization: Bearer <ADMIN_TOKEN> » ou la session /admin.

import { isAdmin } from './_lib/auth.js';
import { computeStats } from './_lib/stats.js';

export default async function handler(req, res) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Non autorisé' });
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(await computeStats(req.query?.days || 14));
}
