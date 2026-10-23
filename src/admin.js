// Tableau de bord /admin : connexion par mot de passe (cookie de session posé
// par l'API), puis statistiques du site et conversations avec l'assistant.

const $ = (id) => document.getElementById(id);

const EVENTS = {
  pageview: 'Visites',
  gallery_open: 'Galerie ouverte',
  plan_open: 'Plan ouvert en grand',
  whatsapp_click: 'Clics WhatsApp',
  bar_whatsapp_click: 'WhatsApp depuis la barre',
  wa_gate_continue: 'Fenêtre : continuer sur WhatsApp',
  wa_gate_assistant: 'Fenêtre : assistant d’abord',
  carte_open: 'Carte du quartier ouverte',
  chat_whatsapp_click: 'WhatsApp depuis l’assistant',
  tel_click: 'Clics téléphone',
};

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const fmtDate = (iso) =>
  new Date(iso).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'short', timeStyle: 'short' });
const fmtTime = (iso) => new Date(iso).toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' });
const fmtDuree = (sec) => (!sec ? '< 1 min' : sec < 60 ? `${sec} s` : `${Math.round(sec / 60)} min`);

function tile(value, label) {
  return `<div class="tile"><b>${esc(value)}</b><span>${esc(label)}</span></div>`;
}

// Liste triée avec barre horizontale (une seule couleur : la quantité)
function rows(el, obj, limit = 8) {
  const entries = Object.entries(obj || {}).sort((a, b) => b[1] - a[1]).slice(0, limit);
  if (!entries.length) {
    el.innerHTML = '<p class="muted small">Pas encore de données.</p>';
    return;
  }
  const max = entries[0][1];
  el.innerHTML = entries
    .map(
      ([k, v]) => `<div class="row">
        <span class="row-label" title="${esc(k)}">${esc(k)}</span><b>${v}</b>
        <span class="row-track"><i style="width:${Math.max(2, (v / max) * 100)}%"></i></span>
      </div>`
    )
    .join('');
}

function hours(el, values) {
  const max = Math.max(1, ...values);
  el.innerHTML = values
    .map((v, h) => `<div class="h" data-tip="${h} h : ${v} question${v > 1 ? 's' : ''}"><i style="height:${(v / max) * 100}%"></i></div>`)
    .join('');
  const axis = document.createElement('div');
  axis.className = 'hours-axis';
  axis.innerHTML = values.map((_, h) => `<span>${h % 3 === 0 ? h : ''}</span>`).join('');
  el.after(axis);
}

// Infobulle au survol des barres horaires
function initTooltip() {
  const tip = $('tip');
  document.addEventListener('mousemove', (e) => {
    const target = e.target.closest('[data-tip]');
    if (!target) {
      tip.hidden = true;
      return;
    }
    tip.textContent = target.dataset.tip;
    tip.hidden = false;
    tip.style.left = `${e.clientX + 12}px`;
    tip.style.top = `${e.clientY - 28}px`;
  });
}

