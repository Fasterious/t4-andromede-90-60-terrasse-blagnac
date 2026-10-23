// Rendu HTML statique des sections de contenu, injecté au build par vite.config.js.
// Le site reste lisible sans JavaScript et les aperçus de partage sont corrects.

import { annonce } from './annonce.js';
import { icon } from './icons.js';
import { planSvg } from './plan.js';

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const tagAConfirmer = (item) =>
  item.projet
    ? ' <span class="tag-confirm" title="Pas encore ouvert">projet</span>'
    : item.aConfirmer
      ? ' <span class="tag-confirm" title="Estimation, à confirmer">à confirmer</span>'
      : '';

// Fonds alternés : une section sur deux en vert très léger (Contact, en fin de page, reste blanc)
const BANDES = {
  atouts: 'band band-vert',
  quartier: 'band band-vert',
  faq: 'band band-vert',
  reglementaire: 'band band-vert',
};

// Information secondaire repliée derrière un petit bouton « i » à droite du titre
const INFOS = {
  plan: () => annonce.plan.mention,
  reglementaire: () =>
    'Les dépenses d’énergie ci-dessous sont une estimation réglementaire du diagnostic (DPE), pour un usage standard. Dans la réalité, le chauffage et l’eau sont compris dans les charges (environ 235 € par mois), et notre facture d’électricité est d’environ 45 € par mois.',
};

// **gras** dans les textes simples (après échappement)
const gras = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

function section(id, titre, inner, extraClass = '') {
  const info = INFOS[id]?.();
  const titreHtml = `<h2 id="${id}-titre">${esc(titre)}</h2>`;
  const tete = info
    ? `<div class="block-head">
        ${titreHtml}
        <button type="button" class="info-btn" aria-expanded="false" aria-controls="${id}-info" aria-label="En savoir plus" data-info-toggle>${icon('Info', 'ico ico-sm')}</button>
      </div>
      <p class="info-panel" id="${id}-info" hidden>${esc(info)}</p>`
    : titreHtml;
  return `
    <section class="block ${[BANDES[id], extraClass].filter(Boolean).join(' ')}" id="${id}" aria-labelledby="${id}-titre">
      ${tete}
      ${inner}
    </section>`;
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
      `<p class="signature">${esc(annonce.contact.noms)}</p>`
  );
}

function renderPlan() {
  return section(
    'plan',
    'Plan de l’appartement',
    `<figure class="plan">
       <div class="plan-large">${planSvg()}</div>
       <div class="plan-haut">${planSvg({ portrait: true })}</div>
     </figure>
     <a class="btn-outline plan-ouvrir" href="/plan.svg" target="_blank" rel="noopener" data-track="plan_open">Ouvrir le plan en grand</a>`
  );
}

function renderPointsForts() {
  return section(
    'atouts',
    'Ce que nous aimons',
    `<ul class="cards">
      ${annonce.pointsForts
        .map(
          (p) => `<li class="card">
            <span class="badge">${icon(p.icone)}</span>
            <div><h3>${esc(p.titre)}</h3><p>${esc(p.texte)}</p></div>
          </li>`
        )
        .join('')}
    </ul>`
  );
}

// Points de la carte : l'appartement, puis chaque lieu dont la position est connue,
// chacun avec sa propre goutte (le rangement des gouttes qui se touchent se fait
// dans le navigateur, selon le zoom : src/main.js).
function carteData() {
  return [
    { gps: annonce.gps, maison: true, svg: icon('House', 'ico'), nom: 'L’appartement', detail: annonce.adresse },
    ...annonce.proximites
      .filter((p) => p.gps)
      .map((p) => ({ gps: p.gps, maison: false, projet: !!p.projet, svg: icon(p.icone, 'ico'), nom: p.lieu, detail: p.distance })),
  ];
}

