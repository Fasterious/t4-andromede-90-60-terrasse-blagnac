// Contact WhatsApp. Au premier clic, une courte fenêtre invite à lire la page
// (ou à demander à l'assistant), puis « Écrire sur WhatsApp ».
// Elle n'apparaît plus ensuite, ni pour qui a déjà posé une question à
// l'assistant. Aucune donnée personnelle n'est stockée par le site.

import { annonce } from '../content/annonce.js';
import { sourceCode, track } from './track.js';

const OK_KEY = 'wa-ok';

const waHref = () =>
  `https://wa.me/${annonce.contact.whatsapp}?text=${encodeURIComponent(
    `Bonjour, le T4 avec terrasse à Andromède m’intéresse et j’aimerais le visiter. [réf. T4A-${sourceCode}]`
  )}`;

function safe(fn) {
  try {
    return fn();
  } catch {
    return null;
  }
}

// Déjà passé par la fenêtre, ou déjà échangé avec l'assistant : WhatsApp direct
const skipGate = () =>
  safe(() => window.localStorage.getItem(OK_KEY)) === '1' ||
  (safe(() => JSON.parse(window.sessionStorage.getItem('chat-history'))) || []).some((m) => m.role === 'user');

const remember = () => safe(() => window.localStorage.setItem(OK_KEY, '1'));

function buildDialog() {
  const dialog = document.createElement('dialog');
  dialog.className = 'modal wa-gate';
  dialog.setAttribute('aria-labelledby', 'wa-gate-title');
  dialog.innerHTML = `
    <div class="modal-inner">
      <button type="button" class="modal-close" aria-label="Fermer" data-close>×</button>
      <h2 id="wa-gate-title">Avant de nous écrire</h2>
      <p>Prenez le temps de bien lire la page : beaucoup de réponses y sont déjà (plan, quartier, charges, <a href="#transparence">ce qu’il faut savoir</a>). L’assistant peut aussi vous aider à trouver une information.</p>
      <p><strong>Vous avez tout lu et l’appartement vous plaît toujours ?</strong> Écrivez-nous, nous serons ravis d’échanger avec vous.</p>
      <div class="wa-gate-actions">
        <a class="cb-btn cb-wa" href="${waHref()}" target="_blank" rel="noopener noreferrer" data-track="wa_gate_continue" data-continue>Écrire sur WhatsApp</a>
        <button type="button" class="cb-btn cb-ask" data-track="wa_gate_assistant" data-open-chat>Poser une question à l’assistant</button>
      </div>
      <p class="muted small">Vous préférez ne pas utiliser WhatsApp ? Appelez ou envoyez un SMS à Corinne au <a href="tel:${annonce.contact.telephoneIntl}">${annonce.contact.telephone}</a>.</p>
    </div>`;
  document.body.appendChild(dialog);
  dialog.querySelector('[data-close]').onclick = () => dialog.close();
  dialog.querySelector('[data-continue]').addEventListener('click', () => {
    remember();
    dialog.close();
  });
  // Assistant ou lien vers une section : on ferme pour laisser la place
  dialog.querySelectorAll('[data-open-chat], a[href^="#"]').forEach((a) => a.addEventListener('click', () => dialog.close()));
  return dialog;
}

export function initContact() {
  let dialog = null;

  document.querySelectorAll('[data-wa-direct]').forEach((a) => (a.href = waHref()));

  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-wa-direct]');
    if (!link || skipGate()) return;
    e.preventDefault();
    dialog ||= buildDialog();
    track('wa_gate_open');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  });
}
