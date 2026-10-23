import { initTracking, track } from './track.js';
import { initContact } from './contact.js';
import { initChat } from './chat.js';

const galleryEl = document.getElementById('gallery');
const lightbox = document.getElementById('lightbox');
const lbStage = document.getElementById('lb-stage');
const slidePrev = document.getElementById('lb-slide-prev');
const slideCurr = document.getElementById('lb-slide-curr');
const slideNext = document.getElementById('lb-slide-next');
const lbCaption = document.getElementById('lb-caption');
const lbCounter = document.getElementById('lb-counter');
const lbThumbs = document.getElementById('lb-thumbs');
const btnClose = document.getElementById('lb-close');
const btnPrev = document.getElementById('lb-prev');
const btnNext = document.getElementById('lb-next');
const btnOpenGallery = document.getElementById('open-gallery');

const slides = [slidePrev, slideCurr, slideNext];

let photos = [];
let currentIndex = 0;
let isOpen = false;
let isAnimating = false;

// Drag state
let dragStartX = 0;
let dragStartY = 0;
let dragDeltaX = 0;
let isDragging = false;
const SWIPE_THRESHOLD_RATIO = 0.22; // fraction de la largeur pour valider le swipe
const SLIDE_DURATION = 320; // ms : doit matcher la transition CSS .sliding

function wrap(i) {
  return (i + photos.length) % photos.length;
}

async function loadPhotos() {
  const res = await fetch('/photos/photos.json');
  photos = await res.json();
  renderGallery();
  renderThumbs();
}

function renderGallery() {
  galleryEl.innerHTML = photos
    .map(
      (photo, i) => `
    <button type="button" class="gallery-item" data-index="${i}" aria-label="Ouvrir : ${photo.caption}">
      <img src="${photo.src}" alt="${photo.alt}" loading="${i < 2 ? 'eager' : 'lazy'}" />
      <span class="caption">${photo.caption}</span>
    </button>`
    )
    .join('');

  galleryEl.querySelectorAll('.gallery-item').forEach((btn) => {
    btn.addEventListener('click', () => openLightbox(Number(btn.dataset.index)));
  });
  initCarousel();
}

// Bandeau horizontal : compteur « 3 / 9 », points de progression, flèches
// (souris) et retour sur la dernière photo vue en refermant le plein écran
const galleryCount = document.getElementById('gallery-count');
const galleryDots = document.getElementById('gallery-dots');
const galleryPrev = document.getElementById('gallery-prev');
const galleryNext = document.getElementById('gallery-next');
let carouselIndex = 0;

function carouselStep() {
  const items = galleryEl.children;
  return items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : galleryEl.clientWidth;
}

function showCarousel(i) {
  carouselIndex = Math.max(0, Math.min(photos.length - 1, i));
  galleryCount.textContent = `${carouselIndex + 1} / ${photos.length}`;
  [...galleryDots.children].forEach((d, k) => d.classList.toggle('on', k === carouselIndex));
  galleryPrev.disabled = carouselIndex === 0;
  galleryNext.disabled = carouselIndex === photos.length - 1;
}

function scrollCarousel(i) {
  const target = Math.max(0, Math.min(photos.length - 1, i));
  galleryEl.scrollTo({ left: target * carouselStep() });
}

function initCarousel() {
  galleryDots.innerHTML = photos.map((p, i) => `<button type="button" aria-label="Photo ${i + 1}" data-i="${i}"></button>`).join('');
  galleryDots.addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]');
    if (b) scrollCarousel(Number(b.dataset.i));
  });
  let queued = false;
  galleryEl.addEventListener(
    'scroll',
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        const max = galleryEl.scrollWidth - galleryEl.clientWidth;
        // En butée à droite, la dernière photo est la courante
        const i = galleryEl.scrollLeft >= max - 2 ? photos.length - 1 : Math.round(galleryEl.scrollLeft / carouselStep());
        if (i !== carouselIndex) showCarousel(i);
      });
    },
    { passive: true }
  );
  galleryPrev.addEventListener('click', () => scrollCarousel(carouselIndex - 1));
  galleryNext.addEventListener('click', () => scrollCarousel(carouselIndex + 1));
  showCarousel(0);
}

