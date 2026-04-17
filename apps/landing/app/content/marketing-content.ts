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
    label: 'Pricing',
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
      { href: '/pricing', label: 'Pricing' },
      { href: '/client-pilote', label: 'Programme client pilote' },
    ],
  },
  {
    title: 'Pages métier',
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
    title: 'Contenu',
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
    priceDetail: 'Tarif pilote conservé pour les comptes retenus à ce stade.',
    description:
      'Le programme actif aujourd’hui pour tester Axelys sur des projets réels, avec un cadre simple et un retour produit direct.',
    highlights: [
      'Accès à l’application privée actuelle',
      'Pilotage des projets, lots, dépenses, documents et indicateurs utiles',
      'Parcours d’accès humain et progressif, sans inscription automatique',
      'Échanges directs avec l’équipe pendant la phase pilote',
    ],
    footnote:
      'La souscription n’est proposée qu’après validation de la demande. Le simulateur et la conversion restent dans l’application privée.',
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
    priceDetail:
      'Positionnement provisoire pour un usage individuel plus cadré.',
    description:
      'Une future offre destinée aux profils qui veulent un cadre plus resserré, sans ouvrir tout le périmètre organisationnel.',
    highlights: [
      'Orientation prévue pour un usage individuel',
      'Périmètre plus limité que l’offre Pro',
      'Non activable publiquement pour le moment',
    ],
    footnote:
      'Le contour exact reste volontairement prudent tant que le pilote n’a pas consolidé les priorités produit.',
    disabled: true,
  },
  {
    slug: 'pro',
    name: 'Pro',
    status: 'Bientôt disponible',
    statusTone: 'pending',
    priceLabel: 'À venir',
    priceDetail:
      'Positionnement provisoire pour les structures multi-projets.',
    description:
      'Une future offre pensée pour les équipes ou organisations qui veulent piloter plusieurs opérations avec une lecture portefeuille plus large.',
    highlights: [
      'Orientation prévue pour du multi-projets',
      'Lecture portefeuille et coordination plus avancées',
      'Non activable publiquement pour le moment',
    ],
    footnote:
      'Rien n’est ouvert à la vente tant que le périmètre réel n’est pas suffisamment stabilisé.',
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
    label: 'Cible prioritaire',
    values: [
      'Investisseurs actifs et marchands de biens qui veulent tester Axelys sur des cas réels',
      'Usage individuel au périmètre plus resserré',
      'Structures multi-projets et vision portefeuille',
    ],
  },
  {
    label: 'Niveau de maturité',
    values: [
      'Produit actuel',
      'Positionnement en préparation',
      'Positionnement en préparation',
    ],
  },
];

export const homeHeroHighlights = [
  'Décider avant achat sans transformer le site public en simulateur gadget.',
  'Piloter ensuite les projets réels avec dépenses, lots, documents et indicateurs utiles.',
  'Relier hypothèses et réalité sans double saisie complète quand l’opportunité devient un projet.',
];

export const homeProblemCards = [
  {
    title: 'Vous calculez, mais vous arbitrez mal',
    body: 'Une opportunité “rentable” sur le papier peut rester faible si la durée, les frais et le cash mobilisé sont mal cadrés.',
  },
  {
    title: 'Le tableur ne survit pas au passage à l’action',
    body: 'L’hypothèse avant achat se perd, puis il faut reconstituer le projet réel à la main.',
  },
  {
    title: 'Les dérives remontent trop tard',
    body: 'Quand dépenses, pièces et statuts sont dispersés, la mauvaise surprise apparaît après le point de bascule.',
  },
  {
    title: 'Les bons indicateurs ne sont jamais au même endroit',
    body: 'Il faut rouvrir plusieurs fichiers et plusieurs outils avant de pouvoir décider correctement.',
  },
];

export const homeValueCards = [
  {
    title: 'Décider avant achat',
    body: 'Axelys aide à comparer des opportunités dans un cadre de décision simple, crédible et réservé à l’application privée.',
  },
  {
    title: 'Piloter après acquisition',
    body: 'Le projet devient un centre de gravité concret: lots, dépenses, documents, KPI et alertes utiles restent liés au même dossier.',
  },
  {
    title: 'Lire l’écart entre prévisionnel et réel',
    body: 'Quand une simulation retenue se transforme en projet, la référence de départ reste exploitable pour repérer les dérives.',
  },
];

export const homePrivateCoreCards = [
  {
    title: 'Pas de simulateur public réel',
    body: 'Le site public explique la méthode et la valeur. Les calculs détaillés et le moteur de conversion restent derrière authentification.',
  },
  {
    title: 'Pas de copie facile du cœur produit',
    body: 'Aucune page publique ne déroule la logique complète de calcul, les règles détaillées ou un outil exploitable sans accès.',
  },
  {
    title: 'Oui à un contenu SEO utile',
    body: 'Les pages publiques répondent aux vraies questions métier et orientent vers le programme client pilote sans vider l’application de sa valeur.',
  },
];

export const homeFaqItems = [
  {
    question: 'Axelys est-il un simple simulateur immobilier ?',
    answer:
      'Non. Le produit aide à arbitrer avant achat puis à piloter après acquisition. Le calcul n’est qu’un moyen au service d’une décision.',
  },
  {
    question: 'Le simulateur est-il public ?',
    answer:
      'Non. Le site marketing reste éditorial. Le simulateur détaillé, les comparaisons privées et la conversion vers projet restent dans l’application.',
  },
  {
    question: 'Que peut-on activer aujourd’hui ?',
    answer:
      'Le programme client pilote. Les offres Simple et Pro sont visibles pour préparer la suite, mais elles ne sont pas ouvertes à la vente.',
  },
  {
    question: 'À qui sert Axelys maintenant ?',
    answer:
      'Aux investisseurs immobiliers actifs, marchands de biens et petites structures multi-projets qui veulent une lecture plus fiable de leurs décisions et de leurs opérations.',
  },
];

export const clientPilotSignals = [
  'Réponse humaine sous 24 à 48 h ouvrées',
  'Souscription seulement après validation du profil',
  'Tarif pilote à 15 € / mois',
];

export const clientPilotSteps = [
  {
    title: '1. Candidater',
    body: 'Vous décrivez votre contexte, votre profil et le type de projets que vous pilotez déjà.',
  },
  {
    title: '2. Vérifier l’adéquation',
    body: 'On regarde si Axelys peut être utile tout de suite et si le cadre pilote correspond à votre usage.',
  },
  {
    title: '3. Ouvrir progressivement',
    body: 'Si le profil est retenu, la suite se fait dans un cadre sécurisé, avec une souscription déclenchée au bon moment.',
  },
];

export const clientPilotFaq = [
  {
    question: 'Le tarif pilote est-il public ?',
    answer:
      'Oui, il est affiché clairement à 15 € / mois. En revanche, l’accès reste sélectif et n’est pas accordé automatiquement.',
  },
  {
    question: 'Simple et Pro sont-ils disponibles ?',
    answer:
      'Non. Ils sont visibles pour donner une lecture de la trajectoire commerciale, mais ils restent volontairement non activables.',
  },
  {
    question: 'Le site public donne-t-il accès aux calculs ?',
    answer:
      'Non. Le site explique les cas d’usage et la valeur. Les calculs détaillés et la logique de conversion restent dans l’application privée.',
  },
];
