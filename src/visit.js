// « Demander une visite » : quelques questions rapides, puis le message
// pré-rempli part sur notre WhatsApp. Aucune donnée personnelle n'est
// stockée par le site : tout reste dans la conversation WhatsApp.

import { annonce } from '../content/annonce.js';
import { sourceCode, track } from './track.js';

const QUESTIONS = [
  {
    name: 'projet',
    label: 'Votre projet',
    options: ['Résidence principale', 'Investissement locatif', 'Autre'],
  },
  {
    name: 'financement',
    label: 'Votre financement',
    options: [
      'Achat comptant',
      'Prêt — accord de principe ou attestation obtenus',
      'Prêt — simulation faite avec banque ou courtier',
      'Prêt — pas encore étudié',
    ],
  },
  {
    name: 'vente',
    label: 'Avez-vous un bien à vendre pour acheter ?',
    options: ['Non', 'Oui, compromis déjà signé', 'Oui, pas encore vendu'],
  },
  {
    name: 'delai',
    label: 'Votre calendrier',
    options: ['Dès que possible', 'D’ici 3 mois', 'Plus tard'],
  },
];

function buildDialog() {
  const dialog = document.createElement('dialog');
  dialog.className = 'modal';
  dialog.id = 'visit-dialog';
  dialog.setAttribute('aria-labelledby', 'visit-title');
  dialog.innerHTML = `
    <form method="dialog" class="modal-inner" id="visit-form">
      <button type="button" class="modal-close" aria-label="Fermer" data-close>×</button>
      <h2 id="visit-title">Demander une visite</h2>
      <p class="muted">Quatre questions rapides : elles nous permettent de vous proposer un créneau rapidement. Votre message s’ouvrira ensuite dans WhatsApp, prêt à envoyer.</p>
      <label class="field">
        <span>Votre prénom</span>
        <input type="text" name="prenom" required maxlength="40" autocomplete="given-name" />
      </label>
      ${QUESTIONS.map(
        (q) => `
        <fieldset class="field">
          <legend>${q.label}</legend>
          ${q.options
            .map(
              (o) => `
            <label class="choice"><input type="radio" name="${q.name}" value="${o}" required /> ${o}</label>`
            )
            .join('')}
        </fieldset>`
      ).join('')}
      <label class="field">
        <span>Vos disponibilités pour visiter <em class="muted">(facultatif)</em></span>
        <input type="text" name="dispos" maxlength="120" placeholder="ex. samedi matin, soirs de semaine" />
      </label>
      <label class="choice check">
        <input type="checkbox" name="lu" required />
        J’ai pris connaissance des points d’attention (vis-à-vis, parkings en enfilade, charges).
      </label>
      <div class="modal-actions">
        <button type="submit" class="btn-primary">Ouvrir WhatsApp avec mon message</button>
      </div>
      <p class="muted small">Pas WhatsApp ? Appelez-nous au <a href="tel:${annonce.contact.telephoneIntl}">${annonce.contact.telephone}</a>.</p>
    </form>`;
  document.body.appendChild(dialog);
  return dialog;
}

function buildMessage(data) {
  const lignes = [
    `Bonjour ${annonce.contact.noms}, je suis ${data.get('prenom')} et je souhaite visiter le T4 avec terrasse à Andromède.`,
    '',
    `• Projet : ${data.get('projet')}`,
    `• Financement : ${data.get('financement')}`,
    `• Bien à vendre : ${data.get('vente')}`,
    `• Calendrier : ${data.get('delai')}`,
  ];
  const dispos = (data.get('dispos') || '').trim();
  if (dispos) lignes.push(`• Disponibilités : ${dispos}`);
  lignes.push('', 'J’ai lu les points d’attention sur le site.', `[réf. T4A-${sourceCode}]`);
  return lignes.join('\n');
}

export function initVisit() {
  let dialog = null;

  const open = () => {
    dialog ||= buildDialog();
    const form = dialog.querySelector('#visit-form');
    dialog.querySelector('[data-close]').onclick = () => dialog.close();
    form.onsubmit = (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const url = `https://wa.me/${annonce.contact.whatsapp}?text=${encodeURIComponent(buildMessage(data))}`;
      track('visit_request', { financement: data.get('financement'), projet: data.get('projet') });
      window.open(url, '_blank', 'noopener');
      dialog.close();
    };
    track('visit_open');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  };

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-visit]')) open();
  });

  // Lien WhatsApp direct : message court, avec la référence de source
  const wa = document.getElementById('wa-direct');
  if (wa) {
    const text = `Bonjour, je vous contacte au sujet du T4 avec terrasse à Andromède. Pourrais-je avoir quelques renseignements ? [réf. T4A-${sourceCode}]`;
    wa.href = `https://wa.me/${annonce.contact.whatsapp}?text=${encodeURIComponent(text)}`;
  }
}
