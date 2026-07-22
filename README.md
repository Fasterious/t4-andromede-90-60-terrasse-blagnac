# T4 Andromède Blagnac — Photos

Site minimaliste pour partager les photos du T4 90 m² + terrasse 60 m² à Andromède (Blagnac).

**URL Vercel :** `t4-andromede-90-60-terrasse-blagnac.vercel.app`

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

- Mode normal : grille de photos cliquables
- Mode plein écran : tap sur une photo ou bouton « Plein écran »
- Navigation : swipe gauche/droite, flèches, clic sur les bords, clavier (← → Esc)
