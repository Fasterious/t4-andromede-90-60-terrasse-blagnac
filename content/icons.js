// Pictos (Lucide, licence ISC) inlinés en SVG au build : aucun chargement côté visiteur.
import * as lucide from 'lucide-static';

export function icon(name, cls = 'ico') {
  const svg = lucide[name];
  if (!svg) throw new Error(`Picto inconnu : ${name}`);
  return svg
    .replace(/\s(width|height)="24"/g, '')
    .replace(/class="[^"]*"/, `class="${cls}" aria-hidden="true" focusable="false"`)
    .replace(/\n\s*/g, ' ');
}
