// Assistant de l'annonce (FAQ interactive). Le quota est appliqué côté
// serveur (api/chat.js) ; ici on affiche simplement ce qu'il renvoie.

import { annonce } from '../content/annonce.js';
import { source, sourceCode, track } from './track.js';

const SUGGESTIONS = [
  'Le vis-à-vis sur la terrasse, c’est gênant ?',
  'Que comprennent les charges ?',
  'Comment fonctionnent les 2 parkings ?',
  'Quelles écoles à proximité ?',
  'Pourquoi vendez-vous ?',
];

const STORAGE_KEY = 'chat-history';
const MAX_KEPT = 12;

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
    `Bonjour, j’ai échangé avec l’assistant du site au sujet du T4 avec terrasse à Andromède et j’aimerais vous poser quelques questions. [réf. T4A-${sourceCode}]`
  )}`;

export function initChat() {
  let history = load();
  let panel = null;
  let busy = false;

  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'chat-fab';
  fab.setAttribute('aria-label', 'Poser une question à l’assistant');
  fab.innerHTML = '<span aria-hidden="true">💬</span> Une question ?';
  document.body.appendChild(fab);

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function addBubble(role, text) {
    const list = panel.querySelector('.chat-messages');
    const b = el('div', `chat-msg chat-${role}`, text);
    list.appendChild(b);
    list.scrollTop = list.scrollHeight;
    return b;
  }

  function addWhatsAppCta(label = 'Continuer avec Corinne & Arnaud sur WhatsApp') {
    const list = panel.querySelector('.chat-messages');
    const a = el('a', 'btn-whatsapp chat-wa', label);
    a.href = waLink();
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.dataset.track = 'chat_whatsapp_click';
    list.appendChild(a);
    list.scrollTop = list.scrollHeight;
  }

  function setRemaining(n) {
    const r = panel.querySelector('.chat-remaining');
    r.textContent = typeof n === 'number' ? `${n} question${n > 1 ? 's' : ''} restante${n > 1 ? 's' : ''}` : '';
  }

  function build() {
    panel = el('div', 'chat-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Assistant de l’annonce');
    panel.innerHTML = `
      <div class="chat-head">
        <div>
          <strong>Assistant de l’annonce</strong>
          <span class="muted small">Assistant automatique (IA) · répond à partir de cette page</span>
        </div>
        <button type="button" class="chat-close" aria-label="Fermer">×</button>
      </div>
      <div class="chat-messages" aria-live="polite"></div>
      <div class="chat-suggestions"></div>
      <form class="chat-form">
        <input type="text" name="q" maxlength="500" placeholder="Votre question…" autocomplete="off" aria-label="Votre question" />
        <button type="submit" class="btn-primary">Envoyer</button>
      </form>
      <p class="chat-disclaimer">* Réponses générées par une intelligence artificielle : elles peuvent comporter des erreurs. Seuls les documents officiels (diagnostics, procès-verbaux, compromis) et les réponses écrites de Corinne & Arnaud font foi. Vos échanges sont enregistrés et lus par Corinne & Arnaud (voir <a href="#confidentialite">confidentialité</a>).</p>
      <div class="chat-foot"><span class="chat-remaining small muted"></span>
        <a class="small" href="${waLink()}" target="_blank" rel="noopener noreferrer" data-track="chat_whatsapp_click">Parler aux propriétaires</a></div>`;
    document.body.appendChild(panel);

    panel.querySelector('.chat-close').onclick = close;

    if (history.length === 0) {
      addBubble(
        'assistant',
        `Bonjour ! Je suis un assistant automatique (IA) : je réponds à vos questions sur l’appartement, vendu en direct par ${annonce.contact.noms} sans frais d’agence, et sur le quartier. Pour une visite ou une question pointue, je vous mets en relation avec eux.`
      );
    } else {
      history.forEach((m) => addBubble(m.role, m.content));
    }

    const sugg = panel.querySelector('.chat-suggestions');
    SUGGESTIONS.forEach((s) => {
      const b = el('button', 'chip', s);
      b.type = 'button';
      b.onclick = () => ask(s);
      sugg.appendChild(b);
    });

    panel.querySelector('.chat-form').onsubmit = (e) => {
      e.preventDefault();
      const input = e.target.q;
      const q = input.value.trim();
      if (!q) return;
      input.value = '';
      ask(q);
    };
  }

  async function ask(question) {
    if (busy) return;
    busy = true;
    panel.querySelector('.chat-suggestions').hidden = true;
    addBubble('user', question);
    history.push({ role: 'user', content: question });
    const pending = addBubble('assistant', '…');
    pending.classList.add('pending');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Visitor': visitorId() },
        body: JSON.stringify({ messages: history.slice(-MAX_KEPT), src: source, conversationId: conversationId() }),
      });
      const data = await res.json().catch(() => ({}));
      saveConversationId(data.conversationId);
      pending.remove();
      const reply =
        data.reply ||
        'Je ne peux pas répondre pour le moment. Le plus simple : écrivez directement à Corinne & Arnaud sur WhatsApp.';
      addBubble('assistant', reply);
      if (data.reply && !data.limitReached) history.push({ role: 'assistant', content: reply });
      else history.pop(); // la question sans réponse ne compte pas dans l'historique
      setRemaining(data.remaining);
      if (data.limitReached || data.suggestWhatsApp || !res.ok) addWhatsAppCta();
      if (data.limitReached) panel.querySelector('.chat-form').hidden = true;
      save(history);
    } catch {
      pending.remove();
      history.pop();
      addBubble('assistant', 'Connexion impossible. Vous pouvez écrire directement aux propriétaires sur WhatsApp.');
      addWhatsAppCta();
    } finally {
      busy = false;
    }
  }

  function open() {
    if (!panel) build();
    panel.classList.add('open');
    fab.hidden = true;
    track('chat_open');
    panel.querySelector('input[name="q"]').focus();
  }

  function close() {
    panel.classList.remove('open');
    fab.hidden = false;
  }

  fab.onclick = open;

  // Pas de bulle flottante tant que les boutons du haut de page sont visibles
  const headerCtas = document.querySelector('.header-ctas');
  if (headerCtas && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      fab.classList.toggle('chat-fab-hidden', entry.isIntersecting);
    }).observe(headerCtas);
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-chat]')) open();
  });
}
