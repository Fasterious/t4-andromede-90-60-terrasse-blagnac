# T4 Andromède Blagnac — site de vente

Site de vente directe du T4 90,5 m² + terrasse 63 m² à Andromède (Blagnac) : photos, histoire,
quartier, points d'attention en toute transparence, FAQ, assistant, demande de visite via WhatsApp.

Le contenu se modifie dans `content/annonce.js` (voir `CLAUDE.md`).

**URL Vercel :** https://t4-andromede-blagnac.vercel.app

**GitHub :** https://github.com/Fasterious/t4-andromede-90-60-terrasse-blagnac

## Ajouter des photos

1. Déposer le fichier dans `public/photos/` (ex. `06-terrasse.png`)
2. Ajouter une entrée dans `public/photos/photos.json` :

```json
{
  "src": "/photos/06-terrasse.png",
  "alt": "Description pour l'accessibilité",
  "caption": "Terrasse · 60 m²"
}
```

3. Commit + push → Vercel redéploie automatiquement.

## Développement local

```bash
npm install
npm run dev
```

## Fonctionnalités

- Contenu unique (`content/annonce.js`) rendu en HTML statique au build et réutilisé par l'assistant
- « Demander une visite » : 4 questions de pré-qualification → message WhatsApp pré-rempli (rien n'est stocké)
- Assistant (Claude Haiku 5.5) avec quotas ; au-delà, renvoi vers WhatsApp
- Mesure d'audience sans cookie par source : ajouter `?src=seloger` (ou `pap`, `leboncoin`, `facebook`, `qr`) aux liens
- Tableau de bord : `GET /api/stats` avec `Authorization: Bearer $ADMIN_TOKEN`

- Mode normal : grille de photos cliquables
- Mode plein écran : tap sur une photo ou bouton « Plein écran »
- Navigation : swipe gauche/droite, flèches, clic sur les bords, clavier (← → Esc)
