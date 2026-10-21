// Plan schématique de l'appartement, redessiné en SVG à partir de nos cotes.
// Toute la géométrie est en mètres, dans le repère du plan d'origine (x vers la
// droite, y vers le bas). planSvg() produit une version paysage (écran large)
// ou portrait (mobile, plan tourné d'un quart de tour, textes toujours droits).

const W = 12.37; // largeur totale, murs extérieurs compris
const H = 8.83; // hauteur totale
const M = 0.5; // marge autour du dessin

// Pièces : rectangle intérieur, nom, surface Carrez, cotes relevées
export const PIECES = [
  { x: 0.22, y: 2.33, w: 2.8, h: 6.27, nom: 'Suite parentale', surface: '17,4 m²', cotes: '2,80 × 6,27 m', note: 'avec dressing' },
  { x: 0.22, y: 1.0, w: 2.8, h: 1.23, nom: 'Salle d’eau', surface: '3 m²', cotes: '2,80 × 1,23 m', compact: true },
  { x: 3.22, y: 1.0, w: 1.38, h: 1.47, nom: 'Entrée', cotes: '1,38 × 2,48 m', compact: true },
  { x: 4.7, y: 0.3, w: 1.16, h: 2.12, nom: 'WC', cotes: '1,16 × 2,12 m', petit: true },
  { x: 5.94, y: 0.3, w: 2.28, h: 2.11, nom: 'Salle de bains', surface: '4,5 m²', cotes: '2,28 × 2,11 m', compact: true, dx: -0.42 },
  { x: 3.22, y: 2.49, w: 4.98, h: 1.0, nom: 'Couloir', cotes: '4,96 × 1,00 m', compact: true, ligne: true },
  { x: 3.22, y: 3.55, w: 2.45, h: 5.06, nom: 'Chambre 2', surface: '12,3 m²', cotes: '2,45 × 5,06 m' },
  { x: 5.77, y: 3.55, w: 2.44, h: 5.06, nom: 'Chambre 3', surface: '12,3 m²', cotes: '2,44 × 5,06 m', note: 'bureau aujourd’hui' },
  { x: 8.31, y: 0.3, w: 3.84, h: 8.29, nom: 'Séjour et cuisine', surface: '32 m²', cotes: '3,84 × 8,29 m', note: 'cuisine ouverte avec îlot' },
];

// Murs : contour extérieur (polygone) et cloisons [x1, y1, x2, y2, épaisseur]
const CONTOUR = [
  [0.11, 0.89],
  [4.65, 0.89],
  [4.65, 0.19],
  [12.26, 0.19],
  [12.26, 8.72],
  [0.11, 8.72],
];
const CLOISONS = [
  [3.12, 0.89, 3.12, 8.72, 0.2], // mur porteur suite / entrée et chambres
  [0.11, 2.28, 3.12, 2.28, 0.1], // salle d'eau / suite
  [4.65, 0.89, 4.65, 2.49, 0.1], // entrée / WC
  [5.9, 0.19, 5.9, 2.49, 0.08], // WC / salle de bains
  [4.65, 2.44, 8.26, 2.44, 0.1], // WC et SdB / couloir
  [3.12, 3.52, 8.26, 3.52, 0.08], // couloir / chambres
  [5.72, 3.52, 5.72, 8.72, 0.1], // chambre 2 / chambre 3
  [8.26, 0.19, 8.26, 8.72, 0.1], // séjour
];

// Portes : position du gond, largeur, direction du mur et sens d'ouverture
// mur 'h' (horizontal) ou 'v' (vertical) ; ouvre: vecteur vers la pièce desservie
const PORTES = [
  { x: 3.5, y: 0.89, l: 0.9, mur: 'h', ouvre: 1 }, // porte palière
  { x: 3.12, y: 2.6, l: 0.8, mur: 'v', ouvre: -1 }, // suite parentale
  { x: 2.95, y: 2.28, l: 0.7, mur: 'h', ouvre: -1, inverse: true }, // salle d'eau
  { x: 4.85, y: 2.44, l: 0.7, mur: 'h', ouvre: -1 }, // WC
  { x: 6.5, y: 2.44, l: 0.75, mur: 'h', ouvre: -1 }, // salle de bains
  { x: 5.55, y: 3.52, l: 0.8, mur: 'h', ouvre: 1, inverse: true }, // chambre 2
  { x: 5.9, y: 3.52, l: 0.8, mur: 'h', ouvre: 1 }, // chambre 3
  { x: 8.26, y: 2.6, l: 0.8, mur: 'v', ouvre: 1 }, // séjour
];

