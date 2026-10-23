import { defineConfig } from 'vite';
import { planSvg } from './content/plan.js';
import { renderSections, renderHeaderExtras, renderSurtitre, renderEnDirect, htmlVars } from './content/render.js';

const escAttr = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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
    transformIndexHtml(html) {
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
