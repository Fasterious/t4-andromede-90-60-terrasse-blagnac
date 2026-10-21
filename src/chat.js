// Assistant de l'annonce (FAQ interactive). Le quota est appliqué côté
// serveur (api/chat.js) ; ici on affiche simplement ce qu'il renvoie.
// Interface inspirée des assistants modernes : en-tête fixe, fil de messages
// épuré, suggestions toujours visibles, zone de saisie qui suit le clavier.

import { annonce } from '../content/annonce.js';
import { source, sourceCode, track } from './track.js';

const SUGGESTIONS = [
  'Le vis-à-vis sur la terrasse, c’est gênant ?',
  'Que comprennent les charges ?',
  'Comment fonctionnent les 2 parkings ?',
  'Quelles écoles à proximité ?',
  'Pourquoi vendez-vous ?',
  'Comment se passe une visite ?',
];
const VISIT_CHIP = 'Organiser une visite';

const STORAGE_KEY = 'chat-history';
const MAX_KEPT = 12;

const ICONS = {
  house:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>',
  chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
  save: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/></svg>',
};

const AI_NOTE = 'Attention, il s’agit d’une IA : toute IA peut commettre des erreurs.';
const NOTICE = 'Conversation avec une IA : elle peut se tromper. Pour une réponse sûre, voyez avec Corinne et Arnaud.';

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const isTouch = () => window.matchMedia?.('(pointer: coarse)').matches;

function load() {
  try {
    return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save(history) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_KEPT)));
  } catch {
    // ignore
  }
}