function renderThumbs() {
  lbThumbs.innerHTML = photos
    .map(
      (photo, i) => `
    <button
      type="button"
      class="lb-thumb${i === currentIndex ? ' active' : ''}"
      data-index="${i}"
      role="tab"
      aria-selected="${i === currentIndex}"
      aria-label="${photo.caption}"
    >
      <img src="${photo.src}" alt="" loading="lazy" />
    </button>`
    )
    .join('');

  lbThumbs.querySelectorAll('.lb-thumb').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      jumpTo(Number(btn.dataset.index));
    });
  });
}

function scrollThumbIntoView() {
  const active = lbThumbs.querySelector('.lb-thumb.active');
  if (active) {
    active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }
}

function updateThumbSelection() {
  lbThumbs.querySelectorAll('.lb-thumb').forEach((btn, i) => {
    const selected = i === currentIndex;
    btn.classList.toggle('active', selected);
    btn.setAttribute('aria-selected', String(selected));
  });
  scrollThumbIntoView();
}

function setSlideContent(el, photoIndex) {
  const photo = photos[photoIndex];
  const img = el.querySelector('.lb-slide-img');
  const bg = el.querySelector('.lb-slide-bg');
  img.src = photo.src;
  img.alt = photo.alt;
  bg.style.backgroundImage = `url("${photo.src}")`;
}

// Prépare le trio prev/curr/next autour de l'index courant
function layoutSlides() {
  setSlideContent(slidePrev, wrap(currentIndex - 1));
  setSlideContent(slideCurr, currentIndex);
  setSlideContent(slideNext, wrap(currentIndex + 1));
}

// Repositionne les 3 volets à leur place canonique (-100% / 0% / 100%)
function resetTransforms(withTransition) {
  slides.forEach((el) => el.classList.toggle('sliding', withTransition));
  slidePrev.style.transform = 'translateX(-100%)';
  slideCurr.style.transform = 'translateX(0%)';
  slideNext.style.transform = 'translateX(100%)';
}

function updateMeta() {
  const photo = photos[currentIndex];
  lbCaption.textContent = photo.caption;
  lbCounter.textContent = `${currentIndex + 1} / ${photos.length}`;
  updateThumbSelection();
}

async function enterNativeFullscreen() {
  try {
    if (lightbox.requestFullscreen) await lightbox.requestFullscreen();
    else if (lightbox.webkitRequestFullscreen) await lightbox.webkitRequestFullscreen();
  } catch {
    // iOS Safari ne supporte pas requestFullscreen : l'overlay fixed suffit
  }
}

async function exitNativeFullscreen() {
  try {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
    }
  } catch {
    // ignore
  }
}

async function openLightbox(index) {
  track('gallery_open');
  currentIndex = index;
  isOpen = true;
  lightbox.hidden = false;
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  layoutSlides();
  resetTransforms(false);
  updateMeta();
  await enterNativeFullscreen();
}

async function closeLightbox() {
  isOpen = false;
  await exitNativeFullscreen();
  lightbox.hidden = true;
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  scrollCarousel(currentIndex);
}

// Fait glisser tout le bandeau d'un cran (direction +1 = suivante, -1 = précédente),
// avec une vraie transition d'entraînement façon carrousel.
function commitSlide(direction) {
  if (isAnimating || photos.length < 2) return;
  isAnimating = true;

  const shift = direction > 0 ? -100 : 100; // % à parcourir

  slides.forEach((el) => el.classList.add('sliding'));
  slidePrev.style.transform = `translateX(${shift - 100}%)`;
  slideCurr.style.transform = `translateX(${shift}%)`;
  slideNext.style.transform = `translateX(${shift + 100}%)`;

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    slideCurr.removeEventListener('transitionend', finish);
    currentIndex = wrap(currentIndex + direction);
    layoutSlides();
    resetTransforms(false);
    updateMeta();
    isAnimating = false;
  };

  slideCurr.addEventListener('transitionend', finish, { once: true });
  // Filet de sécurité si transitionend ne se déclenche pas (ex: onglet en arrière-plan)
  setTimeout(finish, SLIDE_DURATION + 80);
}

