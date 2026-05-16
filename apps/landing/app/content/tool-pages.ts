export type ToolCalculatorKind =
  | 'rental-yield'
  | 'notary-fees'
  | 'cashflow'
  | 'rental-simulation';

export type ToolPageContent = {
  path: string;
  title: string;
  description: string;
  keywords: string[];
  updatedAt: string;
  eyebrow: string;
  heroTitle: string;
  heroLead: string;
  heroPoints: string[];
  sidebarTitle: string;
  sidebarBody: string;
  sidebarPoints: string[];
  calculator: {
    kind: ToolCalculatorKind;
    title: string;
    description: string;
  };
  pedagogy: {
    title: string;
    paragraphs: string[];
    bullets?: string[];
  };
  limits: {
    title: string;
    paragraphs: string[];
    bullets: string[];
  };
  axelys: {
    title: string;
    paragraphs: string[];
    bullets: string[];
  };
  relatedPagePaths: string[];
  relatedBlogSlugs: string[];
};

export type ToolPageListItem = {
  href: string;
  title: string;
  description: string;
  updatedAt: string;
};

export const toolPages: Record<string, ToolPageContent> = {
  rentalYield: {
    path: '/outils/calcul-rentabilite-locative',
    title: 'Calcul rentabilité locative',
    description:
      'Calculez une rentabilité locative brute et une rentabilité nette simplifiée pour obtenir un premier repère avant d’analyser un projet plus en profondeur.',
    keywords: [
      'calcul rentabilité locative',
      'rentabilité brute immobilière',
      'rentabilité nette simplifiée',
    ],
    updatedAt: '2026-05-14',
    eyebrow: 'Rentabilité locative',
    heroTitle:
      'Calcul rentabilité locative : obtenir un premier repère sans surinterpréter le résultat',
    heroLead:
      'Estimez rapidement la rentabilité brute et la rentabilité nette simplifiée d’un bien locatif avant une visite, une offre ou une comparaison.',
    heroPoints: [
      'La rentabilité brute relie les loyers annuels au coût d’acquisition total.',
      'La rentabilité nette simplifiée retire les charges récurrentes les plus évidentes.',
      'Le résultat reste indicatif tant que la vacance, la fiscalité, les travaux lourds et le financement ne sont pas relus sérieusement.',
    ],
    sidebarTitle: 'Quand ce calcul est utile',
    sidebarBody:
      'Il aide surtout à filtrer vite une opportunité, à repérer un écart évident ou à comparer plusieurs biens avec une même base de départ.',
    sidebarPoints: [
      'Se faire une idée après une visite',
      'Comparer deux opportunités sans ouvrir un tableur complet',
      'Vérifier si un dossier mérite une analyse plus approfondie',
    ],
    calculator: {
      kind: 'rental-yield',
      title: 'Calculateur de rentabilité locative',
      description:
        'Saisissez le prix, les frais, les travaux, le loyer mensuel et vos charges annuelles récurrentes pour obtenir un premier repère.',
    },
    pedagogy: {
      title: 'Comment lire le résultat',
      paragraphs: [
        'La rentabilité brute compare les loyers encaissables sur une année au coût total de départ. C’est un indicateur utile pour un premier tri, parce qu’il se comprend vite et permet des comparaisons simples.',
        'La rentabilité nette simplifiée va un peu plus loin : elle retire les charges annuelles récurrentes les plus visibles avant de rapporter le résultat au même investissement de départ. Elle reste simple, sans reconstruire un compte d’exploitation complet.',
      ],
      bullets: [
        'Rentabilité brute = loyers annuels / investissement total',
        'Rentabilité nette simplifiée = (loyers annuels - charges annuelles) / investissement total',
        'L’investissement total intègre ici prix d’achat, frais de notaire estimés et travaux saisis',
      ],
    },
    limits: {
      title: 'Limites du calcul',
      paragraphs: [
        'Un bon rendement apparent peut masquer un projet fragile. Ce calcul ne dit rien, à lui seul, de la qualité réelle d’une opération.',
      ],
      bullets: [
        'Il ne traite pas la vacance locative ni les impayés.',
        'Il ne modélise pas la fiscalité réelle de votre situation.',
        'Il ne distingue pas les charges récupérables et non récupérables avec finesse.',
        'Il ne mesure pas le poids du financement ni l’effort de trésorerie.',
        'Il ne capte pas les travaux futurs, les gros entretiens ou le risque de sortie.',
      ],
    },
    axelys: {
      title: 'Aller plus loin avec Axelys',
      paragraphs: [
        'Dans Axelys, une opportunité ne se résume pas à un pourcentage. L’application relie rentabilité, coût total, cash mobilisé, durée, tension du dossier et recommandation de lecture.',
        'Vous voyez ainsi si le projet reste intéressant, s’il mérite une négociation ou s’il devient trop fragile au regard de ses chiffres.',
      ],
      bullets: [
        'Comparer plusieurs opportunités dans un même dossier d’achat',
        'Conserver des repères cohérents d’un dossier à l’autre',
        'Relier ensuite la décision retenue au pilotage du projet réel',
      ],
    },
    relatedPagePaths: [
      '/analyse-rentabilite-immobiliere',
      '/analyse-projet-immobilier',
    ],
    relatedBlogSlugs: [
      'comment-analyser-rentabilite-projet-immobilier-serieusement',
      'indicateurs-a-suivre-avant-de-sengager-sur-operation-immobiliere',
    ],
  },
  notaryFees: {
    path: '/outils/calcul-frais-notaire',
    title: 'Calcul frais de notaire',
    description:
      'Estimez simplement des frais de notaire en ancien ou en neuf pour mieux lire le coût total d’acquisition d’un projet immobilier.',
    keywords: [
      'calcul frais de notaire',
      'estimation frais de notaire ancien',
      'frais de notaire neuf',
    ],
    updatedAt: '2026-05-14',
    eyebrow: 'Frais d’acquisition',
    heroTitle:
      'Calcul des frais de notaire : estimer le coût d’acquisition sans promettre une précision impossible',
    heroLead:
      'Les frais de notaire pèsent immédiatement sur le coût total du projet et sur les fonds propres à mobiliser. Cette estimation reste simple pour donner un ordre de grandeur cohérent en ancien ou en neuf.',
    heroPoints: [
      'Le calcul repose sur un taux indicatif par type de bien.',
      'Il permet surtout de remettre le coût d’acquisition complet dans la discussion.',
      'Il ne remplace pas un décompte officiel ni une lecture détaillée de l’acte.',
    ],
    sidebarTitle: 'Pourquoi c’est un sujet clé',
    sidebarBody:
      'Beaucoup d’arbitrages sont biaisés parce que le prix d’achat est relu seul, sans intégrer sérieusement les frais d’acquisition dès le départ.',
    sidebarPoints: [
      'Voir le vrai ticket d’entrée d’une opportunité',
      'Mesurer l’impact immédiat sur le cash à mobiliser',
      'Éviter un projet séduisant sur le prix mais dégradé sur le coût total',
    ],
    calculator: {
      kind: 'notary-fees',
      title: 'Estimations indicatives ancien / neuf',
      description:
        'Choisissez un type de bien et saisissez le prix d’achat pour estimer des frais de notaire simplifiés.',
    },
    pedagogy: {
      title: 'Comment lire cette estimation',
      paragraphs: [
        'Le but n’est pas de reproduire un calcul juridique exhaustif. Le but est de replacer les frais de notaire dans le coût total du dossier, là où ils influencent directement la faisabilité et la décision.',
        'En pratique, beaucoup de porteurs de projet sous-estiment ces frais ou les ajoutent trop tard. Or quelques milliers d’euros oubliés suffisent à déformer une rentabilité, un cashflow ou un besoin de financement.',
      ],
      bullets: [
        'Ancien : ordre de grandeur généralement plus élevé',
        'Neuf : ordre de grandeur généralement plus faible',
        'Le résultat aide à relire le coût global du projet',
      ],
    },
    limits: {
      title: 'Limites du calcul',
      paragraphs: [
        'Cette estimation reste purement indicative. Elle ne doit pas être confondue avec un chiffrage officiel de notaire.',
      ],
      bullets: [
        'Elle ne tient pas compte des particularités exactes du dossier ou du département.',
        'Elle ne prend pas en compte les cas spécifiques liés au mobilier ou à certaines exonérations.',
        'Elle ne remplace ni un acte préparé ni une simulation notariale détaillée.',
        'Elle n’intègre pas la stratégie globale du projet, les travaux ou la durée.',
      ],
    },
    axelys: {
      title: 'Aller plus loin avec Axelys',
      paragraphs: [
        'Axelys replace l’estimation des frais d’acquisition dans une lecture de projet plus large, avec coût total, financement, cash mobilisé et recommandation décisionnelle.',
        'L’intérêt n’est pas d’afficher un montant seul, mais de voir comment il modifie l’équilibre réel d’une opportunité et la pertinence de la négociation.',
      ],
      bullets: [
        'Lire l’impact sur le coût total et les fonds propres',
        'Comparer plusieurs niveaux de prix d’achat dans un même dossier',
        'Garder une base exploitable quand l’opportunité est retenue',
      ],
    },
    relatedPagePaths: [
      '/analyse-projet-immobilier',
      '/analyse-rentabilite-immobiliere',
    ],
    relatedBlogSlugs: [
      'indicateurs-a-suivre-avant-de-sengager-sur-operation-immobiliere',
      'pourquoi-excel-rentable-peut-cacher-mauvais-projet-immobilier',
    ],
  },
  cashflow: {
    path: '/outils/calcul-cashflow-immobilier',
    title: 'Calcul cashflow immobilier',
    description:
      'Calculez un cashflow immobilier mensuel simplifié à partir des loyers, de la mensualité et des charges récurrentes.',
    keywords: [
      'calcul cashflow immobilier',
      'cashflow locatif',
      'cash flow investissement locatif',
    ],
    updatedAt: '2026-05-14',
    eyebrow: 'Cashflow locatif',
    heroTitle:
      'Calcul cashflow immobilier : utile pour cadrer, insuffisant pour valider un projet',
    heroLead:
      'Le cashflow est un repère concret parce qu’il parle immédiatement de trésorerie mensuelle. Mais un cashflow positif ne suffit jamais, à lui seul, pour conclure qu’une opération est saine ou adaptée à votre stratégie.',
    heroPoints: [
      'Le calcul présenté ici retire simplement la mensualité et les charges récurrentes des loyers.',
      'Il aide à voir si le projet respire ou se tend en exploitation courante.',
      'Il ne remplace pas une lecture du coût d’entrée, du risque, de la vacance ou du capital immobilisé.',
    ],
    sidebarTitle: 'Ce que le cashflow éclaire',
    sidebarBody:
      'C’est un bon signal de trésorerie. Il devient trompeur dès qu’on oublie le coût d’entrée, la vacance ou les postes qui peuvent dégrader le dossier.',
    sidebarPoints: [
      'Mesurer rapidement une marge mensuelle apparente',
      'Comparer plusieurs niveaux de loyer ou de mensualité',
      'Repérer une opération déjà trop tendue en version simplifiée',
    ],
    calculator: {
      kind: 'cashflow',
      title: 'Calculateur de cashflow immobilier',
      description:
        'Renseignez les loyers mensuels, la mensualité de crédit et les charges récurrentes pour obtenir un cashflow simplifié.',
    },
    pedagogy: {
      title: 'Comment lire ce cashflow simplifié',
      paragraphs: [
        'Le calcul présenté ici va droit au but : loyers mensuels moins mensualité de crédit moins charges récurrentes. Il donne un repère rapide, sans reconstituer une comptabilité immobilière détaillée.',
        'Son intérêt principal est d’aider à repérer une tension de trésorerie évidente. Son défaut principal est de pouvoir rassurer à tort si l’on oublie le coût d’entrée, les risques locatifs ou la qualité globale du dossier.',
      ],
      bullets: [
        'Cashflow mensuel = loyers - mensualité - charges récurrentes',
        'Cashflow annuel = cashflow mensuel x 12',
        'Le calcul ne dit rien, à lui seul, de la pertinence du projet',
      ],
    },
    limits: {
      title: 'Limites du calcul',
      paragraphs: [
        'Un cashflow positif peut coexister avec une mauvaise opération. À l’inverse, un cashflow légèrement tendu n’invalide pas automatiquement un projet si le reste du dossier est solide.',
      ],
      bullets: [
        'La vacance locative n’est pas modélisée.',
        'La fiscalité réelle n’est pas prise en compte.',
        'Les travaux futurs et gros entretiens sont absents.',
        'Le capital immobilisé et le coût d’acquisition ne sont pas relus ici.',
        'La stratégie globale du projet et sa marge de sécurité restent hors champ.',
      ],
    },
    axelys: {
      title: 'Aller plus loin avec Axelys',
      paragraphs: [
        'Axelys remet le cashflow à sa place : un indicateur parmi d’autres, jamais un verdict autonome. L’application relie ce repère à la lecture du coût total, du financement, du niveau de risque et du projet réel à piloter ensuite.',
        'Cette approche évite de confondre un projet “respirable” sur un mois moyen avec un projet réellement pertinent à l’achat puis robuste dans le temps.',
      ],
      bullets: [
        'Relire le cashflow dans un cadre décisionnel plus complet',
        'Comparer plusieurs montages sans perdre le fil du dossier',
        'Suivre ensuite les écarts entre prévu et réel sur les projets retenus',
      ],
    },
    relatedPagePaths: [
      '/pilotage-operation-immobiliere',
      '/analyse-rentabilite-immobiliere',
    ],
    relatedBlogSlugs: [
      'comment-reperer-derive-operation-immobiliere-avant-quil-soit-trop-tard',
      'pourquoi-excel-rentable-peut-cacher-mauvais-projet-immobilier',
    ],
  },
  rentalSimulation: {
    path: '/outils/simulation-investissement-locatif',
    title: 'Simulation investissement locatif',
    description:
      'Lancez une simulation d’investissement locatif simplifiée pour comparer prix d’achat, loyer, charges, apport et emprunt.',
    keywords: [
      'simulation investissement locatif',
      'simulateur investissement locatif',
      'calcul projet locatif',
    ],
    updatedAt: '2026-05-14',
    eyebrow: 'Simulation locative',
    heroTitle:
      'Simulation d’investissement locatif : poser les chiffres clés avant d’analyser un dossier',
    heroLead:
      'Rassemblez en quelques champs le prix, les frais, les travaux, l’apport, l’emprunt, le loyer et les charges pour obtenir un premier ordre de grandeur.',
    heroPoints: [
      'La saisie reste simple pour être remplie rapidement.',
      'Il met sur la même page coût total, mensualité estimée, rentabilité brute et cashflow simplifié.',
      'Il ne remplace pas une analyse approfondie, des scénarios multiples ou une décision personnalisée.',
    ],
    sidebarTitle: 'Le bon usage de cette simulation',
    sidebarBody:
      'Elle aide à trier un dossier après une visite, une négociation ou une comparaison entre plusieurs opportunités locatives.',
    sidebarPoints: [
      'Comparer vite plusieurs niveaux de prix ou d’apport',
      'Voir l’impact d’un apport ou d’un financement plus tendu',
      'Identifier les dossiers qui méritent une vraie analyse ensuite',
    ],
    calculator: {
      kind: 'rental-simulation',
      title: 'Simulation locative simplifiée',
      description:
        'Renseignez les principaux repères du projet pour obtenir une estimation cohérente du coût, du financement et de l’exploitation.',
    },
    pedagogy: {
      title: 'Ce que cette simulation montre vraiment',
      paragraphs: [
        'Le but est de relier quelques variables décisives dans une même lecture : prix d’achat, frais d’acquisition, travaux, apport, mensualité de crédit, loyer et charges récurrentes. C’est souvent suffisant pour distinguer un dossier prometteur d’un dossier déjà trop tendu.',
        'Cette simulation reste simple pour être utilisable rapidement. Quand le dossier mérite d’aller plus loin, il faut ensuite relire les charges, la vacance, la fiscalité, le financement et la stratégie de sortie avec plus de profondeur.',
      ],
      bullets: [
        'Coût total estimé du projet',
        'Montant financé et mensualité approximative',
        'Rentabilité brute et cashflow simplifié',
      ],
    },
    limits: {
      title: 'Limites du calcul',
      paragraphs: [
        'Ce simulateur reste un premier filtre. Il ne suffit pas pour valider un investissement ni pour prendre un engagement financier personnalisé.',
      ],
      bullets: [
        'Il n’intègre pas la fiscalité réelle ni les régimes spécifiques.',
        'Il ne gère pas plusieurs scénarios détaillés ou plusieurs stratégies de sortie.',
        'Il ne couvre pas la vacance locative, les impayés ou les travaux lourds futurs avec précision.',
        'Il ne produit pas de recommandation personnalisée en fonction de votre situation.',
      ],
    },
    axelys: {
      title: 'Aller plus loin avec Axelys',
      paragraphs: [
        'Axelys va au-delà d’une simulation isolée. L’application permet de structurer plusieurs opportunités dans des dossiers d’achat, d’activer des hypothèses différentes et de comparer les projets avec la même grille de lecture.',
        'Si une opportunité est retenue, la base de départ peut ensuite être convertie vers un projet réel sans repartir de zéro, ce qui évite de ressaisir l’ensemble des données.',
      ],
      bullets: [
        'Comparer plusieurs simulations dans un même dossier d’opportunités',
        'Conserver des repères lisibles dans le temps',
        'Passer de la simulation retenue au projet réel dans le même cadre',
      ],
    },
    relatedPagePaths: [
      '/analyse-projet-immobilier',
      '/client-pilote',
    ],
    relatedBlogSlugs: [
      'comment-analyser-rentabilite-projet-immobilier-serieusement',
      'pourquoi-centraliser-projets-immobiliers-change-la-prise-de-decision',
    ],
  },
};

export const toolPageList: ToolPageListItem[] = Object.values(toolPages).map(
  (page) => ({
    href: page.path,
    title: page.title,
    description: page.description,
    updatedAt: page.updatedAt,
  }),
);

export function getToolPageBySlug(slug: string) {
  return Object.values(toolPages).find(
    (page) => page.path === `/outils/${slug}`,
  );
}
