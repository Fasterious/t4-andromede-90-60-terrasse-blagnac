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
  for (const p of annonce.proximites) {
    if (p.gps || !p.geo) continue;
    try {
      const url = `https://api-adresse.data.gouv.fr/search/?limit=1&q=${encodeURIComponent(p.geo)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      const f = (await res.json()).features?.[0];
      if (f && f.properties.score > 0.5 && f.properties.citycode === '31069') {
        const [lon, lat] = f.geometry.coordinates;
        p.gps = [lat, lon];
      }
    } catch {
      // hors ligne : pas de position
    }
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