function visitorId() {
  try {
    let id = window.localStorage.getItem('vid');
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      window.localStorage.setItem('vid', id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

function conversationId() {
  try {
    return window.sessionStorage.getItem('chat-conversation') || null;
  } catch {
    return null;
  }
}

function saveConversationId(id) {
  try {
    if (id) window.sessionStorage.setItem('chat-conversation', id);
  } catch {
    // ignore
  }
}

const waLink = () =>
  `https://wa.me/${annonce.contact.whatsapp}?text=${encodeURIComponent(
    `Bonjour, j’ai posé plusieurs questions à l’assistant du site au sujet du T4 avec terrasse à Andromède et j’aimerais continuer avec vous. [réf. T4A-${sourceCode}]`
  )}`;

export function initChat() {
  let history = load();
  let panel = null;
  let thread = null;
  let scroller = null;
  let input = null;
  let busy = false;
  const asked = new Set(history.filter((m) => m.role === 'user').map((m) => m.content));

  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'chat-fab';
  fab.setAttribute('aria-label', 'Poser une question à l’assistant');
  fab.innerHTML = `${ICONS.chat}<span>Une question ?</span>`;
  document.body.appendChild(fab);

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  const scrollToEnd = (smooth = true) =>
    scroller?.scrollTo({ top: scroller.scrollHeight, behavior: smooth && !reducedMotion() ? 'smooth' : 'auto' });

  // Message de l'assistant : texte libre avec un petit avatar, sans bulle
  function addAssistant(text, { animate = false } = {}) {
    const row = el('div', 'cmsg cmsg-assistant');
    row.innerHTML = `<span class="cmsg-avatar">${ICONS.house}</span>`;
    const body = el('div', 'cmsg-text');
    row.appendChild(body);
    thread.appendChild(row);
    if (!animate || reducedMotion()) {
      body.textContent = text;
      scrollToEnd();
      return Promise.resolve(row);
    }
    // Apparition progressive, mot à mot (au plus ~1,2 s)
    const words = text.split(/(\s+)/);
    const step = Math.max(8, Math.min(28, 1200 / words.length));
    let i = 0;
    return new Promise((resolve) => {
      const tick = () => {
        i = Math.min(words.length, i + 2);
        body.textContent = words.slice(0, i).join('');
        scroller.scrollTop = scroller.scrollHeight;
        if (i < words.length) setTimeout(tick, step);
        else resolve(row);
      };
      tick();
    });
  }

  function addUser(text) {
    const row = el('div', 'cmsg cmsg-user');
    row.appendChild(el('div', 'cmsg-bubble', text));
    thread.appendChild(row);
    scrollToEnd();
  }

  function addTyping() {
    const row = el('div', 'cmsg cmsg-assistant');
    row.innerHTML = `<span class="cmsg-avatar">${ICONS.house}</span><div class="typing" aria-label="L’assistant écrit"><i></i><i></i><i></i></div>`;
    thread.appendChild(row);
    scrollToEnd();
    return row;
  }

  function addWhatsAppCta(label = 'Continuer avec Corinne & Arnaud sur WhatsApp') {
    const a = el('a', 'cmsg-cta', label);
    a.href = waLink();
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.dataset.track = 'chat_whatsapp_click';
    thread.appendChild(a);
    scrollToEnd();
  }

  // Suggestions : toujours visibles au-dessus de la saisie ; celles déjà
  // posées disparaissent et « Organiser une visite » reste en dernier.
  function renderChips() {
    const row = panel.querySelector('.chat-chips');
    row.innerHTML = '';
    const left = SUGGESTIONS.filter((s) => !asked.has(s));
    for (const s of [...left, VISIT_CHIP]) {
      const b = el('button', s === VISIT_CHIP ? 'chip chip-visit' : 'chip', s);
      b.type = 'button';
      b.onclick = () => {
        if (s === VISIT_CHIP) {
          close();
          document.querySelector('[data-open-visit]')?.click();
          return;
        }
        ask(s);
      };
      row.appendChild(b);
    }
    row.scrollLeft = 0;
  }

  function setRemaining(n) {
    const r = panel.querySelector('.chat-remaining');
    r.textContent = typeof n === 'number' ? `${n} question${n > 1 ? 's' : ''} restante${n > 1 ? 's' : ''} aujourd’hui` : '';
  }

  function autosize() {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
    panel.querySelector('.chat-send').disabled = !input.value.trim() || busy;
  }

  // Le panneau occupe tout l'écran et épouse la zone visible au-dessus du clavier :
  // l'en-tête, les suggestions et la saisie restent à l'écran.
  function fit() {
    if (!panel?.classList.contains('open')) return;
    const vv = window.visualViewport;
    if (vv) {
      panel.style.top = `${vv.offsetTop}px`;
      panel.style.height = `${vv.height}px`;
    } else {
      panel.style.top = '';
      panel.style.height = '';
    }
    scroller.scrollTop = scroller.scrollHeight;
  }

  function build() {
    panel = el('div', 'chat-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Assistant de l’annonce');
    panel.innerHTML = `
      <header class="chat-head">
        <span class="chat-head-avatar">${ICONS.house}</span>
        <div class="chat-head-title">
          <strong>Assistant de l’annonce</strong>
          <span>IA · vente en direct par ${annonce.contact.noms}</span>
        </div>
        <button type="button" class="chat-save" aria-label="Enregistrer la conversation" title="Enregistrer la conversation">${ICONS.save}<span>Enregistrer</span></button>
        <button type="button" class="chat-icon-btn chat-close" aria-label="Fermer">${ICONS.close}</button>
      </header>
      <div class="chat-scroll">
        <div class="chat-thread" aria-live="polite"></div>
      </div>
      <div class="chat-bottom">
        <div class="chat-chips" aria-label="Suggestions de questions"></div>
        <form class="chat-composer">
          <textarea rows="1" maxlength="500" placeholder="Posez votre question…" aria-label="Votre question" enterkeyhint="send"></textarea>
          <button type="submit" class="chat-send" aria-label="Envoyer" disabled>${ICONS.send}</button>
        </form>
        <div class="chat-meta">
          <span class="chat-remaining"></span>
          <a href="${waLink()}" target="_blank" rel="noopener noreferrer" data-track="chat_whatsapp_click">Parler aux propriétaires</a>
        </div>
      </div>`;
    document.body.appendChild(panel);

    thread = panel.querySelector('.chat-thread');
    scroller = panel.querySelector('.chat-scroll');
    input = panel.querySelector('textarea');

    panel.querySelector('.chat-close').onclick = () => close();
    panel.querySelector('.chat-save').onclick = saveConversation;
    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    panel.classList.toggle('is-empty', history.length === 0);
    // Accueil court, suivi de l'avertissement IA en italique
    addAssistant(`Bonjour ! Une question sur l’appartement ou le quartier ? Vente en direct, sans frais d’agence.`).then((row) =>
      row.querySelector('.cmsg-text').insertAdjacentHTML('beforeend', `<em class="cmsg-ai-note">${AI_NOTE}</em>`)
    );
    history.forEach((m) => (m.role === 'user' ? addUser(m.content) : addAssistant(m.content)));
    renderChips();

    input.addEventListener('input', autosize);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        panel.querySelector('.chat-composer').requestSubmit();
      }
    });
    panel.querySelector('.chat-composer').onsubmit = (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q || busy) return;
      input.value = '';
      autosize();
      ask(q);
    };

    window.visualViewport?.addEventListener('resize', fit);
    window.visualViewport?.addEventListener('scroll', fit);
    window.addEventListener('resize', fit);
  }

  async function ask(question) {
    if (busy) return;
    busy = true;
    autosize();
    asked.add(question);
    panel.classList.remove('is-empty');
    renderChips();
    addUser(question);
    history.push({ role: 'user', content: question });
    const typing = addTyping();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Visitor': visitorId() },
        body: JSON.stringify({ messages: history.slice(-MAX_KEPT), src: source, conversationId: conversationId() }),
      });
      const data = await res.json().catch(() => ({}));
      saveConversationId(data.conversationId);
      typing.remove();
      const reply =
        data.reply ||
        'L’assistant ne peut pas répondre pour l’instant. Corinne & Arnaud vous répondent directement sur WhatsApp ou au téléphone.';
      await addAssistant(reply, { animate: true });
      if (data.reply && !data.limitReached) history.push({ role: 'assistant', content: reply });
      else history.pop(); // la question sans réponse ne compte pas dans l'historique
      setRemaining(data.remaining);
      if (data.limitReached && data.remaining === 0) addWhatsAppCta('Parler à Corinne & Arnaud sur WhatsApp');
      else if (data.limitReached || data.suggestWhatsApp || !res.ok) addWhatsAppCta();
      if (data.limitReached) panel.querySelector('.chat-composer').hidden = true;
      save(history);
      panel.querySelector('.chat-save').disabled = !history.length;
    } catch {
      typing.remove();
      history.pop();
      await addAssistant('Connexion impossible. Vous pouvez écrire directement aux propriétaires sur WhatsApp.');
      addWhatsAppCta();
    } finally {
      busy = false;
      autosize();
    }
  }

  // Enregistre la conversation dans un fichier texte (partage natif sur mobile),
  // avec l'avertissement IA en tête.
  async function saveConversation() {
    if (!history.length) return;
    const date = new Date();
    const lines = [
      `Conversation avec l’assistant de l’annonce : ${annonce.titre}, ${annonce.adresse}`,
      `Enregistrée le ${date.toLocaleString('fr-FR')}`,
      '',
      `AVERTISSEMENT. ${NOTICE} Seuls les documents officiels (diagnostics, procès-verbaux, compromis) et les réponses écrites des propriétaires font foi.`,
      '',
      ...history.map((m) => `${m.role === 'user' ? 'Vous' : 'Assistant (IA)'} : ${m.content}\n`),
      `Contact : ${annonce.contact.noms}, ${annonce.contact.telephone} (WhatsApp)`,
      `Annonce : ${window.location.origin}`,
    ];
    const name = `conversation-T4-Andromede-${date.toISOString().slice(0, 10)}.txt`;
    const file = new File([lines.join('\n')], name, { type: 'text/plain' });
    track('chat_save');
    try {
      if (isTouch() && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Conversation T4 Andromède' });
        return;
      }
    } catch {
      return; // partage annulé
    }
    const url = URL.createObjectURL(file);
    const a = el('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // La page derrière ne bouge plus tant que l'assistant est ouvert
  let savedScroll = 0;
  function lockPage() {
    savedScroll = window.scrollY;
    Object.assign(document.body.style, { position: 'fixed', top: `-${savedScroll}px`, left: '0', right: '0', width: '100%' });
    document.documentElement.classList.add('chat-open');
  }
  function unlockPage() {
    Object.assign(document.body.style, { position: '', top: '', left: '', right: '', width: '' });
    document.documentElement.classList.remove('chat-open');
    window.scrollTo(0, savedScroll);
  }

  function open() {
    if (!panel) build();
    if (panel.classList.contains('open')) return;
    lockPage();
    panel.classList.add('open');
    fab.hidden = true;
    panel.querySelector('.chat-save').disabled = !history.length;
    // Le bouton « retour » du téléphone ferme l'assistant au lieu de quitter la page
    window.history.pushState({ chat: true }, '');
    track('chat_open');
    fit();
    scrollToEnd(false);
    // Sur mobile, on laisse voir l'accueil et les suggestions avant d'ouvrir le clavier
    if (!isTouch()) input.focus();
  }

  function close(fromHistory = false) {
    if (!panel?.classList.contains('open')) return;
    panel.classList.remove('open');
    unlockPage();
    fab.hidden = false;
    if (!fromHistory && window.history.state?.chat) window.history.back();
  }

  window.addEventListener('popstate', () => close(true));

  // Seule entrée vers l'assistant : la bulle. Elle s'efface seulement quand
  // elle recouvrirait le bouton « Demander une visite » de l'en-tête.
  fab.onclick = open;
  const headerCta = document.querySelector('.header-ctas [data-open-visit]');
  if (headerCta) {
    let queued = false;
    const check = () => {
      queued = false;
      const a = headerCta.getBoundingClientRect();
      const b = fab.getBoundingClientRect();
      const overlap = a.bottom > b.top && a.top < b.bottom && a.right > b.left && a.left < b.right;
      fab.classList.toggle('is-tucked', overlap);
    };
    const schedule = () => {
      if (!queued) (queued = true), requestAnimationFrame(check);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    check();
  }
}