// Relâché sous le seuil : retour élastique à la position d'origine, sans changer de photo
function springBack() {
  slides.forEach((el) => el.classList.add('sliding'));
  resetTransforms(true);
  setTimeout(() => {
    slides.forEach((el) => el.classList.remove('sliding'));
  }, SLIDE_DURATION);
}

function goPrev() {
  commitSlide(-1);
}

function goNext() {
  commitSlide(1);
}

// Saut depuis une vignette : glissement si adjacent, fondu rapide sinon
function jumpTo(index) {
  if (index === currentIndex || isAnimating) return;

  const forwardDist = wrap(index - currentIndex);
  const backwardDist = wrap(currentIndex - index);

  if (forwardDist === 1) {
    commitSlide(1);
    return;
  }
  if (backwardDist === 1) {
    commitSlide(-1);
    return;
  }

  isAnimating = true;
  slideCurr.style.opacity = '0';
  setTimeout(() => {
    currentIndex = index;
    layoutSlides();
    resetTransforms(false);
    slideCurr.style.opacity = '1';
    updateMeta();
    isAnimating = false;
  }, 150);
}

// Glissement tactile
function onTouchStart(e) {
  if (!isOpen || isAnimating) return;
  const touch = e.touches[0];
  dragStartX = touch.clientX;
  dragStartY = touch.clientY;
  dragDeltaX = 0;
  isDragging = false;
}

function onTouchMove(e) {
  if (!isOpen || isAnimating) return;
  const touch = e.touches[0];
  const dx = touch.clientX - dragStartX;
  const dy = touch.clientY - dragStartY;

  if (!isDragging && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
    isDragging = true;
  }

  if (isDragging) {
    e.preventDefault();
    dragDeltaX = dx;
    const px = `${dx}px`;
    slidePrev.style.transform = `translateX(calc(-100% + ${px}))`;
    slideCurr.style.transform = `translateX(${px})`;
    slideNext.style.transform = `translateX(calc(100% + ${px}))`;
  }
}

function onTouchEnd() {
  if (!isOpen || !isDragging) return;

  const stageWidth = lbStage.getBoundingClientRect().width || 1;
  const ratio = dragDeltaX / stageWidth;

  if (Math.abs(ratio) > SWIPE_THRESHOLD_RATIO) {
    commitSlide(dragDeltaX < 0 ? 1 : -1);
  } else {
    springBack();
  }

  isDragging = false;
  dragDeltaX = 0;
}

// Clic sur les bords (desktop, sans tactile)
function onStageClick(e) {
  if (!isOpen || isAnimating || isDragging) return;
  if (!e.target.closest('.lb-slide')) return;
  const rect = lbStage.getBoundingClientRect();
  const x = e.clientX - rect.left;
  if (x < rect.width * 0.3) goPrev();
  else if (x > rect.width * 0.7) goNext();
}

// Clavier
function onKeyDown(e) {
  if (!isOpen) return;
  switch (e.key) {
    case 'Escape':
      closeLightbox();
      break;
    case 'ArrowLeft':
      goPrev();
      break;
    case 'ArrowRight':
      goNext();
      break;
  }
}

function onFullscreenChange() {
  const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
  if (!fsEl && isOpen) closeLightbox();
}

btnClose.addEventListener('click', closeLightbox);
btnPrev.addEventListener('click', (e) => {
  e.stopPropagation();
  goPrev();
});
btnNext.addEventListener('click', (e) => {
  e.stopPropagation();
  goNext();
});
btnOpenGallery.addEventListener('click', () => openLightbox(0));


lbStage.addEventListener('click', onStageClick);
lbStage.addEventListener('touchstart', onTouchStart, { passive: true });
lbStage.addEventListener('touchmove', onTouchMove, { passive: false });
lbStage.addEventListener('touchend', onTouchEnd);

document.addEventListener('keydown', onKeyDown);
document.addEventListener('fullscreenchange', onFullscreenChange);
document.addEventListener('webkitfullscreenchange', onFullscreenChange);

loadPhotos();
initTracking();
initContact();
initChat();