// Fenêtres et baies : segment sur un mur extérieur
const BAIES = [
  [0.9, 8.72, 2.4, 8.72],
  [3.7, 8.72, 5.2, 8.72],
  [6.2, 8.72, 7.7, 8.72],
  [12.26, 1.5, 12.26, 2.4], // petite porte-fenêtre côté cuisine, vers la terrasse
  [12.26, 4.3, 12.26, 6.7], // grande baie côté salon (télévision), vers la terrasse
  // pas d'ouverture sur le mur du haut du séjour : mur porteur, côté évier et four
];

// Équipements dessinés en trait léger [x, y, w, h]
const MOBILIER = [
  { x: 0.3, y: 1.08, w: 0.9, h: 0.9, type: 'douche' },
  { x: 7.42, y: 0.4, w: 0.7, h: 1.6, type: 'baignoire' },
  { x: 9.25, y: 0.38, w: 2.82, h: 0.6, type: 'plan' }, // évier, plaques, four : côté droit
  { x: 8.4, y: 0.38, w: 0.75, h: 0.7, type: 'frigo', label: 'frigo' }, // emplacement du réfrigérateur, au fond à gauche
  { x: 9.3, y: 1.45, w: 1.9, h: 0.95, type: 'ilot' },
  { x: 0.3, y: 2.45, w: 0.6, h: 2.6, type: 'dressing' },
];

