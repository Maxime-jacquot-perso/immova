import type { LandingCtaLocation } from '../../lib/posthog-client';

export type NavigationItem = {
  href: string;
  label: string;
  matches?: string[];
};

export type FooterLinkGroup = {
  title: string;
  links: Array<{
    href: string;
    label: string;
  }>;
};

export type PricingPlan = {
  slug: 'client-pilote' | 'simple' | 'pro';
  name: string;
  status: string;
  statusTone: 'available' | 'pending';
  priceLabel: string;
  priceDetail: string;
  description: string;
  highlights: string[];
  footnote: string;
  featured?: boolean;
  disabled?: boolean;
  cta?: {
    href: string;
    label: string;
    location: LandingCtaLocation;
    trackingLabel: string;
    target?: string;
  };
};

export const marketingNavigation: NavigationItem[] = [
  {
    href: '/outils',
    label: 'Outils',
    matches: ['/outils'],
  },
  {
    href: '/pricing',
    label: 'Offres',
  },
  {
    href: '/client-pilote',
    label: 'Client pilote',
  },
  {
    href: '/analyse-projet-immobilier',
    label: 'Ressources',
    matches: [
      '/analyse-rentabilite-immobiliere',
      '/analyse-projet-immobilier',
      '/pilotage-operation-immobiliere',
    ],
  },
  {
    href: '/blog',
    label: 'Blog',
    matches: ['/blog'],
  },
];

export const footerLinkGroups: FooterLinkGroup[] = [
  {
    title: 'Axelys',
    links: [
      { href: '/', label: 'Accueil' },
      { href: '/outils', label: 'Outils immobiliers' },
      { href: '/pricing', label: 'Offres' },
      { href: '/client-pilote', label: 'Programme client pilote' },
    ],
  },
  {
    title: 'Sujets clés',
    links: [
      {
        href: '/analyse-rentabilite-immobiliere',
        label: 'Analyse de rentabilité immobilière',
      },
      {
        href: '/analyse-projet-immobilier',
        label: 'Analyse de projet immobilier',
      },
      {
        href: '/pilotage-operation-immobiliere',
        label: 'Pilotage d’opération immobilière',
      },
    ],
  },
  {
    title: 'Articles',
    links: [
      { href: '/blog', label: 'Blog' },
      {
        href: '/blog/comment-analyser-rentabilite-projet-immobilier-serieusement',
        label: 'Analyser la rentabilité sérieusement',
      },
      {
        href: '/blog/comment-reperer-derive-operation-immobiliere-avant-quil-soit-trop-tard',
        label: 'Repérer une dérive opérationnelle',
      },
    ],
  },
];

export const pricingPlans: PricingPlan[] = [
  {
    slug: 'client-pilote',
    name: 'Client pilote',
    status: 'Ouvert sur sélection',
    statusTone: 'available',
    priceLabel: '15 € / mois',
    priceDetail: 'Tarif pilote conservé pour les comptes retenus.',
    description:
      'Utilisez Axelys sur vos opérations réelles avec un accès accompagné pendant la phase pilote.',
    highlights: [
      'Accès à Axelys sur vos dossiers réels',
      'Suivi des projets, lots, dépenses, documents et indicateurs utiles',
      'Accès progressif après échange, sans inscription automatique',
      'Retour direct à l’équipe pendant la phase pilote',
    ],
    footnote:
      'Votre demande est étudiée avant l’ouverture de l’accès.',
    featured: true,
    cta: {
      href: '/client-pilote',
      label: 'Demander un accès',
      location: 'pricing',
      trackingLabel: 'open_client_pilot_page',
      target: '/client-pilote',
    },
  },
  {
    slug: 'simple',
    name: 'Simple',
    status: 'Bientôt disponible',
    statusTone: 'pending',
    priceLabel: 'À venir',
    priceDetail: 'Formule en préparation pour un usage individuel.',
    description:
      'Pour les investisseurs qui veulent un cadre de décision et de suivi plus resserré.',
    highlights: [
      'Pensée pour un usage individuel',
      'Périmètre plus resserré que l’offre Pro',
      'Visible aujourd’hui, non activable pour le moment',
    ],
    footnote:
      'L’ouverture sera annoncée dès que l’offre sera disponible.',
    disabled: true,
  },
  {
    slug: 'pro',
    name: 'Pro',
    status: 'Bientôt disponible',
    statusTone: 'pending',
    priceLabel: 'À venir',
    priceDetail: 'Offre en préparation pour les structures multi-projets.',
    description:
      'Pour les équipes qui veulent suivre plusieurs opérations avec une lecture portefeuille plus large.',
    highlights: [
      'Pensée pour un usage multi-projets',
      'Lecture portefeuille plus large',
      'Visible aujourd’hui, non activable pour le moment',
    ],
    footnote:
      'L’ouverture sera annoncée dès que l’offre sera disponible.',
    disabled: true,
  },
];

