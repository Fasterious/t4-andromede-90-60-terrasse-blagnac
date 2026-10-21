import { clearCookie } from '../_lib/auth.js';

export default function handler(req, res) {
  res.setHeader('Set-Cookie', clearCookie());
  return res.status(204).end();
}
