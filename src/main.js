const galleryEl = document.getElementById('gallery');
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lb-img');
const lbCaption = document.getElementById('lb-caption');
const lbCounter = document.getElementById('lb-counter');
const lbStage = document.getElementById('lb-stage');
const lbThumbs = document.getElementById('lb-thumbs');
const btnClose = document.getElementById('lb-close');
const btnPrev = document.getElementById('lb-prev');
const btnNext = document.getElementById('lb-next');
const btnOpenGallery = document.getElementById('open-gallery');

let photos = [];
let currentIndex = 0;
let isOpen = false;

// Swipe state
let touchStartX = 0;
let touchStartY = 0;
let touchDeltaX = 0;
let isSwiping = false;
const SWIPE_THRESHOLD = 50;

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
      goTo(Number(btn.dataset.index));
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

async function enterNativeFullscreen() {
  const el = lightbox;
  try {
    if (el.requestFullscreen) await el.requestFullscreen();
    else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
  } catch {
    // iOS Safari ne supporte pas requestFullscreen — le lightbox fixed suffit
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
  updateLightbox();
  await enterNativeFullscreen();
}

async function closeLightbox() {
  isOpen = false;
  await exitNativeFullscreen();
  lightbox.hidden = true;
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function updateLightbox(direction = 0) {
  const photo = photos[currentIndex];
  lbImg.style.opacity = direction ? '0.6' : '1';
  lbImg.style.transform = 'translateX(0)';

  lbImg.onload = () => {
    lbImg.style.opacity = '1';
  };

  lbImg.src = photo.src;
  lbImg.alt = photo.alt;
  lbStage.style.setProperty('--lb-bg', `url("${photo.src}")`);
  lbCaption.textContent = photo.caption;
  lbCounter.textContent = `${currentIndex + 1} / ${photos.length}`;
  updateThumbSelection();
}

function goTo(index) {
  if (index === currentIndex) return;
  const prev = currentIndex;
  currentIndex = (index + photos.length) % photos.length;
  const direction = index > prev ? 1 : index < prev ? -1 : 0;
  updateLightbox(direction);
}

function goPrev() {
  goTo(currentIndex - 1);
}

function goNext() {
  goTo(currentIndex + 1);
}

// Touch / swipe handlers
function onTouchStart(e) {
  if (!isOpen) return;
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchDeltaX = 0;
  isSwiping = false;
  lbImg.classList.add('swiping');
}

function onTouchMove(e) {
  if (!isOpen) return;
  const touch = e.touches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;

  if (!isSwiping && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
    isSwiping = true;
  }

  if (isSwiping) {
    e.preventDefault();
    touchDeltaX = dx;
    lbImg.style.transform = `translateX(${dx}px)`;
  }
}

function onTouchEnd() {
  if (!isOpen) return;
  lbImg.classList.remove('swiping');

  if (isSwiping && Math.abs(touchDeltaX) > SWIPE_THRESHOLD) {
    if (touchDeltaX < 0) goNext();
    else goPrev();
  } else {
    lbImg.style.transform = 'translateX(0)';
  }

  touchDeltaX = 0;
  isSwiping = false;
}

// Click on stage edges (desktop)
function onStageClick(e) {
  if (!isOpen || (e.target !== lbStage && e.target !== lbImg)) return;
  const rect = lbStage.getBoundingClientRect();
  const x = e.clientX - rect.left;
  if (x < rect.width * 0.3) goPrev();
  else if (x > rect.width * 0.7) goNext();
}

// Keyboard
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
