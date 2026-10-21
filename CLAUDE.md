# CLAUDE.md : site de vente du T4 Andromède

## ⚠️ Ce dépôt est PUBLIC

Tout ce qui est committé ici est lisible par n'importe qui, acheteurs compris.
N'y mettre **que** des informations qu'un acheteur peut lire sur le site.

Ne jamais committer ici : stratégie, informations personnelles au-delà de ce que le site
affiche déjà, contenu de conversations avec des acheteurs, documents (diagnostics, PV d'AG,
appels de fonds), identifiants ou clés. En cas de doute : coulisses.

Les coulisses (stratégie, règles, scripts, annonces des plateformes, agents) vivent dans
`coulisses/`, un dépôt git **séparé et privé**, ignoré par ce dépôt (`.gitignore`).
Si `coulisses/` est présent, lire `coulisses/CLAUDE.md` avant toute modification de contenu.

## Architecture

- `content/annonce.js` : **source unique** du contenu public. Toute modification de texte,
  de chiffre ou de prix se fait ici.
- `content/render.js` : rendu HTML statique des sections, injecté au build par `vite.config.js`
  (placeholders `{{prix}}`, `<!-- SECTIONS -->`, `<!-- HEADER_EXTRAS -->` dans `index.html`).
- `src/` : galerie photo (main.js), demande de visite → WhatsApp (visit.js), assistant (chat.js),
  mesure d'audience sans cookie (track.js).
- `api/` : fonctions serverless Vercel :
  - `chat.js` : assistant (Claude Haiku 5.5), quotas par visiteur/IP/jour + budget mensuel ;
  - `track.js` : compteurs agrégés par jour, événement et source (`?src=seloger|pap|leboncoin|facebook|qr`) ;
  - `stats.js` : statistiques JSON (session admin ou `ADMIN_TOKEN`) ;
  - `admin/*` : connexion, données du tableau de bord, transcription, export CSV ;
  - `_lib/conversations.js` : journal complet des conversations (6 mois), `_lib/visitor.js` : identification
    (identifiant navigateur + IP hachée, jamais en clair), ville approximative et appareil.
- `admin.html` + `src/admin.js` : page `/admin` (mot de passe, non indexée).
  - `_lib/knowledge.js` construit le prompt de l'assistant **uniquement** depuis `content/annonce.js`.

## Variables d'environnement (Vercel)

| Variable | Rôle |
|---|---|
| `ANTHROPIC_API_KEY` | clé API (idéalement un workspace dédié avec plafond de dépense) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (ou `KV_REST_API_*`) | quotas et compteurs persistants |
| `ADMIN_PASSWORD` | mot de passe de la page `/admin` (tableau de bord + conversations) |
| `ADMIN_SECRET` | facultatif : clé de signature du cookie admin (sinon dérivée du mot de passe) |
| `ADMIN_TOKEN` | accès en ligne de commande à `/api/stats` (`Authorization: Bearer …`) |
| `HASH_SALT` | sel du hachage des IP/visiteurs |
| `CHAT_MAX_PER_VISITOR` (12), `CHAT_MAX_PER_IP` (30), `CHAT_MAX_PER_DAY` (800), `CHAT_MONTHLY_BUDGET_USD` (15) | limites de l'assistant |

## Règles de contenu

- **Aucun tiret long (—)**, nulle part (textes, titres, messages, assistant). Séparer avec le point
  médian gris (`<span class="sep">·</span>`), un retour à la ligne, une liste, deux-points ou une virgule.
- Chaque point d'attention = constat + expérience réelle + solutions. Jamais l'un sans l'autre.
- Un chiffre non vérifié porte `aConfirmer: true` (affiché « à confirmer »), ou n'est pas publié.
- Mentions légales de l'annonce dans `annonce.reglementaire` (DPE, dépenses d'énergie, copropriété, Géorisques).

## Vérifier avant de pousser

```bash
npm run build   # doit passer
```
