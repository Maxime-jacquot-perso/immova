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
      'Le cadre ouvert aujourd’hui pour utiliser Axelys sur des opérations réelles, avec un retour direct à l’équipe.',
    highlights: [
      'Accès à Axelys sur vos dossiers réels',
      'Suivi des projets, lots, dépenses, documents et indicateurs utiles',
      'Accès progressif après échange, sans inscription automatique',
      'Retour direct à l’équipe pendant la phase pilote',
    ],
    footnote:
      'L’accès s’ouvre après validation de la demande. L’analyse détaillée et le suivi restent réservés aux comptes autorisés.',
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
    priceDetail: 'Offre en préparation pour un usage individuel plus cadré.',
    description:
      'Une future offre pour les profils qui veulent un cadre simple et resserré, sans couche de complexité inutile.',
    highlights: [
      'Pensée pour un usage individuel',
      'Périmètre plus resserré que l’offre Pro',
      'Visible aujourd’hui, non activable pour le moment',
    ],
    footnote:
      'Le périmètre reste volontairement prudent tant que le programme pilote n’a pas stabilisé les priorités.',
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
      'Une future offre pour les équipes qui veulent suivre plusieurs opérations avec une lecture portefeuille plus large.',
    highlights: [
      'Pensée pour un usage multi-projets',
      'Lecture portefeuille plus large',
      'Visible aujourd’hui, non activable pour le moment',
    ],
    footnote:
      'Rien n’est ouvert à la vente tant que le périmètre réel n’est pas assez stabilisé.',
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
    title: 'Pas de calculatrice gadget',
    body: 'Vous découvrez le cadre, les cas d’usage et la valeur d’Axelys. L’analyse détaillée s’utilise ensuite dans un accès réservé.',
  },
  {
    title: 'Une méthode qui reste fiable',
    body: 'Les décisions ne reposent pas sur un mini-calculateur simpliste ni sur des formules sorties de leur contexte.',
  },
  {
    title: 'Du contenu utile',
    body: 'Les pages et les articles répondent à de vraies questions métier et vous orientent vers la bonne porte d’entrée.',
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
      'Non. L’usage détaillé s’ouvre dans Axelys une fois l’accès validé. Les pages publiques servent à comprendre l’approche et les cas d’usage.',
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
    body: 'On regarde si Axelys peut être utile tout de suite et si le cadre pilote correspond bien à votre usage.',
  },
  {
    title: '3. Ouvrir l’accès',
    body: 'Si le contexte est retenu, l’ouverture se fait progressivement, avec une souscription déclenchée au bon moment.',
  },
];

export const clientPilotFaq = [
  {
    question: 'Le tarif pilote est-il public ?',
    answer:
      'Oui. Il est affiché clairement à 15 € / mois. En revanche, l’accès reste sélectif et n’est pas accordé automatiquement.',
  },
  {
    question: 'Simple et Pro sont-ils disponibles ?',
    answer:
      'Non. Ils restent visibles pour donner une lecture claire de la suite, mais ils ne sont pas encore activables.',
  },
  {
    question: 'Avez-vous accès à l’analyse détaillée dès maintenant ?',
    answer:
      'Seulement si votre demande est validée. L’analyse détaillée, le suivi et les arbitrages s’utilisent ensuite dans Axelys.',
  },
];
