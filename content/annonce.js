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

  prix: {
    montant: 249000,
    affiche: '249 000 €',
    note: 'Prix net vendeur : vente directe entre particuliers, aucune commission d’agence',
  },

  // Vente à durée limitée : formulation validée, à ne pas enrichir.
  venteJusquau: '31 janvier 2027',
  messageDuree:
    'Vente à durée limitée : nous emménageons dans une maison. Si l’appartement n’a pas trouvé preneur au 31 janvier 2027, nous le mettrons en location. Nous préférons vous le dire dès maintenant.',

  // Badge mis en avant près du prix
  enDirect: 'Vente en direct · 0 € de frais d’agence',

  // Données personnelles (section « Confidentialité » en bas de page)
  confidentialite: [
    'Le site ne dépose aucun cookie publicitaire. La fréquentation est mesurée de façon agrégée (pages vues, source, ville approximative, type d’appareil).',
    'Si vous utilisez l’assistant, vos messages, leur heure, la ville approximative de connexion et le type d’appareil sont enregistrés et lus par Corinne & Arnaud, pour vous répondre et améliorer cette page. Votre adresse IP n’est pas conservée en clair. Évitez d’y écrire des informations personnelles sensibles.',
    'Ces données sont conservées 6 mois au plus et supprimées après la vente. Pour y accéder ou les faire effacer, écrivez-nous sur WhatsApp ou appelez-nous.',
  ],

  contact: {
    noms: 'Corinne & Arnaud',
    telephone: '06 23 94 79 77',
    telephoneIntl: '+33623947977',
    whatsapp: '33623947977',
  },

  // Courte vidéo de visite commentée (YouTube « non répertoriée »).
  // Laisser null tant qu'elle n'est pas tournée : la section est alors masquée.
  video: { youtubeId: null, duree: null },

  // Bandeau de chiffres clés sous le prix (pictos Lucide : content/icons.js)
  chiffresCles: [
    { icone: 'Ruler', valeur: '90,5 m²', label: 'Loi Carrez' },
    { icone: 'Sun', valeur: '63 m²', label: 'de terrasse' },
    { icone: 'BedDouble', valeur: '3 chambres', label: 'dont une suite' },
    { icone: 'SquareParking', valeur: '2 parkings', label: 'en sous-sol' },
    { icone: 'Building2', valeur: '1er étage', label: 'avec ascenseur' },
    { icone: 'TramFront', valeur: 'Tram T1', label: 'à 5-8 min à pied' },
  ],

  histoire: [
    'Arnaud est Blagnacais depuis longtemps et a habité plusieurs quartiers de la ville. Ses deux préférés : le centre-ville, pour son charme, quand on en a les moyens… et Andromède.',
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
      titre: 'Une vraie suite parentale',
      texte: 'Chambre de 17,4 m², grand dressing (ouvert aujourd’hui, il peut être fermé ou réaménagé) et salle d’eau privative de 3 m².',
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
      titre: 'Chauffage et eau dans les charges',
      texte: 'Résultat : une facture d’électricité d’environ 45 à 47 € par mois pour notre famille de quatre.',
    },
    {
      icone: 'Car',
      titre: '2 places de parking en sous-sol',
      texte: 'Parking fermé et sécurisé, ascenseur, fibre optique.',
    },
    {
      icone: 'Building2',
      titre: 'Une résidence récente et calme',
      texte: 'Immeuble de 2012. Voisinage agréable et varié : beaucoup de jeunes couples, avec ou sans enfants, et d’autres profils.',
    },
  ],

  // Distances : estimations à pied/en voiture depuis l'adresse.
  // `aConfirmer` = estimation des propriétaires, à vérifier sur carte.
  proximites: [
    { categorie: 'Enfants', icone: 'Baby', lieu: 'Crèche municipale Cassiopée', distance: '1 à 2 min à pied' },
    { categorie: 'Enfants', icone: 'School', lieu: 'Groupe scolaire Les Perséides (maternelle et élémentaire)', distance: '10 à 15 min à pied' },
    { categorie: 'Enfants', icone: 'School', lieu: 'Le Ferradou (établissement privé : élémentaire, collège, lycée)', distance: '≈ 15 min à pied', aConfirmer: true },
    { categorie: 'Enfants', icone: 'GraduationCap', lieu: 'Lycée Saint-Exupéry', distance: '≈ 5 min à pied' },
    { categorie: 'Enfants', icone: 'Music', lieu: 'Conservatoire Résonance (centre de Blagnac)', distance: '≈ 10 min en voiture', aConfirmer: true },
    { categorie: 'Quotidien', icone: 'Croissant', lieu: 'Boulangerie et fleuriste, avenue d’Andromède', distance: '5 à 10 min à pied' },
    { categorie: 'Quotidien', icone: 'Pizza', lieu: 'Restaurants : sushis, pizzas', distance: '5 à 10 min à pied' },
    { categorie: 'Quotidien', icone: 'ShoppingBasket', lieu: 'Carrefour Market + salle de sport : reprise annoncée du supermarché de l’avenue', distance: '5 à 10 min à pied', aConfirmer: true },
    { categorie: 'Quotidien', icone: 'ShoppingCart', lieu: 'E.Leclerc Blagnac (drive, galerie)', distance: '≈ 5 min en voiture' },
    { categorie: 'Quotidien', icone: 'Clapperboard', lieu: 'Cinéma Méga CGR', distance: '≈ 5 min en voiture' },
    { categorie: 'Sport et nature', icone: 'Dumbbell', lieu: 'Sporting Village (salle de sport), face au lycée', distance: '≈ 5 min à pied' },
    { categorie: 'Sport et nature', icone: 'Dumbbell', lieu: 'On Air, salle de sport moderne et abordable (près de Leclerc)', distance: '≈ 5 min en voiture' },
    { categorie: 'Sport et nature', icone: 'Trees', lieu: 'Parc et coulée verte d’Andromède, vers les bords de Garonne', distance: 'quelques minutes à pied' },
    { categorie: 'Sport et nature', icone: 'Building2', lieu: 'Complexe sportif Andromède (stade, gymnase, dojo)', distance: 'à pied' },
    { categorie: 'Se déplacer', icone: 'TramFront', lieu: 'Tram T1, station Andromède-Lycée', distance: '5 à 8 min à pied' },
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
      constat: 'Environ 200 € par mois (montant exact en cours de vérification sur les derniers appels de fonds).',
      experience: 'Elles comprennent le chauffage, l’eau et l’entretien des parties communes. En contrepartie, notre facture d’électricité est d’environ 45 à 47 € par mois à quatre.',
      solutions: 'Nous transmettons les appels de fonds et le budget de la copropriété à toute personne intéressée.',
      aConfirmer: true,
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
      r: 'Jusqu’au 31 janvier 2027. Ensuite, s’il n’est pas vendu, nous le mettrons en location.',
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
      r: 'Le diagnostic de performance énergétique est à jour : classe énergie C. Le chauffage collectif est inclus dans les charges. Le rapport complet est transmis aux acquéreurs qui le demandent.',
    },
    {
      q: 'Qu’est-ce qui reste dans l’appartement ?',
      r: 'La cuisine équipée : plaque induction, lave-vaisselle, four et micro-ondes intégrés. Seul le réfrigérateur est à prévoir.',
    },
    {
      q: 'Comment se passe une visite ?',
      r: 'Après un court échange sur WhatsApp ou par téléphone, nous vous faisons visiter nous-mêmes (environ 45 minutes). Nous commençons par le séjour et la terrasse, puis les chambres et la suite parentale. Ensuite, vous visitez librement, à votre rythme, et nous finissons par le parking.',
    },
  ],

  // Mentions obligatoires d'une annonce de vente (DPE, copropriété, Géorisques).
  // `null` = information pas encore confirmée : affichée « en cours de mise à jour ».
  reglementaire: {
    dpeEnergie: 'C',
    dpeClimat: null,
    depensesEnergie: null, // ex. 'entre 700 € et 1 000 € par an (prix moyens des énergies indexés au 1er janvier 2025)'
    copropriete: true,
    lots: 259,
    chargesAnnuelles: null, // quote-part annuelle moyenne du budget prévisionnel, ex. '2 400 €'
    procedures: null, // ex. 'Aucune procédure en cours'
  },

  // Parcours de visite affiché sur le site.
  parcoursVisite: [
    'Regardez les photos, la vidéo et les points d’attention : la visite sert alors à confirmer, pas à découvrir.',
    'Demandez une visite : quelques questions rapides, puis votre message part directement sur notre WhatsApp.',
    'Nous vous rappelons pour un court échange et nous fixons un créneau ensemble.',
    'Visite avec nous, environ 45 minutes : séjour, terrasse, chambres, suite parentale, puis un temps libre pour revoir ce que vous voulez, et le parking.',
    'Avant une seconde visite ou une offre, nous demandons une attestation de financement (banque ou courtier) ou, en cas d’achat comptant, un justificatif des fonds. Nous transmettons alors le dossier complet : diagnostics, procès-verbaux d’assemblée générale, charges.',
    'Offre écrite, puis compromis de vente chez le notaire.',
  ],
};