async function api(path) {
  const res = await fetch(path, { credentials: 'same-origin' });
  if (res.status === 401) throw Object.assign(new Error('auth'), { auth: true });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

async function load() {
  const days = $('days').value;
  $('export').href = `/api/admin/export?days=${Math.max(days, 30)}`;
  const data = await api(`/api/admin/data?days=${days}`);
  const ev = data.site.totaux.evenements;
  const c = data.chat;

  $('storage-note').textContent =
    data.site.stockage === 'upstash'
      ? `Période : ${days} derniers jours. Heures en heure de Paris.`
      : 'Attention : stockage en mémoire (Upstash non configuré), les données ne sont pas conservées.';

  $('site-tiles').innerHTML = Object.entries(EVENTS)
    .map(([k, label]) => tile(ev[k] || 0, label))
    .join('');
  $('chat-tiles').innerHTML = [
    tile(c.conversations, 'Conversations'),
    tile(c.visiteursUniques, 'Visiteurs uniques'),
    tile(c.questions, 'Questions posées'),
    tile(c.questionsParConversation, 'Questions par conversation'),
    tile(fmtDuree(c.dureeMoyenneSec), 'Durée moyenne'),
    tile(c.tresInteresses, 'Très intéressés (limite atteinte)'),
    tile(`${c.coutUsd.toFixed(2)} $`, 'Coût de l’assistant'),
  ].join('');

  document.querySelectorAll('.hours-axis').forEach((n) => n.remove());
  hours($('hours'), c.parHeure);
  const parSource = Object.fromEntries(
    Object.entries(data.site.totaux.parSource).map(([src, evs]) => [src, evs.pageview || 0])
  );
  rows($('sources'), parSource);
  rows($('villes'), data.site.totaux.villes);
  rows($('details'), data.site.totaux.details);

  $('convs').innerHTML = data.conversations.length
    ? data.conversations
        .map(
          (cv) => `<tr data-id="${esc(cv.id)}">
        <td>${fmtDate(cv.debut)}</td>
        <td class="num">${cv.questions}${cv.limite === 'quota' ? '<span class="tag tag-hot">très intéressé</span>' : cv.limite ? `<span class="tag">${esc(cv.limite)}</span>` : ''}</td>
        <td class="num">${fmtDuree(cv.dureeSec)}</td>
        <td>${esc(cv.ville || 'inconnue')}</td>
        <td>${esc(cv.source)}</td>
        <td>${esc(cv.appareil)}</td>
        <td class="q">${esc(cv.premiereQuestion)}</td>
      </tr>`
        )
        .join('')
    : '<tr><td colspan="7" class="muted">Aucune conversation sur la période.</td></tr>';
}

async function openTranscript(id) {
  const conv = await api(`/api/admin/conversation?id=${encodeURIComponent(id)}`);
  const geo = [conv.geo?.ville, conv.geo?.codePostal, conv.geo?.region, conv.geo?.pays].filter(Boolean).join(' · ');
  $('transcript-meta').innerHTML = `<b>${fmtDate(conv.debut)}</b> · ${conv.questions} question(s) · ${fmtDuree(conv.dureeSec)}<br>
    <span class="muted">${esc(geo || 'lieu inconnu')} · ${esc(conv.source)} · ${esc(conv.appareil?.type)} ${esc(conv.appareil?.os)} ${esc(conv.appareil?.browser)} · visiteur ${esc(conv.visiteur)}</span>`;
  $('transcript-body').innerHTML = conv.messages
    .map(
      (m) => `<div class="msg ${m.role === 'user' ? 'user' : 'assistant'}"><time>${fmtTime(m.t)}${m.limite ? ` · ${esc(m.limite)}` : ''}</time>${esc(m.texte)}</div>`
    )
    .join('');
  $('transcript').showModal();
}

function showLogin() {
  $('dashboard').hidden = true;
  $('login').hidden = false;
  $('password').focus();
}

async function start() {
  try {
    await load();
    $('login').hidden = true;
    $('dashboard').hidden = false;
  } catch (err) {
    if (err.auth) showLogin();
    else $('storage-note').textContent = err.message;
  }
}

$('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('login-error').textContent = '';
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: $('password').value }),
  });
  if (res.ok) {
    $('password').value = '';
    start();
  } else {
    const data = await res.json().catch(() => ({}));
    $('login-error').textContent = data.error || 'Connexion impossible.';
  }
});

$('logout').addEventListener('click', async () => {
  await fetch('/api/admin/logout', { method: 'POST' });
  showLogin();
});

$('days').addEventListener('change', () => load().catch(() => showLogin()));
$('convs').addEventListener('click', (e) => {
  const tr = e.target.closest('tr[data-id]');
  if (tr) openTranscript(tr.dataset.id);
});
$('transcript-close').addEventListener('click', () => $('transcript').close());

initTooltip();
start();