function renderQuartier() {
  const groupes = {};
  for (const p of annonce.proximites) (groupes[p.categorie] ||= []).push(p);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(annonce.adresse)}`;
  return section(
    'quartier',
    'Le quartier Andromède',
    `<p class="adresse">${icon('MapPin', 'ico ico-sm')} ${esc(annonce.adresse)} <span class="sep">·</span> <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" data-track="maps_click">calculer mes trajets</a></p>
     <div class="carte" id="carte-quartier" data-points="${esc(JSON.stringify(carteData()))}" role="region" aria-label="Carte du quartier : l’appartement et les lieux proches"></div>
     <details class="proxi-details">
       <summary><span>Temps de trajet depuis l’appartement · ${annonce.proximites.length} lieux</span></summary>
     <div class="proxi">
      ${Object.entries(groupes)
        .map(
          ([cat, items]) => `
        <div class="proxi-group">
          <h3>${esc(cat)}</h3>
          <ul>
            ${items
              .map(
                (i) =>
                  `<li><span class="lieu">${icon(i.icone, 'ico ico-sm')}<span>${esc(i.lieu)}</span></span><span class="dist">${esc(i.distance)}${tagAConfirmer(i)}</span></li>`
              )
              .join('')}
          </ul>
        </div>`
        )
        .join('')}
     </div>
     </details>`
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
          <summary>${icon(a.icone, 'ico ico-sm')}<span>${esc(a.sujet)}${tagAConfirmer(a)}</span></summary>
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
     <div class="faq-ask">
       <span class="faq-ask-ico">${icon('MessageCircleQuestion', 'ico')}</span>
       <div class="faq-ask-txt">
         <p class="faq-ask-titre">Une autre question ?</p>
         <p>Notre assistant connaît tout le contenu de cette page et vous répond tout de suite.</p>
       </div>
       <button type="button" class="faq-ask-btn" data-open-chat data-track="faq_assistant">Poser ma question ${icon('ArrowRight', 'ico')}</button>
     </div>`
  );
}

function renderVisite() {
  return section(
    'visite',
    'Comment nous vous proposons d’avancer',
    `<ol class="steps">${annonce.parcoursVisite.map((e) => `<li>${gras(e)}</li>`).join('')}</ol>`
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
       <li><span>Montant estimé des dépenses annuelles d’énergie pour un usage standard${r.depensesEnergieNote ? `<br><small class="muted">${esc(r.depensesEnergieNote)}</small>` : ''}</span><span>${val(r.depensesEnergie)}</span></li>
       <li><span>Copropriété</span><span>${r.copropriete ? `oui, ${esc(r.lots)} lots` : 'non'}</span></li>
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
    renderPlan(),
    renderQuartier(),
    renderPointsAttention(),
    renderFaq(),
    renderVisite(),
    renderReglementaire(),
  ].join('\n');
}

// Remplacements simples dans index.html : {{prix}}, {{titre}}…
function renderChiffresCles() {
  return `
    <ul class="key-facts" aria-label="Chiffres clés">
      ${annonce.chiffresCles
        .map(
          (c) => `<li>${icon(c.icone)}<span class="kf-val">${esc(c.valeur)}</span><span class="kf-label">${esc(c.label)}</span></li>`
        )
        .join('')}
    </ul>`;
}

const SEP = '<span class="sep" aria-hidden="true">·</span>';

// Surtitre du bandeau : type de bien et quartier (le détail est dans les chiffres clés)
export function renderSurtitre() {
  return `<span class="hs-type">T4 à vendre</span> ${SEP} ${esc(annonce.quartier)}`;
}

export function renderEnDirect() {
  return `<p class="en-direct">${icon('Handshake', 'ico ico-sm')}<span>${esc(annonce.enDirect)}</span></p>`;
}

export function renderHeaderExtras() {
  return renderChiffresCles();
}

export function htmlVars() {
  return {
    titre: annonce.titre,
    quartier: annonce.quartier,
    prix: annonce.prix.affiche,
    noms: annonce.contact.noms,
    telephone: annonce.contact.telephone,
    telephoneIntl: annonce.contact.telephoneIntl,
    whatsapp: annonce.contact.whatsapp,
    description: `${annonce.titre}, ${annonce.quartier}. ${annonce.prix.affiche} net vendeur, sans frais d’agence.`,
  };
}
