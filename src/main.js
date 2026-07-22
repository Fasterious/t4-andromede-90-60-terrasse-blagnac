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
const btnShare = document.getElementById('share-btn');
const btnLbShare = document.getElementById('lb-share-btn');

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
const SLIDE_DURATION = 320; // ms — doit matcher la transition CSS .sliding

function wrap(i) {
  return (i + photos.length) % photos.length;
}

// Partage — Web Share API sur mobile (ouvre le vrai menu de partage natif),
// copie du lien en fallback sur desktop.
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 250);
  }, 2200);
}

async function shareListing() {
  const shareData = {
    title: document.title,
    text: 'T4 90 m² + terrasse 60 m² — Andromède, Blagnac. 279 000 € net vendeur.',
    url: window.location.href,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      // L'utilisateur a annulé le partage — ne rien faire
    }
    return;
  }

  try {
    await navigator.clipboard.writeText(shareData.url);
    showToast('Lien copié !');
  } catch {
    showToast(shareData.url);
  }
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
    // iOS Safari ne supporte pas requestFullscreen — l'overlay fixed suffit
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

btnShare.addEventListener('click', shareListing);
btnLbShare.addEventListener('click', (e) => {
  e.stopPropagation();
  shareListing();
});

lbStage.addEventListener('click', onStageClick);
lbStage.addEventListener('touchstart', onTouchStart, { passive: true });
lbStage.addEventListener('touchmove', onTouchMove, { passive: false });
lbStage.addEventListener('touchend', onTouchEnd);

document.addEventListener('keydown', onKeyDown);
document.addEventListener('fullscreenchange', onFullscreenChange);
document.addEventListener('webkitfullscreenchange', onFullscreenChange);

loadPhotos();
