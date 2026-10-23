// Pictos (Lucide, licence ISC) inlinés en SVG au build : aucun chargement côté visiteur.
import * as lucide from 'lucide-static';

// Pictos maison, même trait que Lucide (viewBox 24, trait 2, bouts arrondis)
const MAISON = {
  // Deux écoliers qui traversent, main dans la main (comme le panneau « école »)
  Ecoliers:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><circle cx="8" cy="4" r="2"/><path d="M8 7v7l-2.5 7M8 14l2.5 7M8 9.5l4.5 3.5"/><circle cx="16.5" cy="9.5" r="1.6"/><path d="M16.5 12v4.5l-2 4.5M16.5 16.5l2 4.5M16.5 13.5l-4 -.5"/></svg>',
};

export function icon(name, cls = 'ico') {
  const svg = MAISON[name] || lucide[name];
  if (!svg) throw new Error(`Picto inconnu : ${name}`);
  return svg
    .replace(/\s(width|height)="24"/g, '')
    .replace(/class="[^"]*"/, `class="${cls}" aria-hidden="true" focusable="false"`)
    .replace(/\n\s*/g, ' ');
}
