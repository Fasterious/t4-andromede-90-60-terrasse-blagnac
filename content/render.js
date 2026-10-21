// Rendu HTML statique des sections de contenu, injecté au build par vite.config.js.
// Le site reste lisible sans JavaScript et les aperçus de partage sont corrects.

import { annonce } from './annonce.js';

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const tagAConfirmer = (item) =>
  item.aConfirmer ? ' <span class="tag-confirm" title="Estimation, à confirmer">à confirmer</span>' : '';

function section(id, titre, inner, extraClass = '') {
  return `
    <section class="block ${extraClass}" id="${id}" aria-labelledby="${id}-titre">
      <h2 id="${id}-titre">${esc(titre)}</h2>
      ${inner}
    </section>`;
}

function renderDuree() {
  return `
    <aside class="banner-duree" role="note">
      <strong>En vente jusqu’au ${esc(annonce.venteJusquau)}</strong>
      <span>${esc(annonce.messageDuree)}</span>
    </aside>`;
}

function renderVideo() {
  if (!annonce.video.youtubeId) return '';
  const id = esc(annonce.video.youtubeId);
  return section(
    'video',
    'La visite en vidéo',
    `<div class="video-wrap">
       <iframe src="https://www.youtube-nocookie.com/embed/${id}?rel=0" title="Visite vidéo commentée"
         loading="lazy" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe>
     </div>
     <p class="muted">Tournée par nous, sans retouche : points forts et points d’attention.</p>`
  );
}

function renderHistoire() {
  return section(
    'histoire',
    'Notre histoire avec cet appartement',
    annonce.histoire.map((p) => `<p>${esc(p)}</p>`).join('') +
      `<p class="signature">— ${esc(annonce.contact.noms)}</p>`
  );
}

function renderPointsForts() {
  return section(
    'atouts',
    'Ce que nous aimons',
    `<ul class="cards">
      ${annonce.pointsForts
        .map((p) => `<li class="card"><h3>${esc(p.titre)}</h3><p>${esc(p.texte)}</p></li>`)
        .join('')}
    </ul>`
  );
}

function renderQuartier() {
  const groupes = {};
  for (const p of annonce.proximites) (groupes[p.categorie] ||= []).push(p);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(annonce.adresse)}`;
  return section(
    'quartier',
    'Le quartier Andromède',
    `<p class="adresse">📍 ${esc(annonce.adresse)} — <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" data-track="maps_click">calculer mes trajets</a></p>
     <div class="proxi">
      ${Object.entries(groupes)
        .map(
          ([cat, items]) => `
        <div class="proxi-group">
          <h3>${esc(cat)}</h3>
          <ul>
            ${items
              .map((i) => `<li><span>${esc(i.lieu)}</span><span class="dist">${esc(i.distance)}${tagAConfirmer(i)}</span></li>`)
              .join('')}
          </ul>
        </div>`
        )
        .join('')}
     </div>`
  );
}

function renderPointsAttention() {
  return section(
    'transparence',
    'Ce qu’il faut savoir, en toute transparence',
    `<p class="muted">Les remarques qu’on nous a faites en visite, notre expérience réelle, et les solutions.</p>
     <div class="attention-list">
      ${annonce.pointsAttention
        .map(
          (a) => `
        <details class="attention">
          <summary>${esc(a.sujet)}${tagAConfirmer(a)}</summary>
          <p><strong>Le constat.</strong> ${esc(a.constat)}</p>
          <p><strong>Notre expérience.</strong> ${esc(a.experience)}</p>
          <p><strong>Les solutions.</strong> ${esc(a.solutions)}</p>
        </details>`
        )
        .join('')}
     </div>`
  );
}

function renderFaq() {
  return section(
    'faq',
    'Questions fréquentes',
    `<div class="faq-list">
      ${annonce.faq
        .map((f) => `<details class="faq"><summary>${esc(f.q)}</summary><p>${esc(f.r)}</p></details>`)
        .join('')}
     </div>
     <button type="button" class="btn-outline" data-open-chat>Une autre question ? Demandez à notre assistant</button>`
  );
}

function renderVisite() {
  return section(
    'visite',
    'Comment se passe une visite',
    `<ol class="steps">${annonce.parcoursVisite.map((e) => `<li>${esc(e)}</li>`).join('')}</ol>
     <div class="cta-row">
       <button type="button" class="btn-primary" data-open-visit>Demander une visite</button>
     </div>`
  );
}

function renderReglementaire() {
  const r = annonce.reglementaire;
  const val = (v) => (v == null ? '<span class="muted">en cours de mise à jour</span>' : esc(v));
  return section(
    'reglementaire',
    'Informations réglementaires',
    `<ul class="reg-list">
       <li><span>Classe énergie (DPE)</span><span>${val(r.dpeEnergie)}</span></li>
       <li><span>Classe climat (GES)</span><span>${val(r.dpeClimat)}</span></li>
       <li><span>Montant estimé des dépenses annuelles d’énergie pour un usage standard</span><span>${val(r.depensesEnergie)}</span></li>
       <li><span>Copropriété</span><span>${r.copropriete ? `oui — ${esc(r.lots)} lots` : 'non'}</span></li>
       <li><span>Quote-part annuelle moyenne du budget prévisionnel</span><span>${val(r.chargesAnnuelles)}</span></li>
       <li><span>Procédure en cours</span><span>${val(r.procedures)}</span></li>
       <li><span>Surface Loi Carrez</span><span>90,5 m²</span></li>
     </ul>
     <p class="muted small">Les informations sur les risques auxquels ce bien est exposé sont disponibles sur le site Géorisques : <a href="https://www.georisques.gouv.fr" target="_blank" rel="noopener noreferrer">www.georisques.gouv.fr</a></p>`,
    'block-reg'
  );
}

export function renderSections() {
  return [
    renderVideo(),
    renderHistoire(),
    renderPointsForts(),
    renderQuartier(),
    renderPointsAttention(),
    renderFaq(),
    renderVisite(),
    renderReglementaire(),
  ].join('\n');
}

// Remplacements simples dans index.html : {{prix}}, {{titre}}…
export function renderHeaderExtras() {
  return renderDuree();
}

export function htmlVars() {
  return {
    titre: annonce.titre,
    sousTitre: annonce.sousTitre,
    quartier: annonce.quartier,
    prix: annonce.prix.affiche,
    prixNote: annonce.prix.note,
    venteJusquau: annonce.venteJusquau,
    noms: annonce.contact.noms,
    telephone: annonce.contact.telephone,
    telephoneIntl: annonce.contact.telephoneIntl,
    whatsapp: annonce.contact.whatsapp,
    description: `${annonce.titre} — ${annonce.quartier}. ${annonce.prix.affiche} net vendeur, sans frais d’agence.`,
  };
}
