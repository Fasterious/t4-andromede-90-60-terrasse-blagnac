// Identification d'un visiteur sans stocker son adresse IP en clair :
// identifiant navigateur (localStorage) + empreinte de l'IP hachée avec un sel,
// localisation approximative (ville) fournie par Vercel, type d'appareil.

import crypto from 'node:crypto';

export function hash(value) {
  const salt = process.env.HASH_SALT || 't4a';
  return crypto.createHash('sha256').update(`${salt}:${value}`).digest('hex').slice(0, 16);
}

const header = (req, name) => {
  const v = req.headers[name];
  if (!v) return null;
  try {
    return decodeURIComponent(String(v));
  } catch {
    return String(v);
  }
};

function device(ua = '') {
  const type = /ipad|tablet/i.test(ua) ? 'tablette' : /mobi|iphone|android/i.test(ua) ? 'mobile' : 'ordinateur';
  const os = /iphone|ipad|ios/i.test(ua)
    ? 'iOS'
    : /android/i.test(ua)
      ? 'Android'
      : /windows/i.test(ua)
        ? 'Windows'
        : /mac os/i.test(ua)
          ? 'macOS'
          : /linux/i.test(ua)
            ? 'Linux'
            : 'autre';
  const browser = /edg\//i.test(ua)
    ? 'Edge'
    : /chrome|crios/i.test(ua)
      ? 'Chrome'
      : /firefox|fxios/i.test(ua)
        ? 'Firefox'
        : /safari/i.test(ua)
          ? 'Safari'
          : 'autre';
  return { type, os, browser };
}

export function identify(req) {
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'inconnue';
  const visitor = String(req.headers['x-visitor'] || '').replace(/[^\w-]/g, '').slice(0, 64);
  return {
    ipHash: hash(`ip:${ip}`),
    visitorHash: visitor ? hash(`v:${visitor}`) : hash(`ip:${ip}`),
    geo: {
      ville: header(req, 'x-vercel-ip-city'),
      codePostal: header(req, 'x-vercel-ip-postal-code'),
      region: header(req, 'x-vercel-ip-country-region'),
      pays: header(req, 'x-vercel-ip-country'),
    },
    appareil: device(String(req.headers['user-agent'] || '')),
    langue: String(req.headers['accept-language'] || '').split(',')[0] || null,
  };
}
