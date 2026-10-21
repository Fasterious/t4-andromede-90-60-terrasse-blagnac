import { defineConfig } from 'vite';
import { renderSections, renderHeaderExtras, htmlVars } from './content/render.js';

const escAttr = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Injecte le contenu de content/annonce.js dans index.html (dev et build)
function annoncePlugin() {
  return {
    name: 'annonce-content',
    transformIndexHtml(html) {
      const vars = htmlVars();
      return html
        .replace('<!-- SECTIONS -->', renderSections())
        .replace('<!-- HEADER_EXTRAS -->', renderHeaderExtras())
        .replace(/\{\{(\w+)\}\}/g, (m, key) => (key in vars ? escAttr(vars[key]) : m));
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [annoncePlugin()],
  server: {
    watch: { ignored: ['**/coulisses/**'] },
  },
});
