// Mesure d'audience minimale, sans cookie : compteurs agrégés par jour,
// par source (?src=seloger, pap, leboncoin…) et par événement.

const SOURCES = {
  seloger: 'SL',
  pap: 'PAP',
  leboncoin: 'LBC',
  lbc: 'LBC',
  facebook: 'FB',
  fb: 'FB',
  qr: 'QR',
  affiche: 'QR',
  whatsapp: 'WA',
  direct: 'WEB',
};

function safeSession(fn) {
  try {
    return fn(window.sessionStorage);
  } catch {
    return null;
  }
}

function detectSource() {
  const params = new URLSearchParams(window.location.search);
  const raw = (params.get('src') || params.get('utm_source') || '').toLowerCase().trim();
  if (raw && SOURCES[raw]) {
    safeSession((s) => s.setItem('src', raw));
    return raw;
  }
  return safeSession((s) => s.getItem('src')) || 'direct';
}

export const source = detectSource();

// Code court ajouté aux messages WhatsApp pour savoir d'où vient le contact
export const sourceCode = SOURCES[source] || 'WEB';

export function track(event, extra = {}) {
  const body = JSON.stringify({ event, src: source, ...extra });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
      return;
    }
  } catch {
    // ignore
  }
  fetch('/api/track', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(
    () => {}
  );
}

// Clics sur les éléments marqués data-track="nom_evenement"
export function initTracking() {
  track('pageview');
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-track]');
    if (el) track(el.dataset.track);
  });
  document.querySelectorAll('details').forEach((d) => {
    d.addEventListener('toggle', () => {
      if (d.open) track('details_open', { label: d.querySelector('summary')?.textContent?.slice(0, 60) });
    });
  });
}