export const pricingMatrix = [
  {
    label: 'Disponibilité',
    values: ['Maintenant, sur sélection', 'À venir', 'À venir'],
  },
  {
    label: 'Mode d’accès',
    values: ['Demande puis validation humaine', 'Fermé', 'Fermé'],
  },
  {
    label: 'Pour qui',
    values: [
      'Investisseurs actifs, marchands de biens et petites structures qui veulent tester Axelys sur des cas réels',
      'Usage individuel au cadre plus resserré',
      'Structures multi-projets avec besoin de vision portefeuille',
    ],
  },
  {
    label: 'Statut',
    values: [
      'Ouvert aujourd’hui',
      'En préparation',
      'En préparation',
    ],
  },
];

export const homeHeroHighlights = [
  'Comparer une opportunité avec une vraie lecture de décision.',
  'Suivre ensuite les projets réels avec dépenses, lots, documents et indicateurs utiles.',
  'Garder un lien clair entre hypothèse initiale et réalité du projet.',
];

export const homeProblemCards = [
  {
    title: 'Vous avez des chiffres, pas une vraie lecture',
    body: 'Une opportunité peut sembler rentable et rester pourtant fragile si les frais, la durée ou le cash mobilisé sont mal relus.',
  },
  {
    title: 'Le tableur ne tient pas jusqu’au projet réel',
    body: 'L’hypothèse avant achat se perd vite, puis le suivi repart de zéro quand l’opération avance.',
  },
  {
    title: 'Les dérives remontent trop tard',
    body: 'Quand les dépenses, les pièces et les statuts sont dispersés, l’alerte arrive souvent après le vrai point de bascule.',
  },
  {
    title: 'Les bons repères ne sont jamais au même endroit',
    body: 'Il faut rouvrir plusieurs fichiers et plusieurs outils avant de pouvoir arbitrer correctement.',
  },
];

export const homeValueCards = [
  {
    title: 'Comparer avant d’engager',
    body: 'Axelys aide à lire une opportunité sous l’angle de la décision, pas seulement du calcul.',
  },
  {
    title: 'Piloter dans le même cadre',
    body: 'Le projet reste le point de lecture central, avec les lots, les dépenses, les documents et les indicateurs qui comptent vraiment.',
  },
  {
    title: 'Voir l’écart entre prévu et réel',
    body: 'Quand une opportunité devient un projet, la référence de départ reste exploitable pour repérer les dérives plus tôt.',
  },
];

export const homePrivateCoreCards = [
  {
    title: 'Des repères concrets',
    body: 'Estimez un projet, identifiez ses points de vigilance et avancez avec des chiffres lisibles.',
  },
  {
    title: 'Une lecture qui tient dans le temps',
    body: 'Les décisions reposent sur des chiffres relus dans leur contexte, puis sur un suivi qui ne repart pas de zéro.',
  },
  {
    title: 'Des méthodes directement utiles',
    body: 'Guides, outils et articles vous aident à comparer un dossier, préparer une offre ou suivre une opération.',
  },
];

export const homeFaqItems = [
  {
    question: 'Axelys est-il un simple simulateur immobilier ?',
    answer:
      'Non. Axelys aide à arbitrer avant achat puis à piloter après acquisition. Le calcul n’est qu’un moyen au service de la décision.',
  },
  {
    question: 'L’analyse détaillée est-elle ouverte à tous ?',
    answer:
      'Non. L’analyse détaillée s’ouvre dans Axelys une fois l’accès validé. Les contenus et outils ouverts donnent déjà un premier niveau de lecture.',
  },
  {
    question: 'Que peut-on activer aujourd’hui ?',
    answer:
      'Le programme client pilote. Les offres Simple et Pro sont visibles, mais elles ne sont pas encore ouvertes.',
  },
  {
    question: 'À qui sert Axelys maintenant ?',
    answer:
      'Aux investisseurs immobiliers actifs, marchands de biens et petites structures multi-projets qui veulent une lecture plus fiable de leurs décisions et de leurs opérations.',
  },
];

export const clientPilotSignals = [
  'Réponse humaine sous 24 à 48 h ouvrées',
  'Tarif pilote à 15 € / mois',
  'Accès ouvert quand l’usage est pertinent',
];

export const clientPilotSteps = [
  {
    title: '1. Présenter votre contexte',
    body: 'Vous décrivez votre profil, vos projets et la façon dont vous arbitrez ou pilotez aujourd’hui.',
  },
  {
    title: '2. Vérifier l’adéquation',
    body: 'On vérifie si Axelys peut vous aider dès maintenant et si le programme client pilote correspond bien à votre usage.',
  },
  {
    title: '3. Ouvrir l’accès',
    body: 'Si votre demande est retenue, l’ouverture se fait progressivement, avec une souscription déclenchée au bon moment.',
  },
];

export const clientPilotFaq = [
  {
    question: 'Le tarif pilote est-il public ?',
    answer:
      'Oui. Il est affiché clairement à 15 € / mois. Les demandes sont simplement validées avant l’ouverture de l’accès.',
  },
  {
    question: 'Simple et Pro sont-ils disponibles ?',
    answer:
      'Non. Leur ouverture sera annoncée lorsqu’ils seront disponibles.',
  },
  {
    question: 'Avez-vous accès à l’analyse détaillée dès maintenant ?',
    answer:
      'Seulement si votre demande est validée. Vous retrouvez ensuite dans Axelys l’analyse détaillée, le suivi et les arbitrages du projet.',
  },
];
