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
  whatsapp: '<svg class="wa" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>',
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

  // Barre de contact (WhatsApp + assistant), masquée quand l'assistant est ouvert
  const fab = document.querySelector('.contact-bar') || document.createElement('div');

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

  // Accès direct aux propriétaires : bouton WhatsApp, et le numéro en secours
  function addWhatsAppCta(label = 'Écrire sur WhatsApp') {
    const box = el('div', 'cmsg-contact');
    box.innerHTML = `<a class="cmsg-cta" href="${waLink()}" target="_blank" rel="noopener noreferrer" data-track="chat_whatsapp_click">${ICONS.whatsapp}<span></span></a>
      <p class="cmsg-fallback">WhatsApp ne s’ouvre pas ? Appelez ou envoyez un SMS au <a href="tel:${annonce.contact.telephoneIntl}" data-track="tel_click">${annonce.contact.telephone}</a></p>`;
    box.querySelector('span').textContent = label;
    thread.appendChild(box);
    scrollToEnd();
  }

  // La réponse renvoie vers les propriétaires : on met le bouton juste dessous
  const mentionsContact = (text) => /whatsapp|corinne|arnaud|propriétaires|06 23|téléphone|contactez|écrivez|visite/i.test(text);

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
      else if (data.limitReached || data.suggestWhatsApp || !res.ok || mentionsContact(reply)) addWhatsAppCta();
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
      `Contact : ${annonce.contact.noms}, WhatsApp ${annonce.contact.whatsappAffiche}, appel ou SMS ${annonce.contact.telephone}`,
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

  // Sur grand écran, la barre flottante s'efface seulement quand elle
  // recouvrirait le bouton « Demander une visite » de l'en-tête.
  document.querySelectorAll('[data-open-chat]').forEach((b) => b.addEventListener('click', open));
  const headerCta = document.querySelector('.header-ctas [data-open-visit]');
  if (headerCta) {
    let queued = false;
    const check = () => {
      queued = false;
      if (window.matchMedia('(max-width: 700px)').matches) return fab.classList.remove('is-tucked');
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