const fmt = (n) => Math.round(n * 100) / 100;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function planSvg({ portrait = false, standalone = false, titre = 'Plan de l’appartement' } = {}) {
  // Passage au repère de sortie (unités : mètres, marge comprise)
  const P = portrait ? ([x, y]) => [H - y + M, x + M] : ([x, y]) => [x + M, y + M];
  const vbW = (portrait ? H : W + 0.6) + 2 * M;
  const vbH = (portrait ? W + 1.1 : H) + 2 * M; // place pour la flèche terrasse
  const pt = (x, y) => P([x, y]).map(fmt).join(',');
  const rect = (x, y, w, h, cls, extra = '') => {
    const [ax, ay] = P([x, y]);
    const [bx, by] = P([x + w, y + h]);
    return `<rect class="${cls}" x="${fmt(Math.min(ax, bx))}" y="${fmt(Math.min(ay, by))}" width="${fmt(Math.abs(bx - ax))}" height="${fmt(Math.abs(by - ay))}"${extra}/>`;
  };
  const line = (x1, y1, x2, y2, cls, sw) =>
    `<line class="${cls}" x1="${fmt(P([x1, y1])[0])}" y1="${fmt(P([x1, y1])[1])}" x2="${fmt(P([x2, y2])[0])}" y2="${fmt(P([x2, y2])[1])}"${sw ? ` stroke-width="${sw}"` : ''}/>`;

  const out = [];
  out.push(`<polygon class="pl-sol" points="${CONTOUR.map(([x, y]) => pt(x, y)).join(' ')}"/>`);

  // Équipements
  for (const m of MOBILIER) {
    out.push(rect(m.x, m.y, m.w, m.h, `pl-meuble pl-${m.type}`));
    if (m.label) {
      const [lx, ly] = P([m.x + m.w / 2, m.y + m.h / 2]);
      out.push(`<text class="pl-note" x="${fmt(lx)}" y="${fmt(ly + 0.05)}" font-size="0.15">${esc(m.label)}</text>`);
    }
  }

  // Murs
  out.push(`<polygon class="pl-mur" points="${CONTOUR.map(([x, y]) => pt(x, y)).join(' ')}" stroke-width="0.22"/>`);
  for (const [x1, y1, x2, y2, e] of CLOISONS) out.push(line(x1, y1, x2, y2, 'pl-cloison', e));

  // Baies (on « ouvre » le mur puis on trace un double trait clair)
  for (const [x1, y1, x2, y2] of BAIES) {
    out.push(line(x1, y1, x2, y2, 'pl-trou', 0.26));
    out.push(line(x1, y1, x2, y2, 'pl-baie', 0.06));
  }

  // Portes : ouverture dans le mur + battant + arc
  for (const d of PORTES) {
    const s = d.inverse ? -1 : 1;
    const [ax, ay] = d.mur === 'h' ? [d.x, d.y] : [d.x, d.y];
    const [bx, by] = d.mur === 'h' ? [d.x + s * d.l, d.y] : [d.x, d.y + d.l];
    const [cx, cy] = d.mur === 'h' ? [d.x, d.y + d.ouvre * d.l] : [d.x + d.ouvre * d.l, d.y];
    out.push(line(ax, ay, bx, by, 'pl-trou', 0.24));
    out.push(line(ax, ay, cx, cy, 'pl-battant', 0.03));
    const [p1, p2, p3] = [P([bx, by]), P([cx, cy]), P([ax, ay])];
    // sens de l'arc : produit vectoriel (gond → seuil, gond → battant)
    const cross = (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p1[1] - p3[1]) * (p2[0] - p3[0]);
    out.push(
      `<path class="pl-arc" d="M${fmt(p1[0])},${fmt(p1[1])} A${d.l},${d.l} 0 0 ${cross > 0 ? 1 : 0} ${fmt(p2[0])},${fmt(p2[1])}"/>`
    );
  }

  // Textes : nom, surface, cotes (toujours horizontaux)
  for (const r of PIECES) {
    const [cx, cy] = P([r.x + r.w / 2 + (r.dx || 0), r.y + r.h / 2]);
    const lignes = [];
    const fs = r.petit ? 0.2 : r.compact ? 0.22 : 0.3;
    if (r.ligne) {
      lignes.push([`${r.nom} · ${r.cotes}`, 'pl-cote', 0.2]);
    } else {
      lignes.push([r.nom, 'pl-nom', fs]);
      if (r.surface) lignes.push([r.surface, 'pl-surface', fs * 0.92]);
      lignes.push([r.cotes, 'pl-cote', Math.min(0.2, fs * 0.8)]);
      if (r.note && !r.compact) lignes.push([r.note, 'pl-note', 0.18]);
    }
    const total = lignes.reduce((a, [, , f]) => a + f * 1.25, 0);
    let y = cy - total / 2;
    for (const [t, cls, f] of lignes) {
      y += f * 1.25;
      // Le couloir, étroit, garde son texte dans le sens de la longueur
      const rot = r.ligne && portrait ? ` transform="rotate(-90 ${fmt(cx)} ${fmt(cy)})"` : '';
      out.push(`<text class="${cls}" x="${fmt(cx)}" y="${fmt(y - f * 0.3)}" font-size="${f}"${rot}>${esc(t)}</text>`);
    }
  }

  // Terrasse : flèche depuis la baie du séjour
  const [tx, ty] = P([12.26, 5.5]);
  const uy = ty + 0.9;
  if (portrait) {
    out.push(`<path class="pl-fleche" d="M${fmt(tx)},${fmt(ty + 0.2)} V${fmt(uy)} m-0.12,-0.16 l0.12,0.16 l0.12,-0.16"/>`);
    out.push(`<text class="pl-terrasse" x="${fmt(tx)}" y="${fmt(uy + 0.32)}" font-size="0.26">Terrasse 63 m²</text>`);
  } else {
    out.push(`<path class="pl-fleche" d="M${fmt(tx + 0.15)},${fmt(ty)} H${fmt(tx + 0.55)} m-0.14,-0.11 l0.14,0.11 l-0.14,0.11"/>`);
    out.push(`<text class="pl-terrasse" x="${fmt(tx + 0.78)}" y="${fmt(ty)}" font-size="0.26" transform="rotate(90 ${fmt(tx + 0.78)} ${fmt(ty)})">Terrasse 63 m²</text>`);
  }

  const style = standalone
    ? `<style>${STYLE_AUTONOME}</style><rect width="100%" height="100%" fill="#fff"/>`
    : '';
  const ns = standalone ? ' xmlns="http://www.w3.org/2000/svg"' : '';
  return `<svg${ns} class="plan-svg ${portrait ? 'plan-portrait' : 'plan-paysage'}" viewBox="0 0 ${fmt(vbW)} ${fmt(vbH)}" role="img" aria-label="${esc(titre)} : suite parentale avec salle d’eau, entrée, WC, salle de bains, couloir, deux chambres, séjour et cuisine ouverte donnant sur la terrasse">${style}${out.join('')}</svg>`;
}

// Styles pour le fichier SVG ouvert seul (« Ouvrir en grand »)
const STYLE_AUTONOME = `
.pl-sol{fill:#fbfaf7}
.pl-mur{fill:none;stroke:#1f2a24;stroke-linejoin:miter}
.pl-cloison{stroke:#1f2a24;stroke-linecap:square}
.pl-trou{stroke:#fbfaf7}
.pl-baie{stroke:#7fb3d5}
.pl-battant{stroke:#1f2a24}
.pl-arc{fill:none;stroke:#9aa39d;stroke-width:0.02;stroke-dasharray:0.06 0.05}
.pl-meuble{fill:none;stroke:#b9c0bb;stroke-width:0.02}
.pl-dressing,.pl-frigo{stroke-dasharray:0.08 0.06}
.pl-nom{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-weight:700;fill:#1e5631;text-anchor:middle}
.pl-surface{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-weight:600;fill:#1a1a1a;text-anchor:middle}
.pl-cote,.pl-note{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;fill:#666;text-anchor:middle}
.pl-note{font-style:italic}
.pl-terrasse{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-weight:700;fill:#1e5631;text-anchor:middle}
.pl-fleche{fill:none;stroke:#1e5631;stroke-width:0.04}
`;
