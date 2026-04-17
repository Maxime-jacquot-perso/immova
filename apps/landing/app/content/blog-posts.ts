export type BlogPostSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  publishedAt: string;
  updatedAt: string;
  readingTime: string;
  category: string;
  keywords: string[];
  featured?: boolean;
  intro: string[];
  sections: BlogPostSection[];
  relatedPagePaths: string[];
  relatedPostSlugs: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'comment-analyser-rentabilite-projet-immobilier-serieusement',
    title:
      'Comment analyser la rentabilité d’un projet immobilier sérieusement',
    description:
      'Une méthode sobre pour analyser la rentabilité d’un projet immobilier sans se limiter à un seul rendement ni exposer le moteur métier.',
    excerpt:
      'Une rentabilité “propre” sur le papier ne suffit pas. Une analyse sérieuse relie coût total, cash mobilisé, durée, risques et capacité à piloter la suite.',
    publishedAt: '2026-04-17',
    updatedAt: '2026-04-17',
    readingTime: '8 min',
    category: 'Analyse',
    keywords: [
      'analyse rentabilité immobilière',
      'projet immobilier rentable',
      'investissement immobilier décision',
    ],
    featured: true,
    intro: [
      'Beaucoup de projets paraissent “rentables” tant qu’on les résume à un chiffre simple. Le problème, c’est qu’un projet ne se vit jamais dans cette simplification. Il se vit avec des frais, du temps, des arbitrages et des hypothèses qui peuvent se retourner vite.',
      'Analyser sérieusement la rentabilité d’un projet immobilier, ce n’est donc pas produire un chiffre plus sophistiqué. C’est construire une lecture qui permet de décider si l’on s’engage, si l’on négocie, ou si l’on passe au dossier suivant.',
    ],
    sections: [
      {
        title: 'Le piège du rendement unique',
        paragraphs: [
          'Le rendement brut a un avantage: il se calcule vite et se compare facilement. Mais cette vitesse produit aussi une illusion de sécurité. Un projet peut afficher un rendement séduisant tout en consommant trop de trésorerie, en reposant sur des travaux mal estimés ou sur une durée d’exécution beaucoup trop optimiste.',
          'Autrement dit, le rendement n’est pas inutile. Il est simplement insuffisant. Tant qu’il n’est pas remis dans un cadre plus large, il peut rassurer précisément là où il faudrait se méfier.',
        ],
      },
      {
        title: 'Les questions qu’une analyse doit vraiment couvrir',
        paragraphs: [
          'Une analyse sérieuse ne cherche pas seulement à dire “combien ça rapporte”. Elle doit aussi répondre à des questions opérationnelles: quel capital faut-il immobiliser, à quel moment, avec quelle marge de sécurité et sous quelles conditions de sortie.',
          'C’est cette profondeur de lecture qui transforme un calcul en outil d’arbitrage. Sans elle, on obtient un chiffre. Avec elle, on obtient une décision.',
        ],
        bullets: [
          'Quel est le coût total réel du dossier, pas seulement le prix d’achat ?',
          'Quel niveau de fonds propres faut-il engager ?',
          'La durée estimée du projet reste-t-elle cohérente avec la stratégie visée ?',
          'Le projet supporte-t-il encore une hypothèse moins favorable ?',
        ],
      },
      {
        title: 'Pourquoi Excel suffit rarement à cadrer la décision',
        paragraphs: [
          'Un tableur reste un très bon outil de travail individuel. Le problème apparaît quand il devient la colonne vertébrale de la décision. Les hypothèses changent, les versions s’accumulent, les pièces justificatives vivent ailleurs et l’on finit par comparer des projets dont les bases ne sont pas homogènes.',
          'Le risque n’est pas seulement l’erreur de cellule. Le vrai risque, c’est la dérive méthodologique: chaque opportunité est analysée avec des conventions légèrement différentes, ce qui rend la comparaison de moins en moins fiable.',
        ],
      },
      {
        title: 'Tester la solidité plutôt que chercher le scénario parfait',
        paragraphs: [
          'Analyser sérieusement ne veut pas dire construire un moteur tentaculaire. Dans beaucoup de cas, quelques points de tension bien choisis suffisent déjà à savoir si le dossier tient ou non. Ce qui compte, c’est la lisibilité des hypothèses et la capacité à voir rapidement où se trouve la fragilité principale.',
          'C’est d’ailleurs souvent là que se joue la qualité d’une négociation. Un projet peut rester intéressant, mais seulement à condition de bouger un prix, un poste travaux ou un mode de financement.',
        ],
      },
      {
        title: 'Relier l’avant achat au projet réel',
        paragraphs: [
          'La meilleure analyse reste incomplète si elle meurt au moment où l’on achète. Le vrai gain de maturité consiste à garder une trace exploitable de l’hypothèse retenue, puis à la confronter au réel une fois le projet lancé.',
          'Cette continuité change profondément la qualité de pilotage: au lieu de repartir de zéro, on sait ce qui était prévu, ce qui a bougé et pourquoi une dérive mérite ou non une action immédiate.',
        ],
      },
    ],
    relatedPagePaths: [
      '/analyse-rentabilite-immobiliere',
      '/analyse-projet-immobilier',
    ],
    relatedPostSlugs: [
      'pourquoi-excel-rentable-peut-cacher-mauvais-projet-immobilier',
      'indicateurs-a-suivre-avant-de-sengager-sur-operation-immobiliere',
    ],
  },
  {
    slug: 'pourquoi-excel-rentable-peut-cacher-mauvais-projet-immobilier',
    title:
      'Pourquoi un projet immobilier “rentable” sur Excel peut être mauvais en réalité',
    description:
      'Excel peut rassurer trop vite. Voici pourquoi un projet immobilier apparemment rentable peut rester faible, fragile ou mal piloté.',
    excerpt:
      'Le tableur donne souvent une réponse avant d’avoir posé le cadre. C’est pratique, mais dangereux quand il faut vraiment arbitrer.',
    publishedAt: '2026-04-17',
    updatedAt: '2026-04-17',
    readingTime: '7 min',
    category: 'Décision',
    keywords: [
      'excel projet immobilier',
      'rentabilité immobilière excel',
      'analyse projet immobilier',
    ],
    intro: [
      'Excel n’est pas le problème. Le problème, c’est tout ce qu’on lui fait porter quand on lui demande à la fois de calculer, de comparer, de documenter et de servir de mémoire du dossier.',
      'C’est ainsi qu’un projet “rentable” dans un fichier peut rester mauvais en réalité: non parce que le tableur ment, mais parce qu’il simplifie trop ou qu’il agrège mal ce qui compte vraiment pour décider.',
    ],
    sections: [
      {
        title: 'Le faux confort de la précision',
        paragraphs: [
          'Un résultat chiffré au centime près donne une impression de maîtrise. Pourtant, la précision apparente d’un tableau ne dit rien sur la qualité des hypothèses. Si le prix de sortie est trop optimiste ou si la durée est sous-estimée, la présentation soignée ne change rien au fond du problème.',
          'Cette précision visuelle peut même devenir contre-productive: elle décourage la remise en question, alors que c’est précisément ce que devrait provoquer une bonne analyse.',
        ],
      },
      {
        title: 'Les coûts oubliés ne sautent pas toujours aux yeux',
        paragraphs: [
          'Dans beaucoup de fichiers, certains coûts sont saisis tard, approximativement ou hors du tableau principal. Cela ne suffit pas à rendre le calcul faux au sens strict, mais cela suffit largement à biaiser la conclusion.',
          'Plus l’analyse est répartie sur plusieurs onglets, plusieurs sources et plusieurs conventions de saisie, plus la qualité de lecture se dégrade.',
        ],
        bullets: [
          'Frais annexes d’acquisition traités trop vite',
          'Travaux rangés dans une estimation trop globale',
          'Durée et coût de portage relus trop tard',
          'Cash réellement mobilisé sous-estimé',
        ],
      },
      {
        title: 'Le dossier change, le fichier dérive',
        paragraphs: [
          'Le plus gros problème d’Excel n’est pas le calcul lui-même. C’est la vie du dossier. Un devis arrive, une banque revient, une négociation avance, une hypothèse change. Très vite, il devient difficile de savoir quelle version fait foi.',
          'À partir de là, le tableur cesse d’être un outil d’arbitrage fiable. Il devient un support de discussion parmi d’autres, alors qu’on continue parfois à lui accorder un statut de vérité.',
        ],
      },
      {
        title: 'Pourquoi cela nuit aussi au pilotage',
        paragraphs: [
          'Quand le projet est retenu, le fichier reste souvent à part de l’opération réelle. On repart alors sur un autre outil pour les dépenses, les documents et le suivi quotidien. L’hypothèse initiale ne sert plus de référence vivante.',
          'Ce cloisonnement est coûteux: il crée de la ressaisie, de la perte de contexte et une lecture plus lente des écarts quand les premiers vrais arbitrages arrivent.',
        ],
      },
      {
        title: 'Ce qu’il faut chercher à la place',
        paragraphs: [
          'Le bon objectif n’est pas d’abandonner les tableurs par principe. C’est de mettre en place un cadre où la comparaison des opportunités, la décision retenue et le pilotage réel restent suffisamment reliés pour produire des arbitrages fiables.',
          'C’est précisément la logique qu’un outil comme Axelys cherche à couvrir: un site public éditorial pour expliquer le besoin, et une application privée pour porter l’analyse détaillée et la suite opérationnelle.',
        ],
      },
    ],
    relatedPagePaths: [
      '/analyse-rentabilite-immobiliere',
      '/pilotage-operation-immobiliere',
    ],
    relatedPostSlugs: [
      'comment-analyser-rentabilite-projet-immobilier-serieusement',
      'pourquoi-centraliser-projets-immobiliers-change-la-prise-de-decision',
    ],
  },
  {
    slug: 'indicateurs-a-suivre-avant-de-sengager-sur-operation-immobiliere',
    title:
      'Les indicateurs à suivre avant de s’engager sur une opération immobilière',
    description:
      'Quels indicateurs regarder avant de s’engager sur un projet immobilier, sans réduire la décision à un simple ratio.',
    excerpt:
      'Avant de s’engager, il faut quelques indicateurs vraiment décisionnels et pas une pluie de chiffres décoratifs.',
    publishedAt: '2026-04-17',
    updatedAt: '2026-04-17',
    readingTime: '7 min',
    category: 'Analyse',
    keywords: [
      'indicateurs projet immobilier',
      'analyse opération immobilière',
      'décision investissement immobilier',
    ],
    intro: [
      'Le danger classique, avant de s’engager sur une opération immobilière, n’est pas le manque de chiffres. C’est l’excès de chiffres mal hiérarchisés. Plus on accumule d’indicateurs, plus on risque de perdre de vue ceux qui changent vraiment la décision.',
      'Une bonne lecture avant achat ne cherche donc pas la profusion. Elle cherche quelques indicateurs fiables, explicables et directement utiles à l’arbitrage.',
    ],
    sections: [
      {
        title: '1. Le coût total du projet',
        paragraphs: [
          'Le premier indicateur utile n’est pas glamour: c’est le coût total. Tant que ce coût n’est pas relu sérieusement, le reste devient fragile. Un projet peut sembler séduisant parce que son prix d’entrée est bas, tout en devenant nettement moins intéressant une fois l’ensemble des coûts rassemblé.',
          'Cet indicateur sert à poser la base. Sans lui, tout le raisonnement en aval flotte.',
        ],
      },
      {
        title: '2. Les fonds propres réellement mobilisés',
        paragraphs: [
          'Le capital immobilisé n’est pas un détail. C’est une condition de faisabilité et souvent un révélateur de tension. Deux projets à rentabilité apparente proche peuvent avoir un profil très différent selon le cash à engager.',
          'C’est aussi un indicateur qui évite de se raconter des histoires: un dossier peut être “intéressant”, mais pas au bon moment de trésorerie.',
        ],
      },
      {
        title: '3. La durée et l’effort de portage',
        paragraphs: [
          'Le temps déforme profondément la qualité d’une opération. Plus la durée estimée s’étire, plus certains postes deviennent sensibles et plus le projet demande de solidité.',
          'Regarder la durée et l’effort de portage, ce n’est pas complexifier l’analyse. C’est remettre la décision dans le temps réel où elle devra être tenue.',
        ],
      },
      {
        title: '4. La marge de sécurité',
        paragraphs: [
          'Un indicateur utile n’est pas seulement un résultat attendu. C’est aussi une capacité de résistance. Si un projet s’effondre dès qu’un poste bouge légèrement, la lecture doit le montrer clairement.',
          'Parler de marge de sécurité revient à se demander: qu’est-ce qui se passe si le prix, les travaux, la durée ou la sortie ne se comportent pas comme prévu ?',
        ],
      },
      {
        title: '5. Les risques documentés et les zones de flou',
        paragraphs: [
          'Le niveau de fiabilité d’un dossier compte autant que ses chiffres. Un projet bien présenté mais appuyé sur des éléments incomplets mérite souvent plus de prudence qu’un projet un peu moins flatteur mais mieux documenté.',
          'C’est là qu’un outil de décision sérieux doit rester explicable: il ne se contente pas d’afficher un score, il aide à comprendre ce qui manque ou ce qui tire réellement le dossier vers le bas.',
        ],
        bullets: [
          'Travaux encore très approximatifs',
          'Financement non sécurisé',
          'Hypothèse de sortie peu robuste',
          'Pièces ou informations structurantes encore manquantes',
        ],
      },
    ],
    relatedPagePaths: [
      '/analyse-projet-immobilier',
      '/analyse-rentabilite-immobiliere',
    ],
    relatedPostSlugs: [
      'comment-analyser-rentabilite-projet-immobilier-serieusement',
      'comment-reperer-derive-operation-immobiliere-avant-quil-soit-trop-tard',
    ],
  },
  {
    slug: 'comment-reperer-derive-operation-immobiliere-avant-quil-soit-trop-tard',
    title:
      'Comment repérer une dérive sur une opération immobilière avant qu’il soit trop tard',
    description:
      'Voir une dérive assez tôt pour agir: budget, pièces, lots, indicateurs utiles et signaux à surveiller dans une opération immobilière.',
    excerpt:
      'Une dérive utile à voir est une dérive encore rattrapable. Le pilotage sert précisément à lire ces signaux avant le constat post-mortem.',
    publishedAt: '2026-04-17',
    updatedAt: '2026-04-17',
    readingTime: '8 min',
    category: 'Pilotage',
    keywords: [
      'dérive projet immobilier',
      'pilotage opération immobilière',
      'alertes projet immobilier',
    ],
    featured: true,
    intro: [
      'Beaucoup d’équipes découvrent une dérive au moment où elle a déjà coûté trop cher. Le sujet n’est donc pas d’avoir plus de reporting. Le sujet est d’avoir des signaux lisibles assez tôt pour décider.',
      'Sur une opération immobilière, le bon pilotage consiste à savoir quel projet mérite d’être ouvert maintenant, pourquoi il remonte et quelle action devient la plus probable.',
    ],
    sections: [
      {
        title: 'Une dérive ne commence pas quand le problème est visible par tous',
        paragraphs: [
          'Une dérive démarre rarement avec une catastrophe. Elle commence souvent par des micro-signaux: un poste qui glisse, un justificatif qui manque, un lot qui ne suit pas la trajectoire attendue, un délai qui s’allonge sans être reformulé clairement.',
          'Le rôle d’un outil de pilotage n’est pas de dramatiser chaque variation. Il est de rendre visibles celles qui méritent une attention immédiate.',
        ],
      },
      {
        title: 'Les signaux faibles à surveiller en priorité',
        paragraphs: [
          'Tous les écarts ne se valent pas. Certains sont administratifs, d’autres modifient réellement l’équilibre d’une opération. Il faut donc hiérarchiser les signaux plutôt que d’empiler des alertes.',
          'Les meilleurs signaux ont un point commun: ils sont directement reliés à une action ou à une décision de correction.',
        ],
        bullets: [
          'Dépenses engagées qui dépassent la référence sur un poste sensible',
          'Justificatifs manquants sur des dépenses récentes',
          'Hypothèse prévisionnelle qui s’éloigne du réel sans explication claire',
          'Projet qui monopolise trop d’attention par rapport aux autres dossiers',
        ],
      },
      {
        title: 'Pourquoi les outils dispersés font perdre du temps de décision',
        paragraphs: [
          'Quand les documents, les dépenses et la lecture des lots vivent dans des outils séparés, personne n’a une vision fiable du projet sans reconstitution. C’est cette reconstitution qui consomme l’attention disponible et retarde les arbitrages.',
          'Le danger n’est pas seulement l’inconfort. C’est l’effet de latence: le temps passé à recomposer le dossier est du temps perdu pour agir.',
        ],
      },
      {
        title: 'Le lien entre hypothèse initiale et réel change la qualité de lecture',
        paragraphs: [
          'Quand une opération provient d’une opportunité analysée en amont, le pilotage gagne énormément si la référence initiale reste accessible. On ne lit plus seulement un projet “en l’état”; on lit un écart par rapport à ce qui avait justifié la décision.',
          'C’est cette continuité qui rend les alertes plus utiles: elles ne signalent pas seulement qu’un chiffre bouge, elles montrent qu’un engagement initial est en train de se tendre.',
        ],
      },
      {
        title: 'Ce qu’il faut viser concrètement',
        paragraphs: [
          'Le bon pilotage n’a pas besoin d’être spectaculaire. Il doit simplement permettre d’ouvrir le bon dossier, de comprendre vite ce qui bouge et de corriger tôt. C’est une logique d’anticipation, pas d’animation.',
          'Dans cette perspective, Axelys se positionne comme un outil de décision et de pilotage immobilier, pas comme un ERP ni comme un simple stockage de données.',
        ],
      },
    ],
    relatedPagePaths: [
      '/pilotage-operation-immobiliere',
      '/client-pilote',
    ],
    relatedPostSlugs: [
      'pourquoi-centraliser-projets-immobiliers-change-la-prise-de-decision',
      'indicateurs-a-suivre-avant-de-sengager-sur-operation-immobiliere',
    ],
  },
  {
    slug: 'pourquoi-centraliser-projets-immobiliers-change-la-prise-de-decision',
    title:
      'Pourquoi centraliser ses projets immobiliers change la prise de décision',
    description:
      'Centraliser ses projets immobiliers n’est pas une question de confort. C’est ce qui permet d’ouvrir le bon dossier, de voir les dérives et de garder un cadre de décision fiable.',
    excerpt:
      'Centraliser, ce n’est pas empiler des données. C’est rendre les arbitrages plus rapides, plus fiables et moins dépendants de la mémoire du moment.',
    publishedAt: '2026-04-17',
    updatedAt: '2026-04-17',
    readingTime: '6 min',
    category: 'Organisation',
    keywords: [
      'centraliser projets immobiliers',
      'outil pilotage immobilier',
      'vision portefeuille immobilier',
    ],
    intro: [
      'Tant qu’on gère un seul dossier, on peut parfois tenir avec de la mémoire, quelques tableurs et un drive correctement rangé. Dès que plusieurs projets avancent en parallèle, ce fonctionnement montre vite ses limites.',
      'Centraliser ses projets immobiliers n’est donc pas un sujet d’esthétique organisationnelle. C’est un sujet de qualité de décision: quel dossier ouvrir, où agir et sur quelle base trancher.',
    ],
    sections: [
      {
        title: 'Ouvrir le bon projet d’abord',
        paragraphs: [
          'La première valeur d’une centralisation saine est la priorité. Quand tout est dispersé, on travaille souvent sur le dossier le plus bruyant ou le plus récent, pas sur celui qui mérite vraiment une décision.',
          'Une vision centralisée permet au contraire de faire remonter les projets qui demandent une action, ceux qui dérivent, ou ceux qui manquent d’éléments pour être considérés comme fiables.',
        ],
      },
      {
        title: 'Éviter la reconstitution permanente',
        paragraphs: [
          'Dans beaucoup d’organisations, chaque arbitrage commence par une remise en contexte: rouvrir les bons fichiers, retrouver le dernier devis, vérifier où en est la dépense, relire les notes. Cette reconstitution permanente coûte énormément d’énergie.',
          'Centraliser, c’est réduire ce coût caché. On passe moins de temps à retrouver le dossier et plus de temps à décider.',
        ],
      },
      {
        title: 'Relier documents, chiffres et statut réel',
        paragraphs: [
          'Une donnée sans contexte aide rarement à décider. Une dépense isolée, un document isolé ou un indicateur isolé ne suffisent pas. Ce qui compte, c’est leur rattachement au bon projet, au bon lot, au bon moment et au bon niveau de tension.',
          'C’est cette cohérence que cherche Axelys: un projet comme centre de gravité, avec une lecture décisionnelle plutôt qu’un empilement d’informations.',
        ],
      },
      {
        title: 'Centraliser ne veut pas dire complexifier',
        paragraphs: [
          'Beaucoup de porteurs de projets repoussent la centralisation par peur d’un outil trop lourd. Cette crainte est légitime. Elle rappelle justement qu’un bon outil doit rester sobre et concentré sur ce qui aide à décider ou à piloter.',
          'Autrement dit: pas besoin d’un ERP pour mieux trancher. Il faut surtout un cadre lisible, capable de relier l’avant achat, le projet réel et les dérives importantes.',
        ],
      },
    ],
    relatedPagePaths: [
      '/pilotage-operation-immobiliere',
      '/analyse-projet-immobilier',
    ],
    relatedPostSlugs: [
      'comment-reperer-derive-operation-immobiliere-avant-quil-soit-trop-tard',
      'pourquoi-excel-rentable-peut-cacher-mauvais-projet-immobilier',
    ],
  },
];

export function getBlogPostBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export function getFeaturedBlogPosts(limit = 3) {
  return blogPosts.filter((post) => post.featured).slice(0, limit);
}

export function getRelatedBlogPosts(slugs: string[]) {
  return slugs
    .map((slug) => getBlogPostBySlug(slug))
    .filter((post): post is BlogPost => Boolean(post));
}
