// Compteurs d'audience agrégés (aucune donnée personnelle, aucun cookie) :
// un hash par jour, champ « événement|source ».

import { pipeline, today } from './_lib/store.js';

const EVENTS = new Set([
  'pageview',
  'gallery_open',
  'share_click',
  'visit_open',
  'visit_request',
  'whatsapp_click',
  'tel_click',
  'maps_click',
  'chat_open',
  'chat_whatsapp_click',
  'details_open',
]);
const SOURCES = new Set(['seloger', 'pap', 'leboncoin', 'lbc', 'facebook', 'fb', 'qr', 'affiche', 'whatsapp', 'direct']);
const TTL = 60 * 60 * 24 * 120;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const event = String(body.event || '');
  if (!EVENTS.has(event)) return res.status(204).end();
  const src = SOURCES.has(body.src) ? body.src : 'direct';

  const key = `ev:${today()}`;
  const commands = [
    ['HINCRBY', key, `${event}|${src}`, 1],
    ['EXPIRE', key, TTL],
  ];
  // Détail utile au pilotage : profil de financement des demandes de visite,
  // et points d'attention / questions FAQ les plus ouverts
  if (event === 'visit_request' && body.financement) {
    commands.push(['HINCRBY', `${key}:financement`, String(body.financement).slice(0, 60), 1], ['EXPIRE', `${key}:financement`, TTL]);
  }
  if (event === 'details_open' && body.label) {
    commands.push(['HINCRBY', `${key}:details`, String(body.label).slice(0, 60), 1], ['EXPIRE', `${key}:details`, TTL]);
  }

  try {
    await pipeline(commands);
  } catch (err) {
    console.error('track', err);
  }
  return res.status(204).end();
}
