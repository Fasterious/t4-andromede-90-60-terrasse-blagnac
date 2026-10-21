// POST /api/admin/login { password } → cookie de session. 5 essais / 15 min par IP.

import { checkPassword, passwordConfigured, sessionCookie } from '../_lib/auth.js';
import { identify } from '../_lib/visitor.js';
import { pipeline } from '../_lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!passwordConfigured()) return res.status(503).json({ error: 'ADMIN_PASSWORD n’est pas configuré sur Vercel.' });

  const { ipHash } = identify(req);
  const key = `login:${ipHash}:${Math.floor(Date.now() / 900000)}`;
  const [tries] = await pipeline([['INCR', key], ['EXPIRE', key, 900]]);
  if (tries > 5) return res.status(429).json({ error: 'Trop d’essais. Réessayez dans 15 minutes.' });

  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  if (!checkPassword(String(body.password || ''))) return res.status(401).json({ error: 'Mot de passe incorrect.' });

  res.setHeader('Set-Cookie', sessionCookie());
  return res.status(204).end();
}