// Titre : « 90,5 m² + 63 m² » occupe toute la largeur disponible, quelle que
// soit la police du téléphone (plafonné à 76 px sur grand écran)
function fitTitle() {
  const el = document.querySelector('.h1-surfaces');
  if (!el) return;
  // Largeur disponible : celle du bandeau (le titre, lui, s'ajuste à son contenu)
  const zone = el.closest('.hero-inner');
  const cs = getComputedStyle(zone);
  const dispo = zone.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  el.style.fontSize = '100px';
  const largeur = el.getBoundingClientRect().width;
  el.style.fontSize = `${Math.min(76, (100 * dispo * 0.985) / largeur).toFixed(1)}px`;
}
fitTitle();
document.fonts?.ready.then(fitTitle);
window.addEventListener('resize', fitTitle);

// Sommaire collé en haut : ombre une fois collé, section en cours surlignée ;
// les ancres s'arrêtent juste sous la barre, quelle que soit sa hauteur
function initSommaire() {
  const bar = document.querySelector('.sommaire-bar');
  const nav = bar?.querySelector('.sommaire');
  if (!nav) return;
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const targets = links.map((a) => document.getElementById(a.getAttribute('href').slice(1)));
  let current = null;
  let queued = false;

  const update = () => {
    queued = false;
    const barBottom = bar.getBoundingClientRect().bottom;
    bar.classList.toggle('is-stuck', bar.getBoundingClientRect().top <= 0 && window.scrollY > 0);
    let active = null;
    targets.forEach((t, i) => {
      if (t && t.getBoundingClientRect().top <= barBottom + 24) active = links[i];
    });
    // Tout en bas de la page, la dernière section l'emporte
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) active = links.at(-1);
    if (active === current) return;
    current?.classList.remove('is-active');
    current?.removeAttribute('aria-current');
    current = active;
    if (!active) return;
    active.classList.add('is-active');
    active.setAttribute('aria-current', 'true');
  };
  const pad = () => (document.documentElement.style.scrollPaddingTop = `${bar.offsetHeight + 12}px`);
  const schedule = () => {
    if (!queued) (queued = true), requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', () => (pad(), schedule()));
  pad();
  update();
}
initSommaire();

// Petits boutons « i » : déplient et replient une information secondaire
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-info-toggle]');
  if (!btn) return;
  const panel = document.getElementById(btn.getAttribute('aria-controls'));
  const open = btn.getAttribute('aria-expanded') !== 'true';
  btn.setAttribute('aria-expanded', String(open));
  if (panel) panel.hidden = !open;
});

