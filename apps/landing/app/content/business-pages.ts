export type BusinessPageCard = {
  title: string;
  body: string;
};

export type BusinessPageSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type BusinessPageContent = {
  path: string;
  title: string;
  description: string;
  eyebrow: string;
  heroTitle: string;
  heroLead: string;
  heroPoints: string[];
  problemCards: BusinessPageCard[];
  sections: BusinessPageSection[];
  sidebarTitle: string;
  sidebarBody: string;
  sidebarPoints: string[];
  relatedBlogSlugs: string[];
};

export const businessPages: Record<string, BusinessPageContent> = {
  profitabilityAnalysis: {
    path: '/analyse-rentabilite-immobiliere',
    title: 'Analyse de rentabilité immobilière',
    description:
      'Comprendre ce qu’implique une analyse de rentabilité immobilière sérieuse, au-delà d’un simple rendement affiché dans un tableur.',
    eyebrow: 'Page métier',
    heroTitle: 'Analyse de rentabilité immobilière: décider sans se raconter d’histoire',
    heroLead:
      'Une analyse de rentabilité utile ne sert pas à produire un chiffre flatteur. Elle sert à décider si un projet mérite vraiment d’être poussé, négocié ou écarté.',
    heroPoints: [
      'Un bon arbitrage croise coût total, cash mobilisé, durée, tension et capacité de sortie.',
      'Un rendement isolé ne suffit pas à qualifier une opportunité.',
      'Le site public d’Axelys reste éditorial: le moteur détaillé reste dans l’application privée.',
    ],
    problemCards: [
      {
        title: 'Le rendement seul rassure à tort',
        body: 'Il peut masquer un besoin de trésorerie trop lourd, une durée mal estimée ou une hypothèse de sortie trop optimiste.',
      },
      {
        title: 'Excel donne une réponse avant de poser le cadre',
        body: 'On y met vite un chiffre, mais rarement la même discipline de lecture d’un dossier à l’autre.',
      },
      {
        title: 'La décision n’est pas reliée au réel',
        body: 'Une fois le bien acquis, l’hypothèse de départ se perd au lieu de devenir une référence de pilotage.',
      },
    ],
    sections: [
      {
        title: 'Pourquoi une bonne analyse de rentabilité dépasse le calcul',
        paragraphs: [
          'Parler de rentabilité immobilière sans parler de décision conduit souvent à une fausse précision. Le problème n’est pas de savoir si un chiffre existe. Le problème est de savoir si ce chiffre aide réellement à dire oui, non ou “à renégocier”.',
          'Une analyse sérieuse remet donc la rentabilité dans un ensemble plus large: coût global, financement, durée probable, marge de sécurité, niveau de risque et cohérence avec la stratégie du porteur de projet.',
        ],
      },
      {
        title: 'Les limites d’un tableur dispersé',
        paragraphs: [
          'Le tableur reste utile pour explorer une hypothèse, mais il devient fragile quand plusieurs opportunités doivent être comparées rapidement. Les versions se multiplient, les hypothèses implicites changent et les documents de référence vivent ailleurs.',
          'Le résultat est connu: on croit comparer des projets comparables alors qu’on compare des saisies incomplètes, des conventions différentes et des hypothèses jamais stabilisées.',
        ],
        bullets: [
          'Une cellule masquée ou recopiée peut modifier la conclusion.',
          'Le coût réel d’acquisition est souvent reconstitué trop tard.',
          'Les arbitrages se prennent sans trace claire des hypothèses retenues.',
        ],
      },
      {
        title: 'Ce qu’Axelys apporte sans exposer son moteur publiquement',
        paragraphs: [
          'Axelys n’a pas vocation à publier un calculateur ouvert à tous. Le site public explique la méthode, les limites des approches artisanales et ce que doit contenir une vraie analyse de rentabilité. Le détail du moteur, lui, reste dans l’application.',
          'Cette séparation est volontaire: elle protège la cohérence produit, évite le faux libre-service et maintient la qualité de l’analyse dans un contexte authentifié, traçable et relié au projet réel.',
        ],
      },
      {
        title: 'De la décision avant achat au pilotage après acquisition',
        paragraphs: [
          'La valeur ne s’arrête pas à une décision de principe. Quand une opportunité est retenue, le vrai enjeu devient la capacité à suivre l’écart entre l’hypothèse initiale et la réalité terrain.',
          'C’est précisément là qu’un outil structuré change la donne: l’analyse n’est plus un document mort, elle devient une base de référence pour piloter.',
        ],
      },
    ],
    sidebarTitle: 'Ce que cherche un investisseur sérieux',
    sidebarBody:
      'Pas un chiffre qui rassure, mais un cadre qui aide à arbitrer vite sans perdre la suite du projet.',
    sidebarPoints: [
      'Comparer plusieurs opportunités avec la même grille',
      'Éviter les coûts oubliés et les hypothèses implicites',
      'Conserver une référence claire pour la suite du pilotage',
    ],
    relatedBlogSlugs: [
      'comment-analyser-rentabilite-projet-immobilier-serieusement',
      'pourquoi-excel-rentable-peut-cacher-mauvais-projet-immobilier',
      'indicateurs-a-suivre-avant-de-sengager-sur-operation-immobiliere',
    ],
  },
  projectAnalysis: {
    path: '/analyse-projet-immobilier',
    title: 'Analyse de projet immobilier',
    description:
      'Structurer une analyse de projet immobilier utile, capable d’aider à arbitrer avant achat sans se noyer dans des tableurs dispersés.',
    eyebrow: 'Page métier',
    heroTitle: 'Analyse de projet immobilier: passer d’un “ça peut marcher” à une vraie décision',
    heroLead:
      'Un projet immobilier ne se juge pas sur une intuition, ni sur un seul ratio. Il se juge sur la qualité de son cadre d’analyse et sur la capacité à relier l’avant achat à la suite opérationnelle.',
    heroPoints: [
      'Une opportunité doit pouvoir être comparée à d’autres, pas seulement décrite.',
      'Une bonne analyse éclaire la négociation autant que la décision finale.',
      'La logique détaillée reste dans l’application privée, pas dans une page publique gadget.',
    ],
    problemCards: [
      {
        title: 'L’analyse reste souvent narrative',
        body: 'On accumule des informations hétérogènes sans les transformer en arbitrage exploitable.',
      },
      {
        title: 'Les hypothèses changent sans trace claire',
        body: 'Prix, travaux ou financement bougent, mais on ne sait plus quelle version sert vraiment de base.',
      },
      {
        title: 'Le dossier retenu repart de zéro',
        body: 'Le projet réel est recréé séparément, avec un risque direct de ressaisie et de perte de contexte.',
      },
    ],
    sections: [
      {
        title: 'Ce qu’une analyse de projet doit vraiment répondre',
        paragraphs: [
          'Une bonne analyse de projet immobilier ne dit pas seulement “combien ça rapporte”. Elle répond à des questions plus difficiles: faut-il s’engager, à quelles conditions, avec quel niveau de tension, et quelles hypothèses sont les plus fragiles.',
          'Sans ce cadrage, l’analyse devient décorative. Elle produit des chiffres, mais elle n’aide pas à choisir ni à préparer la suite.',
        ],
        bullets: [
          'Quel capital faut-il réellement mobiliser ?',
          'Quel est le point de tension principal du dossier ?',
          'Qu’est-ce qui justifie une offre, une négociation ou un refus ?',
        ],
      },
      {
        title: 'Pourquoi les approches artisanales finissent par coûter cher',
        paragraphs: [
          'Quand chaque dossier vit dans un fichier isolé, la comparaison devient pénible et peu fiable. Les mêmes champs ne sont pas toujours renseignés, les conventions diffèrent et les informations se dispersent entre notes, mails, devis et pièces jointes.',
          'Le coût n’est pas seulement du temps perdu. C’est aussi un risque de décision biaisée, parce qu’on arbitre sur une vision incomplète ou reconstruite trop vite.',
        ],
      },
      {
        title: 'Le rôle d’Axelys dans cette phase',
        paragraphs: [
          'Axelys vise un usage très clair: aider à structurer les opportunités avant achat, puis convertir proprement une décision retenue en projet exploitable dans l’application.',
          'Le site public décrit cette logique et ses bénéfices. Le détail de la mécanique, les calculs complets et la conversion concrète restent toutefois réservés aux comptes autorisés.',
        ],
      },
      {
        title: 'Préparer la suite sans alourdir la saisie',
        paragraphs: [
          'Le bon équilibre consiste à recueillir assez d’informations pour décider, sans transformer l’analyse en usine à gaz. C’est particulièrement important après une visite ou dans une phase de négociation où le temps de saisie doit rester maîtrisé.',
          'Cette sobriété de saisie ne doit pas empêcher de garder une base exploitable pour la suite. C’est toute la différence entre un brouillon jetable et un vrai dossier d’opportunité.',
        ],
      },
    ],
    sidebarTitle: 'Une analyse utile, concrètement',
    sidebarBody:
      'Elle aide à comparer, à négocier et à préparer la suite sans refaire entièrement le travail une fois le bien acquis.',
    sidebarPoints: [
      'Moins de dispersion entre notes, tableurs et devis',
      'Une lecture claire des hypothèses actives',
      'Une base de départ exploitable pour le projet réel',
    ],
    relatedBlogSlugs: [
      'indicateurs-a-suivre-avant-de-sengager-sur-operation-immobiliere',
      'pourquoi-centraliser-projets-immobiliers-change-la-prise-de-decision',
      'comment-analyser-rentabilite-projet-immobilier-serieusement',
    ],
  },
  operationsPilotage: {
    path: '/pilotage-operation-immobiliere',
    title: 'Pilotage d’opération immobilière',
    description:
      'Mieux piloter une opération immobilière après achat en reliant dépenses, lots, documents, indicateurs utiles et alertes de dérive.',
    eyebrow: 'Page métier',
    heroTitle: 'Pilotage d’opération immobilière: voir les dérives avant qu’elles ne deviennent des dégâts',
    heroLead:
      'Le pilotage ne consiste pas à stocker des données. Il consiste à lire vite ce qui bouge, ce qui dérive et ce qui demande une décision maintenant, pas dans trois semaines.',
    heroPoints: [
      'Dépenses, lots, documents et indicateurs utiles doivent rester dans le même contexte.',
      'Une alerte utile est une alerte anticipative, pas un constat post-mortem.',
      'La promesse d’Axelys reste sobre: aider à décider et à corriger, pas faire de la gestion locative ou un ERP immobilier.',
    ],
    problemCards: [
      {
        title: 'Le projet n’a plus de centre de gravité',
        body: 'Les documents sont séparés, les dépenses aussi, et personne ne sait où lire le vrai état du dossier.',
      },
      {
        title: 'Les écarts sont vus en retard',
        body: 'On comprend qu’un budget ou un planning a bougé quand la décision coûte déjà plus cher à prendre.',
      },
      {
        title: 'Les KPI ne servent pas à agir',
        body: 'Trop d’indicateurs décoratifs finissent par masquer les seuls chiffres qui méritent vraiment une action.',
      },
    ],
    sections: [
      {
        title: 'Pourquoi le pilotage opérationnel se dégrade vite',
        paragraphs: [
          'Après acquisition, la réalité s’installe rapidement: nouveaux devis, dépenses imprévues, pièces manquantes, lots à suivre, arbitrages à reprendre. Si chaque élément part dans son propre outil, la lecture du projet se fragilise presque immédiatement.',
          'Le problème n’est pas l’absence de données. C’est l’absence d’un point de lecture fiable qui relie les données à une décision concrète.',
        ],
      },
      {
        title: 'Ce que les approches dispersées ratent le plus souvent',
        paragraphs: [
          'Excel, un drive partagé et quelques messages suffisent parfois à démarrer. Mais dès que plusieurs opérations tournent en parallèle, ces outils montrent leurs limites: impossible de savoir rapidement quel projet ouvrir, quelle dérive traiter ou quel justificatif manque.',
          'Le vrai coût de cette dispersion est un coût d’attention. On passe son temps à reconstituer le dossier au lieu de décider.',
        ],
        bullets: [
          'Les pièces justificatives n’arrivent pas au bon moment dans la discussion.',
          'Les écarts budgétaires sont relus trop tard.',
          'La vision portefeuille reste imprécise.',
        ],
      },
      {
        title: 'Le rôle d’un outil comme Axelys',
        paragraphs: [
          'Axelys sert à rendre le projet lisible: dépenses, lots, documents, états de tension et indicateurs utiles restent attachés au même contexte. L’objectif n’est pas d’ajouter des dashboards pour la forme, mais de faire ressortir ce qui doit être corrigé ou arbitré.',
          'Cette logique vaut aussi quand le projet provient d’une opportunité retenue auparavant: la référence initiale reste exploitable pour lire les écarts entre prévisionnel et réel.',
        ],
      },
      {
        title: 'Des alertes qui servent vraiment',
        paragraphs: [
          'Une alerte utile n’est pas là pour colorer un écran. Elle doit permettre d’anticiper un problème ou de prioriser une action. C’est ce qui distingue un outil de pilotage d’un simple entrepôt de données.',
          'Autrement dit: moins d’indicateurs décoratifs, plus de signaux exploitables. C’est ce que recherchent les équipes qui pilotent plusieurs opérations sans vouloir s’équiper d’un ERP.',
        ],
      },
    ],
    sidebarTitle: 'Le pilotage utile en pratique',
    sidebarBody:
      'Ouvrir le bon projet, voir la tension réelle, comprendre pourquoi elle existe et corriger plus tôt.',
    sidebarPoints: [
      'Lecture projet et portefeuille plus fiable',
      'Dérives visibles plus tôt',
      'Pièces et chiffres rattachés au même dossier',
    ],
    relatedBlogSlugs: [
      'comment-reperer-derive-operation-immobiliere-avant-quil-soit-trop-tard',
      'pourquoi-centraliser-projets-immobiliers-change-la-prise-de-decision',
      'pourquoi-excel-rentable-peut-cacher-mauvais-projet-immobilier',
    ],
  },
};

export const businessPageList = Object.values(businessPages).map((page) => ({
  href: page.path,
  title: page.title,
  description: page.description,
}));
