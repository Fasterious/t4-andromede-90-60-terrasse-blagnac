// GET /api/admin/conversation?id=… : transcription complète d'une conversation.

import { isAdmin } from '../_lib/auth.js';
import { getConversation, validId } from '../_lib/conversations.js';

export default async function handler(req, res) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Non autorisé' });
  const id = String(req.query?.id || '');
  if (!validId(id)) return res.status(400).json({ error: 'Identifiant invalide' });
  const conv = await getConversation(id);
  if (!conv) return res.status(404).json({ error: 'Conversation introuvable' });
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(conv);
}
