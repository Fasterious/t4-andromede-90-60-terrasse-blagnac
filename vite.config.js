import { defineConfig } from 'vite';
import { planSvg } from './content/plan.js';
import { annonce } from './content/annonce.js';
import { renderSections, renderHeaderExtras, renderSurtitre, renderEnDirect, htmlVars } from './content/render.js';

const escAttr = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Lieux du quartier donnés par adresse (`geo`) : géolocalisés une fois par build
// avec la Base Adresse Nationale. Sans réseau, le lieu reste simplement hors carte.
let geoFait = false;
async function geolocaliser() {
  if (geoFait) return;
  geoFait = true;
  // Position au numéro près uniquement ; sinon on garde `gps` (le centre d'une rue ne suffit pas)
  const situer = async (adresse) => {
    try {
      const q = adresse.replace(/’/g, "'");
      const url = `https://api-adresse.data.gouv.fr/search/?limit=1&citycode=31069&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      const f = (await res.json()).features?.[0];
      if (f && f.properties.type === 'housenumber' && f.properties.score > 0.6) {
        const [lon, lat] = f.geometry.coordinates;
        return { gps: [lat, lon], label: f.properties.label };
      }
      console.log(`[carte] non trouvé au numéro près : ${adresse} (${f?.properties.type || 'aucun'} ${f?.properties.label || ''})`);
    } catch {
      console.log(`[carte] hors ligne : ${adresse}`);
    }
    return null;
  };
  // Les positions relevées à la main sur Google Maps (`gpsVerifie`) priment : la BAN
  // ne donne que l'entrée de l'adresse, pas la boutique
  const lieux = [annonce, ...annonce.proximites].filter((p) => p.geo && !p.gpsVerifie);
  const trouves = await Promise.all(lieux.map((p) => situer(p.geo)));
  lieux.forEach((p, i) => {
    if (trouves[i]) p.gps = trouves[i].gps;
  });
  // Journal du build : position retenue et distance à vol d'oiseau depuis l'appartement
  console.log(`[carte] appartement : ${annonce.gps[0].toFixed(5)}, ${annonce.gps[1].toFixed(5)}`);
  for (const p of annonce.proximites) {
    if (!p.gps) continue;
    const [a, b] = annonce.gps;
    const [c, d] = p.gps;
    const m = Math.round(
      6371000 * Math.hypot(((d - b) * Math.PI) / 180 * Math.cos((((a + c) / 2) * Math.PI) / 180), ((c - a) * Math.PI) / 180)
    );
    console.log(`[carte] ${p.lieu.slice(0, 40)} : ${p.gps[0].toFixed(5)}, ${p.gps[1].toFixed(5)} (${m} m)`);
  }
}

// Injecte le contenu de content/annonce.js dans index.html (dev et build)
function annoncePlugin() {
  return {
    name: 'annonce-content',
    // Plan seul, ouvrable en grand (zoom natif du navigateur)
    configureServer(server) {
      server.middlewares.use('/plan.svg', (req, res) => {
        res.setHeader('Content-Type', 'image/svg+xml');
        res.end(planSvg({ standalone: true }));
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'plan.svg', source: planSvg({ standalone: true }) });
    },
    async transformIndexHtml(html) {
      await geolocaliser();
      const vars = htmlVars();
      return html
        .replace('<!-- SECTIONS -->', renderSections())
        .replace('<!-- HEADER_EXTRAS -->', renderHeaderExtras())
        .replace('<!-- SURTITRE -->', renderSurtitre())
        .replace('<!-- EN_DIRECT -->', renderEnDirect())
        .replace(/\{\{(\w+)\}\}/g, (m, key) => (key in vars ? escAttr(vars[key]) : m));
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [annoncePlugin()],
  build: {
    rollupOptions: {
      input: { main: 'index.html', admin: 'admin.html' },
    },
  },
  server: {
    watch: { ignored: ['**/coulisses/**'] },
  },
});
