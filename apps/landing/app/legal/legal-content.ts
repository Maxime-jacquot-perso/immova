import {
  getLegalDocumentDefinition,
  type LegalDocumentType,
} from '../../../../packages/legal/src';
import {
  legalContactEmail,
  publisherName,
  siteName,
} from '../site-config';

type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type LegalPageContent = {
  eyebrow: string;
  intro: string;
  sections: LegalSection[];
};

const hostPlaceholder =
  '[À compléter : hébergeur de production effectif, adresse et contact]';
const publicationDirectorPlaceholder =
  '[À compléter : directeur de la publication]';
const mailProviderPlaceholder =
  '[À compléter : prestataire email transactionnel effectivement utilisé en production]';

export const legalPageContentByType: Record<
  LegalDocumentType,
  LegalPageContent
> = {
  MENTIONS_LEGALES: {
    eyebrow: 'Identification',
    intro: `${siteName} est une marque et une solution logicielle éditée par ${publisherName}. La présente page identifie l’éditeur, encadre l’accès au site et rappelle les principales limites de responsabilité applicables aux espaces publics du service.`,
    sections: [
      {
        title: 'Éditeur du site et de la solution',
        paragraphs: [
          `${publisherName}, SARL au capital social [À compléter si nécessaire], immatriculée au RCS sous le numéro SIREN 934 276 528, dont le siège social est situé 9 rue du Stade, 68180 Horbourg-Wihr, France.`,
          `${siteName} est exploité comme marque, nom commercial et solution SaaS édités par ${publisherName}. ${siteName} n’est pas une société distincte.`,
        ],
        bullets: [
          'SIRET siège : 934 276 528 00015',
          'TVA intracommunautaire : FR46 934 276 528',
          `Email de contact : ${legalContactEmail}`,
          `Directeur de la publication : ${publicationDirectorPlaceholder}`,
        ],
      },
      {
        title: 'Hébergement',
        paragraphs: [
          `L’infrastructure d’hébergement et d’exécution du site public et de l’application doit être renseignée dans le dossier contractuel d’exploitation. À ce jour, la mention de référence à publier est la suivante : ${hostPlaceholder}.`,
        ],
      },
      {
        title: 'Accès au site et au service',
        paragraphs: [
          'Le site public et les espaces applicatifs sont accessibles en ligne, sous réserve des opérations de maintenance, de sécurité, d’évolution ou d’indisponibilité des réseaux.',
          `${publisherName} s’efforce d’assurer un accès fiable au service, sans promettre une disponibilité continue ou exempte d’erreur.`,
        ],
      },
      {
        title: 'Propriété intellectuelle',
        paragraphs: [
          `Les contenus, textes, éléments graphiques, marques, logos, bases, interfaces, composants logiciels et plus généralement l’ensemble des éléments composant ${siteName} sont protégés par le droit de la propriété intellectuelle.`,
          `Sauf autorisation écrite préalable de ${publisherName}, toute reproduction, représentation, adaptation, extraction substantielle ou exploitation non autorisée est interdite.`,
        ],
      },
      {
        title: 'Responsabilité',
        paragraphs: [
          `${publisherName} met à disposition des contenus et un service logiciel destinés à accompagner la gestion et la décision immobilières. Les informations publiées sur le site public restent générales et ne constituent pas un conseil juridique, fiscal, comptable, bancaire, notarial ou d’investissement.`,
          `L’utilisateur demeure responsable de ses vérifications, de l’usage qu’il fait des informations accessibles et des décisions prises à partir des éléments fournis.`,
        ],
      },
      {
        title: 'Contact',
        paragraphs: [
          `Pour toute question relative au site, au service ou aux présentes mentions, vous pouvez écrire à ${legalContactEmail}.`,
        ],
      },
    ],
  },
  CGU: {
    eyebrow: 'Usage de la plateforme',
    intro: `Les présentes Conditions Générales d’Utilisation encadrent l’accès et l’usage de la plateforme ${siteName}, éditée par ${publisherName}, par les utilisateurs autorisés.`,
    sections: [
      {
        title: 'Objet',
        paragraphs: [
          `${siteName} est un logiciel SaaS de décision et de pilotage d’opérations immobilières. Il permet notamment d’analyser des opportunités avant achat, puis de suivre des projets, lots, dépenses, documents et indicateurs après acquisition.`,
          'Les CGU ont pour objet de définir les conditions d’accès au service, les responsabilités de chacun et les règles d’usage applicables aux comptes utilisateurs.',
        ],
      },
      {
        title: 'Accès au service et comptes',
        paragraphs: [
          'L’accès à la plateforme suppose la création ou l’activation d’un compte utilisateur autorisé par le Client ou par REGERA.',
          'Chaque utilisateur s’engage à fournir des informations exactes, à maintenir leur mise à jour et à préserver la confidentialité de ses identifiants. Toute utilisation réalisée depuis un compte est réputée effectuée sous la responsabilité de son titulaire, sauf preuve d’un usage frauduleux non imputable audit titulaire.',
        ],
        bullets: [
          'ne pas partager ses accès avec des tiers non autorisés',
          'mettre en œuvre des mots de passe robustes',
          'alerter sans délai REGERA en cas de suspicion d’accès non autorisé',
        ],
      },
      {
        title: 'Finalité de l’outil et limites',
        paragraphs: [
          `${siteName} fournit des outils d’aide à la décision, de centralisation et de pilotage. Il ne remplace pas un conseil juridique, fiscal, comptable, bancaire, notarial ou technique adapté à chaque opération.`,
          'Les calculs, simulations, statuts et recommandations affichés doivent être compris comme des aides opérationnelles. L’utilisateur reste seul responsable de la validation finale des hypothèses, des données saisies, des pièces justificatives et des décisions prises.',
        ],
      },
      {
        title: 'Données saisies et responsabilité utilisateur',
        paragraphs: [
          'L’utilisateur est responsable du caractère licite, exact, complet et à jour des informations, documents et données introduits dans la plateforme.',
          `L’utilisateur s’interdit d’utiliser ${siteName} pour stocker ou diffuser des contenus illicites, trompeurs, diffamatoires, frauduleux ou portant atteinte aux droits de tiers.`,
        ],
      },
      {
        title: 'Usage autorisé et usages interdits',
        bullets: [
          'utiliser la plateforme conformément à sa destination professionnelle',
          'ne pas tenter d’extraire massivement les données, contourner les mesures de sécurité ou perturber le service',
          'ne pas détourner la plateforme pour fournir un service concurrent ou revendre un accès non autorisé',
          'ne pas introduire de code malveillant, de robot d’abus ou de mécanisme de surcharge volontaire',
        ],
      },
      {
        title: 'Disponibilité, maintenance et évolution',
        paragraphs: [
          `${publisherName} peut faire évoluer le service, corriger des anomalies, ajouter, modifier ou retirer certaines fonctionnalités, notamment dans le cadre du programme pilote ou des versions bêta.`,
          'Des interruptions temporaires peuvent intervenir pour maintenance, sécurité, migration ou amélioration. REGERA s’efforce de limiter l’impact de ces opérations sans garantir une disponibilité absolue.',
        ],
      },
      {
        title: 'Suspension et résiliation d’accès',
        paragraphs: [
          `${publisherName} peut suspendre ou restreindre l’accès d’un utilisateur en cas de non-respect des CGU, d’impayé affectant le compte client, d’usage abusif, de risque de sécurité, de réquisition légale ou de besoin de protection du service et des autres utilisateurs.`,
          'Sauf urgence, la suspension est accompagnée d’une information raisonnable permettant au Client ou à l’utilisateur concerné de comprendre le motif et, le cas échéant, de remédier à la situation.',
        ],
      },
      {
        title: 'Propriété intellectuelle',
        paragraphs: [
          `${siteName}, ses interfaces, ses composants, ses contenus de présentation et ses développements restent la propriété exclusive de ${publisherName} ou de ses concédants.`,
          'Les CGU n’emportent aucune cession de droit de propriété intellectuelle au profit des utilisateurs ou des Clients.',
        ],
      },
      {
        title: 'Responsabilité',
        paragraphs: [
          `${publisherName} est tenue d’une obligation de moyens dans la fourniture du service.`,
          `Sous réserve des dispositions impératives applicables, ${publisherName} ne saurait être responsable des pertes résultant d’une mauvaise saisie, d’une absence de mise à jour, d’un usage non conforme, d’une décision d’investissement, d’une négociation, d’un financement, d’un arbitrage juridique ou fiscal, ou plus généralement d’une décision prise sans vérification externe adaptée.`,
          'En tout état de cause, la responsabilité de REGERA est limitée aux dommages directs prouvés causés par un manquement contractuel établi, à l’exclusion des pertes indirectes telles que perte de chance, perte d’exploitation, perte de données non imputable à REGERA ou atteinte à l’image.',
        ],
      },
      {
        title: 'Modification des CGU',
        paragraphs: [
          `${publisherName} peut modifier les présentes CGU pour tenir compte des évolutions du service, de son cadre réglementaire ou de son modèle d’exploitation. La version en vigueur est celle publiée sur le site aux dates indiquées.`,
        ],
      },
      {
        title: 'Droit applicable et contact',
        paragraphs: [
          'Les CGU sont soumises au droit français. Sauf règle impérative contraire, tout différend relatif à leur interprétation ou exécution relève des juridictions compétentes du ressort de la Cour d’appel de Colmar après tentative de résolution amiable.',
          `Pour toute question, écrivez à ${legalContactEmail}.`,
        ],
      },
    ],
  },
  CGV: {
    eyebrow: 'Souscription et paiement',
    intro: `Les présentes Conditions Générales de Vente régissent la fourniture des offres payantes ${siteName} par ${publisherName}. Elles distinguent les accès standards et, le cas échéant, les offres pilotes ou bêta proposées à titre préférentiel.`,
    sections: [
      {
        title: 'Parties et périmètre',
        paragraphs: [
          `Le contrat est conclu entre ${publisherName}, société éditrice de ${siteName}, et le Client qui souscrit un abonnement au service pour ses besoins propres ou pour le compte de l’organisation qu’il représente.`,
          `${siteName} vise prioritairement une clientèle professionnelle composée d’investisseurs immobiliers, de marchands de biens et de petites structures multi-projets. Toute souscription réalisée pour un usage non professionnel devra faire l’objet d’une vérification juridique complémentaire avant un déploiement grand public.`,
        ],
      },
      {
        title: 'Offres, essai et offre pilote',
        paragraphs: [
          'Les formules disponibles, leurs fonctionnalités principales et leurs conditions tarifaires sont présentées dans le parcours de souscription, dans l’application ou sur devis selon le contexte commercial.',
          'Une offre pilote ou bêta peut être proposée à un tarif préférentiel. Cette offre permet l’accès à un produit en cours de consolidation, susceptible d’évoluer plus rapidement, de comporter certaines limites fonctionnelles ou de faire l’objet d’ajustements de parcours et de priorités.',
          'L’existence d’une offre pilote ne prive pas le Client de la protection légale applicable ni des engagements raisonnables de qualité et de sécurité assumés par REGERA.',
        ],
      },
      {
        title: 'Prix',
        paragraphs: [
          'Les prix applicables sont ceux affichés ou communiqués au Client avant validation de la souscription.',
          'Sauf mention contraire explicite, les prix sont exprimés en euros et s’entendent hors taxes pour la clientèle professionnelle. Les taxes applicables sont ajoutées selon la réglementation en vigueur et selon la situation du Client.',
        ],
      },
      {
        title: 'Commande et prise d’effet',
        paragraphs: [
          'La souscription est formée lorsque le Client valide son parcours de paiement et que le prestataire de paiement confirme la création ou l’activation de l’abonnement.',
          'Aucun accès payant ne repose sur la seule redirection du navigateur en fin de paiement : l’activation dépend de la confirmation reçue depuis le prestataire de paiement et traitée par REGERA.',
        ],
      },
      {
        title: 'Paiement et facturation',
        paragraphs: [
          'Le paiement des abonnements est opéré via Stripe ou tout autre prestataire équivalent indiqué lors du parcours de paiement.',
          'Le Client autorise la facturation récurrente selon la périodicité indiquée lors de la souscription. Sauf mention contraire, les abonnements sont mensuels à tacite reconduction.',
        ],
      },
      {
        title: 'Renouvellement, résiliation et fin de contrat',
        paragraphs: [
          'Le Client peut mettre fin à l’abonnement depuis l’espace de gestion dédié mis à disposition ou en contactant REGERA dans un délai raisonnable avant la prochaine échéance.',
          'La résiliation prend effet pour la période suivante et n’emporte pas remboursement prorata temporis de la période déjà commencée, sauf disposition impérative contraire ou geste commercial expressément accordé par REGERA.',
        ],
      },
      {
        title: 'Impayés et suspension',
        paragraphs: [
          'En cas d’échec de paiement, de rejet, d’incident bancaire ou de statut d’impayé confirmé par le prestataire de paiement, REGERA peut suspendre ou limiter l’accès au service jusqu’à régularisation.',
          'Lorsque cela est raisonnablement possible, le Client est informé de la situation afin de lui permettre de régulariser son abonnement.',
        ],
      },
      {
        title: 'Remboursements',
        paragraphs: [
          'Sauf disposition impérative contraire, les sommes perçues pour une période d’abonnement commencée ne sont pas remboursables.',
          'Un remboursement partiel ou total peut toutefois être accordé au cas par cas en présence d’un double paiement, d’une erreur manifeste imputable à REGERA ou d’une situation commerciale particulière expressément validée.',
        ],
      },
      {
        title: 'Rétractation',
        paragraphs: [
          'Le service étant prioritairement destiné à une clientèle professionnelle, le droit de rétractation prévu par le Code de la consommation n’a pas vocation à s’appliquer dans la majorité des cas.',
          'Si REGERA ouvre ultérieurement la souscription à des consommateurs, un parcours spécifique devra encadrer les droits impératifs applicables, y compris, le cas échéant, le délai de quatorze jours et la renonciation expresse à ce droit lorsque l’exécution du service commence immédiatement.',
        ],
      },
      {
        title: 'Responsabilité et garantie',
        paragraphs: [
          `${siteName} est un outil logiciel d’aide à la décision et de pilotage. REGERA n’accorde aucune garantie de résultat économique, d’obtention de financement, de rentabilité, de conformité fiscale ou de succès d’une opération immobilière.`,
          `La responsabilité de ${publisherName} demeure limitée aux dommages directs prouvés résultant d’un manquement contractuel établi, à l’exclusion des pertes indirectes et sous réserve des règles impératives applicables.`,
        ],
      },
      {
        title: 'Droit applicable et litiges',
        paragraphs: [
          'Les CGV sont soumises au droit français. Sauf règle impérative contraire, les litiges relèvent des juridictions compétentes du ressort de la Cour d’appel de Colmar après tentative de résolution amiable.',
          `Pour toute question relative à la souscription ou à la facturation, contactez ${legalContactEmail}.`,
        ],
      },
    ],
  },
  PRIVACY_POLICY: {
    eyebrow: 'Données personnelles',
    intro: `${publisherName}, en qualité de responsable de traitement pour ${siteName}, explique ci-dessous quelles données personnelles sont collectées, pour quelles finalités, sur quelles bases légales et avec quelles garanties.`,
    sections: [
      {
        title: 'Catégories de données concernées',
        bullets: [
          'données d’identification et de contact des utilisateurs, prospects et candidats au programme pilote',
          'données de compte : email, nom, prénom, rôles, dates de connexion, historique d’acceptation des documents légaux',
          'données d’organisation et de facturation : structure cliente, plan, statut d’abonnement, références Stripe',
          'données opérationnelles saisies dans la plateforme : projets, lots, dépenses, documents et hypothèses de simulation',
          'données techniques et de sécurité : journaux, adresses IP, user agents, horodatages et traces d’audit',
          'données de mesure d’audience de la landing, uniquement après consentement pour les traceurs non essentiels',
        ],
      },
      {
        title: 'Finalités et bases légales',
        bullets: [
          'création et gestion des comptes, exécution du contrat et gestion des accès : exécution contractuelle',
          'gestion des abonnements, paiements, facturation et prévention des impayés : exécution contractuelle et obligations légales',
          'sécurisation du service, journalisation, prévention des abus et défense des droits : intérêt légitime',
          'réponse aux candidatures au programme pilote et aux demandes entrantes : mesures précontractuelles et intérêt légitime',
          'mesure d’audience et amélioration de la landing via PostHog ou outils équivalents : consentement',
          'conservation des preuves contractuelles et comptables : obligations légales',
        ],
      },
      {
        title: 'Destinataires et sous-traitants',
        paragraphs: [
          'Les données sont accessibles, dans la limite du besoin d’en connaître, aux équipes habilitées de REGERA, aux administrateurs autorisés du Client et aux sous-traitants techniques mobilisés pour l’hébergement, la messagerie, la facturation, le stockage, la supervision et la sécurité.',
        ],
        bullets: [
          'Paiement et portail de facturation : Stripe',
          'Mesure d’audience et analytics de la landing, après consentement : PostHog et Vercel Speed Insights',
          `Email transactionnel : ${mailProviderPlaceholder}`,
          `Hébergement et infrastructure applicative : ${hostPlaceholder}`,
        ],
      },
      {
        title: 'Durées de conservation',
        bullets: [
          'comptes utilisateurs et données contractuelles : pendant la relation contractuelle puis jusqu’à 5 ans à compter de sa fin pour les besoins probatoires',
          'données de facturation et pièces comptables : 10 ans lorsque la réglementation l’impose',
          'journaux de sécurité et traces techniques : en principe 12 mois, sauf nécessité probatoire plus longue',
          'demandes d’accès client pilote non transformées : jusqu’à 24 mois après le dernier contact utile',
          'preuve d’acceptation des documents légaux : pendant la durée de la relation puis jusqu’à 5 ans après sa fin',
          'consentement cookies et analytics : 6 mois à compter du choix, sauf retrait anticipé',
        ],
      },
      {
        title: 'Transferts hors Union européenne',
        paragraphs: [
          'Certains prestataires techniques peuvent traiter ou rendre accessibles des données en dehors de l’Union européenne. Le cas échéant, REGERA s’engage à mettre en place les garanties appropriées requises par la réglementation applicable, notamment des clauses contractuelles adéquates ou des mécanismes équivalents.',
        ],
      },
      {
        title: 'Sécurité',
        paragraphs: [
          `${publisherName} met en œuvre des mesures techniques et organisationnelles raisonnables pour protéger les données personnelles contre les accès non autorisés, la perte, l’altération ou la divulgation.`,
          'Ces mesures incluent notamment le cloisonnement logique des organisations, l’authentification des accès, la journalisation, la limitation des privilèges et l’usage de prestataires spécialisés pour certaines fonctions sensibles comme la facturation.',
        ],
      },
      {
        title: 'Droits des personnes',
        paragraphs: [
          'Conformément au RGPD et à la loi Informatique et Libertés, les personnes concernées disposent, selon les cas, d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition, de portabilité et de retrait du consentement pour les traitements fondés sur ce consentement.',
          `Les demandes peuvent être adressées à ${legalContactEmail}. En cas de difficulté persistante, la personne concernée peut saisir la CNIL.`,
        ],
      },
      {
        title: 'Cookies et traceurs',
        paragraphs: [
          'Le site public utilise des traceurs strictement nécessaires à son fonctionnement, ainsi que, sous réserve du consentement préalable de l’utilisateur, des outils de mesure d’audience et de performance.',
          'Aucun déclenchement des scripts non essentiels de mesure d’audience n’est effectué avant votre choix explicite sur la bannière prévue à cet effet.',
        ],
      },
      {
        title: 'Contact',
        paragraphs: [
          `Pour toute question relative à la protection des données, écrivez à ${legalContactEmail}. Si un délégué à la protection des données est désigné ultérieurement, ses coordonnées seront publiées ici.`,
        ],
      },
    ],
  },
};

export function getLegalPageContent(type: LegalDocumentType) {
  return legalPageContentByType[type];
}

export function getLegalPageVersionLabel(type: LegalDocumentType) {
  return getLegalDocumentDefinition(type).version;
}