// Carte du quartier (OpenStreetMap + Leaflet, sans cookie) : chargée quand on
// approche de la section ; chaque lieu est une icône, un appui affiche son nom
const carteEl = document.getElementById('carte-quartier');
async function chargerCarte() {
  // Leaflet est servi par le site lui-même (aucun CDN) ; CSS chargée avant la carte
  const [{ default: L }] = await Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')]);
  const points = JSON.parse(carteEl.dataset.points);
  const carte = L.map(carteEl, { scrollWheelZoom: false, minZoom: 12, maxZoom: 19 });
  carteEl.leaflet = carte; // pour les tests (positions des gouttes)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(carte);
  // La pointe de chaque goutte est verrouillée sur la coordonnée exacte : l'élément Leaflet
  // fait 0 × 0 px et se place pile sur le point, la goutte est dessinée au-dessus.
  // Quand des lieux se touchent à l'écran, leurs gouttes s'ouvrent en éventail autour de
  // leur pointe (angle `a`, tige de longueur `r`) : rien ne quitte jamais sa coordonnée.
  const goutte = (p, a = 0, r = 0) => {
    const h = (p.maison ? 37 : 30) + r;
    const rad = (a * Math.PI) / 180;
    return L.divIcon({
      className: `carte-pin${p.maison ? ' carte-pin-maison' : ''}${p.projet ? ' carte-pin-projet' : ''}${r ? ' carte-pin-tige' : ''}`,
      html: `<span class="pin" style="height:${h}px;--a:${a}deg"><span class="goutte">${p.svg}</span><span class="tige" style="height:${r}px"></span></span>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
      popupAnchor: [Math.round(h * Math.sin(rad)), Math.round(-h * Math.cos(rad)) + 2],
    });
  };
  const marqueurs = points.map((p) =>
    L.marker(p.gps, { icon: goutte(p), title: p.nom, zIndexOffset: p.maison ? 1000 : 0, riseOnHover: true })
      .bindPopup(`<strong>${p.nom}</strong><br>${p.detail}`)
      .addTo(carte)
  );
  // Vue de départ : l'appartement et ses commerces (moins de 250 m) ; on dézoome pour le reste
  const proches = marqueurs.filter((m, i) => carte.distance(points[0].gps, points[i].gps) < 250);
  carte.fitBounds(L.featureGroup(proches).getBounds(), { paddingTopLeft: [40, 70], paddingBottomRight: [40, 30], maxZoom: 17 });

  // Commerces d'un même pied d'immeuble (moins de 60 m entre voisins) : éventail fixe,
  // calculé une fois sur la vue de départ. Le zoom ne change rien : chaque pointe reste
  // sur sa coordonnée ; tiges courtes et longues en alternance pour aérer les têtes.
  const EVENTAIL = {
    2: [-22, 22],
    3: [-40, 0, 40],
    4: [-54, -18, 18, 54],
    5: [-64, -32, 0, 32, 64],
    6: [-70, -42, -14, 14, 42, 70],
    7: [-72, -48, -24, 0, 24, 48, 72],
    8: [-76, -54, -32, -11, 11, 32, 54, 76],
  };
  const reglage = points.map(() => ({ a: 0, r: 0 }));
  const vus = new Set();
  const groupes = [];
  points.forEach((p, i) => {
    if (vus.has(i) || p.maison) return;
    const g = [i];
    for (let k = 0; k < g.length; k++)
      points.forEach((q, j) => {
        if (!g.includes(j) && !q.maison && carte.distance(points[g[k]].gps, q.gps) < 60) g.push(j);
      });
    g.forEach((j) => vus.add(j));
    if (g.length < 2) return;
    // De l'ouest à l'est, pour que les tiges ne se croisent pas
    g.sort((u, v) => points[u].gps[1] - points[v].gps[1]);
    const angles = EVENTAIL[Math.min(g.length, 8)];
    g.forEach((j, k) => (reglage[j] = { a: angles[k] ?? 0, r: g.length > 3 && k % 2 ? 52 : 24 }));
    groupes.push(g);
  });
  // Têtes encore collées sur la vue de départ (commerces très serrés) : on allonge la tige
  // de la goutte la plus à l'est, quelques passes au plus (calcul au zoom 17 au plus,
  // pour que la vue de départ d'un grand écran reste propre un cran plus loin)
  const zCalcul = Math.min(carte.getZoom(), 17);
  const tete = (i) => {
    const { a, r } = reglage[i];
    const pt = carte.project(points[i].gps, zCalcul);
    const d = (points[i].maison ? 37 : 30) + r - 13;
    const rad = (a * Math.PI) / 180;
    return [pt.x + d * Math.sin(rad), pt.y - d * Math.cos(rad)];
  };
  for (let passe = 0; passe < 4; passe++) {
    let bouge = false;
    groupes.flat().forEach((j) =>
      points.forEach((q, i) => {
        if (i === j || (points[i].gps[1] > points[j].gps[1] && groupes.flat().includes(i))) return;
        const [x1, y1] = tete(i);
        const [x2, y2] = tete(j);
        if (Math.hypot(x1 - x2, y1 - y2) < 28) (reglage[j].r += 22), (bouge = true);
      })
    );
    if (!bouge) break;
  }
  groupes.flat().forEach((j) => marqueurs[j].setIcon(goutte(points[j], reglage[j].a, reglage[j].r)));
  track('carte_open');
}
if (carteEl) {
  const obs = new IntersectionObserver(
    (entrees) => {
      if (entrees.some((e) => e.isIntersecting)) {
        obs.disconnect();
        chargerCarte();
      }
    },
    { rootMargin: '400px' }
  );
  obs.observe(carteEl);
}
