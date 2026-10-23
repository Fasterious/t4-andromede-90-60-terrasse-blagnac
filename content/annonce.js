// Source unique du contenu PUBLIC de l'annonce.
// Utilisé par : le site (rendu au build, cf. content/render.js + vite.config.js)
// et le chatbot (api/_lib/knowledge.js). Une modification ici met à jour les deux.
//
// ⚠️ Ce dépôt est PUBLIC. N'écrire ici que ce qu'un acheteur peut lire,
// validé selon les règles des coulisses (dépôt privé).
//
// `aConfirmer: true` = chiffre annoncé avec la mention « à confirmer ».

export const annonce = {
  titre: 'T4 de 90,5 m² + terrasse de 63 m²',
  sousTitre: ['3 chambres dont une suite parentale', '1er étage avec ascenseur', '2 parkings en sous-sol'],
  quartier: 'Andromède, Blagnac',
  adresse: '1 rue Jacqueline Auriol, 31700 Blagnac',
  // Position sur la carte : `geo` (adresse) est géolocalisé au build par la Base Adresse
  // Nationale (vite.config.js) ; `gps` sert de secours si l'adresse n'est pas trouvée au numéro près.
  // Coordonnées relevées sur Google Maps (23/10) : la BAN ne les remplace pas au build
  gps: [43.654402, 1.369533],
  gpsVerifie: true,
  geo: '1 rue Jacqueline Auriol, 31700 Blagnac',

  prix: {
    montant: 239000,
    affiche: '239 000 €',
    note: 'Prix net vendeur : vente directe entre particuliers, aucune commission d’agence',
  },

  // Badge mis en avant près du prix
  enDirect: 'Vente en direct · 0 € de frais d’agence',

  // Plan redessiné (géométrie et cotes dans content/plan.js)
  plan: {
    mention: 'Plan schématique, redessiné à partir des mesures que nous avons relevées nous-mêmes en octobre 2026, avec nos propres appareils. Vous pouvez bien sûr les vérifier pendant la visite, ou faire mesurer par un professionnel. Seul le certificat Loi Carrez (90,5 m²) fait foi. Terrasse non représentée.',
  },

  contact: {
    noms: 'Corinne & Arnaud',
    // Appels et SMS : Corinne, qui répond le plus vite
    telephone: '06 23 94 79 77',
    telephoneIntl: '+33623947977',
    // WhatsApp Business : le 06 d'Arnaud (Corinne y est reliée). Jamais affiché en
    // clair : il ne sert qu'aux liens wa.me (boutons « Écrire sur WhatsApp »).
    whatsapp: '33677981780',
  },

  // Courte vidéo de visite commentée (YouTube « non répertoriée »).
  // Laisser null tant qu'elle n'est pas tournée : la section est alors masquée.
  video: { youtubeId: null, duree: null },

  // Bandeau de chiffres clés sous le prix (pictos Lucide : content/icons.js)
  chiffresCles: [
    { icone: 'Ruler', valeur: '90,5 m²', label: 'Loi Carrez' },
    { icone: 'Sun', valeur: '63 m²', label: 'de terrasse' },
    { icone: 'BedDouble', valeur: '3 chambres', label: 'dont une suite' },
    { icone: 'SquareParking', valeur: '2 parkings', label: 'en sous-sol, en enfilade' },
    { icone: 'Building2', valeur: '1er étage', label: 'avec ascenseur' },
    { icone: 'TramFront', valeur: 'Tram T1', label: '≈ 5 min à pied' },
  ],

  histoire: [
    'Arnaud est Blagnacais depuis longtemps et a habité plusieurs quartiers de la ville. Celui qu’il préfère : Andromède.',
    'Quartier jeune aux équipements modernes, Andromède a tout pour une vie de famille à pied : crèche, écoles, lycée, commerces, restaurants. Et la rocade à deux minutes en voiture, sans en entendre le bruit.',
    'Nous ne vendons pas parce que nous n’y sommes pas bien : nous restons d’ailleurs dans le quartier. Nous télétravaillons tous les deux, Arnaud fait de la musique et notre famille s’est agrandie : il nous manque simplement une pièce.',
  ],

  pointsForts: [
    {
      icone: 'Sun',
      titre: 'Une terrasse de 63 m²',
      texte: 'Exposée est/sud-est : soleil le matin, ombre naturelle aux heures chaudes. Une vraie pièce de vie en plus dès les beaux jours : repas, jeux des enfants, apéro.',
    },
    {
      icone: 'Ruler',
      titre: '90,5 m² Loi Carrez, 3 chambres',
      texte: 'De l’espace pour une famille, à un prix inférieur au centre-ville de Blagnac.',
    },
    {
      icone: 'BedDouble',
      titre: 'Une suite parentale de 17,4 m²',
      texte: 'Grand dressing (ouvert aujourd’hui, il peut être fermé ou réaménagé) et salle d’eau privative.',
    },
    {
      icone: 'Columns2',
      titre: 'Des chambres modulables',
      texte: 'Deux chambres de 12,3 m² en longueur : faciles à séparer en deux espaces (coin jeux / coin nuit, ou bureau / chambre d’amis).',
    },
    {
      icone: 'ChefHat',
      titre: 'Séjour-cuisine de 32 m²',
      texte: 'Cuisine ouverte avec îlot, plaque induction, lave-vaisselle, four et micro-ondes intégrés (seul le réfrigérateur est à prévoir). Climatisation réversible.',
    },
    {
      icone: 'Zap',
      titre: 'Charges : environ 235 € par mois pour 4 personnes',
      texte: '707 € par trimestre : chauffage et eau chaude (gaz collectif), entretien, ascenseur, parking, fonds de travaux. Électricité à part : environ 45 € par mois.',
    },
    {
      icone: 'Car',
      titre: '2 places de parking en sous-sol',
      texte: 'En enfilade, dans un parking fermé et sécurisé. Ascenseur, fibre optique.',
    },
    {
      icone: 'Building2',
      titre: 'Une résidence récente, calme et bien gérée',
      texte: 'Immeuble de 2012. Un syndic actif et réactif (Domicia), d’une vraie aide au quotidien. Voisinage agréable et varié : beaucoup de jeunes couples, avec ou sans enfants, et d’autres profils.',
    },
  ],

  // Distances : estimations à pied/en voiture depuis l'adresse.
  // `aConfirmer` = estimation des propriétaires, à vérifier sur carte.
  proximites: [
    { categorie: 'Enfants', icone: 'ToyBrick', lieu: 'Aire de jeux pour les petits, au pied de l’immeuble', distance: 'en bas de chez vous' },
    { categorie: 'Enfants', icone: 'Baby', lieu: 'Crèche municipale Cassiopée', distance: '≈ 1 min à pied', gps: [43.653525, 1.369001], gpsVerifie: true, geo: '50 rue George Sand, 31700 Blagnac' },
    { categorie: 'Enfants', icone: 'Ecoliers', lieu: 'Groupe scolaire Les Perséides (maternelle et élémentaire)', distance: '≈ 13 min à pied', gps: [43.656987, 1.380421], gpsVerifie: true },
    { categorie: 'Enfants', icone: 'Ecoliers', lieu: 'Le Ferradou (établissement privé : élémentaire, collège, lycée)', distance: '≈ 15 min à pied' },
    { categorie: 'Enfants', icone: 'GraduationCap', lieu: 'Lycée Saint-Exupéry', distance: '≈ 7 min à pied', gps: [43.653763, 1.374846], gpsVerifie: true, geo: '1 place Alain Savary, 31700 Blagnac' },
    { categorie: 'Enfants', icone: 'Music', lieu: 'Conservatoire Résonance (musique et danse)', distance: '≈ 6 min à pied', gps: [43.65468, 1.374281], gpsVerifie: true, geo: '45 boulevard Alain Savary, 31700 Blagnac' },
    // Commerces de l'avenue d'Andromède : même rangée, positions espacées de quelques mètres pour la carte
    { categorie: 'Quotidien', icone: 'Croissant', lieu: 'Boulangerie Maison Blanchard, avenue d’Andromède', distance: '≈ 2 min à pied', gps: [43.655846, 1.370399], gpsVerifie: true, geo: '19 avenue d’Andromède, 31700 Blagnac' },
    { categorie: 'Quotidien', icone: 'Flower2', lieu: 'Fleuriste Jé Flors, avenue d’Andromède', distance: '≈ 2 min à pied', gps: [43.655461, 1.371003], gpsVerifie: true, geo: '22 avenue d’Andromède, 31700 Blagnac' },
    { categorie: 'Quotidien', icone: 'Fish', lieu: 'Yammy Sushi, avenue d’Andromède', distance: '≈ 2 min à pied', gps: [43.655019, 1.369009], gpsVerifie: true, geo: '8 avenue d’Andromède, 31700 Blagnac' },
    { categorie: 'Quotidien', icone: 'Pizza', lieu: 'Le Tchap, pizzeria et bar, avenue d’Andromède', distance: '≈ 2 min à pied', gps: [43.655213, 1.368958], gpsVerifie: true, geo: '8 avenue d’Andromède, 31700 Blagnac' },
    { categorie: 'Quotidien', icone: 'Beer', lieu: 'Papy Georges, bar à bières artisanales, avenue d’Andromède', distance: '≈ 2 min à pied', gps: [43.65574, 1.370034], gpsVerifie: true, geo: '17 avenue d’Andromède, 31700 Blagnac' },
    { categorie: 'Quotidien', icone: 'Newspaper', lieu: 'Tabac-presse d’Andromède, avenue d’Andromède', distance: '≈ 2 min à pied', gps: [43.655684, 1.369467], gpsVerifie: true, geo: '13 avenue d’Andromède, 31700 Blagnac' },
    { categorie: 'Quotidien', icone: 'Scissors', lieu: 'By Santos, coiffeur-barbier, avenue d’Andromède', distance: '≈ 2 min à pied', gps: [43.655431, 1.369749], gpsVerifie: true, geo: '14 bis avenue d’Andromède, 31700 Blagnac' },
    { categorie: 'Quotidien', icone: 'ShoppingBasket', lieu: 'En projet : Carrefour Market et salle de sport à la place de l’ancien Intermarché de l’avenue (travaux pas encore commencés)', distance: '≈ 2 min à pied', projet: true, gps: [43.655759, 1.370531], gpsVerifie: true, geo: '15 avenue d’Andromède, 31700 Blagnac' },
    { categorie: 'Quotidien', icone: 'ShoppingCart', lieu: 'E.Leclerc Blagnac (drive, galerie)', distance: '≈ 3 min en voiture', gps: [43.645812, 1.372548], gpsVerifie: true, geo: '2 allée Émile Zola, 31700 Blagnac' },
    { categorie: 'Quotidien', icone: 'Clapperboard', lieu: 'Cinéma Méga CGR (même centre que Leclerc)', distance: '≈ 3 min en voiture' },
    { categorie: 'Sport et nature', icone: 'Dumbbell', lieu: 'Sporting Village (salle de sport), face au lycée', distance: '≈ 7 min à pied', gps: [43.654432, 1.375891], gpsVerifie: true, geo: '18 boulevard Alain Savary, 31700 Blagnac' },
    { categorie: 'Sport et nature', icone: 'Dumbbell', lieu: 'On Air, salle de sport moderne et abordable (près de Leclerc)', distance: '≈ 8 min à pied', gps: [43.64939, 1.36767], geo: '16 rue Gustave Flaubert, 31700 Blagnac' },
    { categorie: 'Sport et nature', icone: 'Trees', lieu: 'Grand parc, juste après le tram T1 et à côté du conservatoire : allées vertes, petit bois, grande aire de jeux avec deux espaces balançoires', distance: '≈ 6 min à pied' },
    { categorie: 'Sport et nature', icone: 'TreeDeciduous', lieu: 'Coulée verte d’Andromède, vers les bords de Garonne', distance: 'quelques minutes à pied' },
    { categorie: 'Sport et nature', icone: 'Trophy', lieu: 'Complexe sportif Andromède (stade, gymnase, dojo)', distance: '≈ 13 min à pied', gps: [43.65524, 1.385947] },
    { categorie: 'Se déplacer', icone: 'TramFront', lieu: 'Tram T1, station Andromède-Lycée', distance: '≈ 5 min à pied', gps: [43.65477, 1.37364] },
    { categorie: 'Se déplacer', icone: 'Bus', lieu: 'Bus, arrêt Giusta', distance: '≈ 4 min à pied', aConfirmer: true },
    { categorie: 'Se déplacer', icone: 'Route', lieu: 'Rocade', distance: '≈ 2 min en voiture' },
    { categorie: 'Se déplacer', icone: 'Plane', lieu: 'Aéroport Toulouse-Blagnac et sites Airbus', distance: '5 à 15 min' },
    { categorie: 'Se déplacer', icone: 'Landmark', lieu: 'Toulouse Capitole (tram T1 + métro A)', distance: '≈ 40 à 45 min' },
  ],

  // « Ce qu'il faut savoir » : chaque point d'attention est suivi de notre
  // expérience réelle puis de solutions concrètes. Jamais l'un sans l'autre.
  pointsAttention: [
    {
      icone: 'Eye',
      sujet: 'Le vis-à-vis depuis la terrasse',
      constat: 'Un immeuble fait face à la terrasse. C’est la remarque qu’on nous fait le plus souvent, et nous nous étions posé la même question avant d’acheter.',
      experience: 'À l’usage, nous n’avons pas été gênés : les fenêtres en face sont le plus souvent fermées et les balcons très peu utilisés. Un vis-à-vis potentiel plus que réel. C’est notre expérience, pas une garantie. La vidéo le montre sans filtre.',
      solutions: 'Brise-vue, bacs végétalisés, voile d’ombrage : faciles à installer (dans le respect du règlement de copropriété).',
    },
    {
      icone: 'Sofa',
      sujet: 'L’agencement du séjour',
      constat: 'Nous avons organisé le séjour pour nos besoins : repas quotidiens à l’îlot, grande table qu’on déploie quand on reçoit, et un grand canapé.',
      experience: 'Ça nous convient parfaitement, mais ce n’est qu’une possibilité parmi d’autres.',
      solutions: 'Coin repas plus grand en réduisant le salon ; ou, si la 3e chambre n’est pas utile, ouvrir la chambre-bureau sur le séjour (cloison démontable, à faire valider par un professionnel) pour un séjour d’environ 44 m².',
    },
    {
      icone: 'Car',
      sujet: 'Deux places de parking en enfilade',
      constat: 'Les deux places sont l’une derrière l’autre.',
      experience: 'En pratique le parking est peu occupé : on passe par la gauche ou par la droite, de jour comme de nuit, sans jamais avoir été bloqués.',
      solutions: 'Si vous avez besoin d’une place indépendante ou d’un box, des places sont à vendre dans la résidence : le syndic peut vous indiquer lesquelles.',
    },
    {
      icone: 'Euro',
      sujet: 'Les charges de copropriété',
      constat: 'Environ 235 € par mois pour notre famille de quatre : 707 € par trimestre, dont 34,50 € de fonds de travaux (loi ALUR). La quote-part du budget courant est de 2 691 € par an.',
      experience: 'Elles comprennent le chauffage et l’eau chaude (chaudière gaz collective), l’entretien, l’ascenseur, le parking et le fonds de travaux. Après la hausse du gaz, le budget de la copropriété a été ramené de 215 000 € à 200 000 € en 2025 grâce à un nouveau contrat. De notre côté, l’électricité revient à environ 45 à 47 € par mois à quatre.',
      solutions: 'Nous transmettons les appels de fonds, le budget et les procès-verbaux d’assemblée générale à toute personne intéressée.',
    },
  ],

  faq: [
    {
      q: 'Pourquoi vendez-vous ?',
      r: 'Il nous manque une pièce : télétravail à deux, musique, famille qui s’agrandit. Nous achetons une maison… dans le même quartier, ce qui en dit long sur ce que nous en pensons.',
    },
    {
      q: 'Pourquoi vendre sans agence ?',
      r: 'Pour échanger directement avec vous, en toute transparence, et parce que vous n’avez aucune commission d’agence à payer : le prix affiché est le prix net.',
    },
    {
      q: 'Jusqu’à quand est-il en vente ?',
      r: 'Nous aimerions le vendre cet hiver. Sinon, nous le mettrons en location, ce qui nous convient aussi.',
    },
    {
      q: 'Le prix est-il négociable ?',
      r: 'Le prix a déjà été ajusté au marché. Nous étudions toute offre écrite accompagnée d’une attestation de financement. C’est directement avec nous que ça se discute.',
    },
    {
      q: 'Quels frais en plus du prix ?',
      r: 'Pas de frais d’agence. Restent les frais de notaire, d’environ 7 à 8 % du prix pour un logement de plus de 5 ans (montant exact donné par le notaire).',
    },
    {
      q: 'Et le DPE ?',
      r: 'Le diagnostic de performance énergétique est à jour : classe énergie C, classe climat C, dépenses d’énergie estimées entre 603 € et 815 € par an (prix de l’énergie 2021 à 2023). Établi le 03/08/2026, valable jusqu’en 2036. Ce montant théorique comprend le chauffage et l’eau chaude (chaudière collective au gaz, à condensation), déjà payés dans les charges ; l’électricité est à part, environ 45 € par mois pour notre famille de quatre. Le rapport complet est transmis aux acquéreurs qui le demandent.',
    },
    {
      q: 'Et la taxe foncière ?',
      r: '2 230 € pour 2025. L’avis est transmis avec les autres documents à toute personne intéressée.',
    },
    {
      q: 'Qu’est-ce qui reste dans l’appartement ?',
      r: 'La cuisine équipée : plaque induction, lave-vaisselle, four et micro-ondes intégrés. Seul le réfrigérateur est à prévoir.',
    },
    {
      q: 'Comment se passe une visite ?',
      r: 'Après un court échange sur WhatsApp ou par téléphone, nous vous faisons visiter nous-mêmes (environ 30 minutes). Nous commençons par le séjour et la terrasse, puis les chambres et la suite parentale. Ensuite, vous visitez librement, à votre rythme, et nous finissons par le parking.',
    },
  ],

  // Mentions obligatoires d'une annonce de vente (DPE, copropriété, Géorisques).
  // `null` = information pas encore confirmée : affichée « en cours de mise à jour ».
  reglementaire: {
    dpeEnergie: 'C',
    dpeClimat: 'C',
    depensesEnergie: 'entre 603 € et 815 € par an (prix 2021 à 2023)',
    depensesEnergieNote: 'Ce montant théorique comprend le chauffage et l’eau chaude, déjà payés dans les charges.',
    copropriete: true,
    lots: 259,
    chargesAnnuelles: '2 691 € (charges courantes, hors fonds de travaux)',
    // Procédures de copropriété en difficulté (art. 29-1 A et 29-1 de la loi du 10/07/1965)
    procedures: 'Aucune (art. 29-1 A et 29-1 de la loi de 1965)',
  },

  // Parcours de visite affiché sur le site.
  // **gras** : mots clés de chaque étape (rendus en gras sur le site)
  parcoursVisite: [
    '**Parcourez le site** : photos, plan, quartier et points d’attention. La visite sert alors à confirmer, pas à découvrir.',
    'Toujours intéressés ? **Écrivez-nous sur WhatsApp** : c’est le plus simple pour garder le fil de nos échanges et vous envoyer photos, plan ou documents. Quelques questions rapides sur votre projet, et nous fixons un créneau.',
    '**Première visite** avec nous, environ 30 minutes : séjour, terrasse, chambres, suite parentale, puis un temps libre pour revoir ce que vous voulez, et le parking.',
    'Avant une seconde visite ou une offre, **une attestation de financement** (banque ou courtier) ou, en cas d’achat comptant, un justificatif des fonds. Nous vous transmettons alors le dossier complet : diagnostics, procès-verbaux d’assemblée générale, charges.',
    '**Offre écrite**, réponse de notre part sous 48 h, puis compromis de vente chez le notaire.',
  ],
};
