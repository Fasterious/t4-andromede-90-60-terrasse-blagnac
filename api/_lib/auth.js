// Accès à /admin : mot de passe (ADMIN_PASSWORD) → cookie de session signé,
// HttpOnly, 7 jours. L'en-tête « Authorization: Bearer ADMIN_TOKEN » reste
// accepté pour les scripts (agent de pilotage).

import crypto from 'node:crypto';

const COOKIE = 't4a_admin';
const DUREE = 60 * 60 * 24 * 7;

const secret = () => process.env.ADMIN_SECRET || `${process.env.ADMIN_PASSWORD}:${process.env.HASH_SALT || 't4a'}`;
const sign = (value) => crypto.createHmac('sha256', secret()).update(value).digest('base64url');

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export const passwordConfigured = () => Boolean(process.env.ADMIN_PASSWORD);
export const checkPassword = (given) => passwordConfigured() && safeEqual(given, process.env.ADMIN_PASSWORD);

export function sessionCookie() {
  const exp = String(Math.floor(Date.now() / 1000) + DUREE);
  return `${COOKIE}=${exp}.${sign(exp)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${DUREE}`;
}

export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

export function isAdmin(req) {
  const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (bearer && process.env.ADMIN_TOKEN && safeEqual(bearer, process.env.ADMIN_TOKEN)) return true;
  if (!passwordConfigured()) return false;
  const cookie = String(req.headers.cookie || '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`));
  if (!cookie) return false;
  const [exp, sig] = cookie.slice(COOKIE.length + 1).split('.');
  return Boolean(exp && sig) && safeEqual(sig, sign(exp)) && Number(exp) > Date.now() / 1000;
}
