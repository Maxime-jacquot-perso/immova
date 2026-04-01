import type { Metadata } from 'next';
import {
  defaultDescription,
  seoKeywords,
  siteName,
  siteUrl,
} from './site-config';
import Image from 'next/image';

export const metadata: Metadata = {
  title:
    'Outil de pilotage projet immobilier pour prendre des décisions fiables',
  description: defaultDescription,
  keywords: seoKeywords,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title:
      'Axelys - Prenez des décisions fiables sur vos projets immobiliers',
    description: defaultDescription,
    url: '/',
  },
  twitter: {
    title:
      'Axelys - Prenez des décisions fiables sur vos projets immobiliers',
    description: defaultDescription,
  },
};

const problemCards = [
  {
    title: 'Vous ne savez jamais où en est vraiment le budget',
    body: 'Les dépenses vivent dans 3 fichiers. Vous devez reconstruire les chiffres avant chaque réunion. Vous présentez des montants approximatifs en comité d\'investissement.',
  },
  {
    title: 'Les justificatifs sont introuvables quand il faut les montrer',
    body: 'Vous perdez 20 minutes à retrouver UNE facture. Vous signez des avenants sans retrouver le devis initial. Vous envoyez des &ldquo;je te renvoie ça plus tard&rdquo; à votre comptable.',
  },
  {
    title: 'Vous découvrez les problèmes trop tard',
    body: "Pas d'alerte quand un poste explose. Vous réalisez que les travaux ont dérapé de 20% en clôture de projet. Impossible de corriger.",
  },
  {
    title: 'Vous arbitrez sur du ressenti, pas sur des faits',
    body: '&ldquo;Je pense qu\'on est à 80% du budget travaux...&rdquo; → Vous ne pensez pas. Vous devriez savoir.',
  },
];

const beforeAfterRows = [
  {
    before: 'Données dispersées dans 5 fichiers',
    after: 'Tout centralisé par projet',
  },
  {
    before: '&ldquo;Je pense que le budget est bon...&rdquo;',
    after: 'Statut décisionnel clair : OK / À surveiller / Problématique',
  },
  {
    before: 'Vous découvrez les problèmes en clôture',
    after: 'Alertes quand quelque chose dérape',
  },
  {
    before: '30 min pour reconstruire un projet avant une réunion',
    after: '2 min pour avoir une vision complète',
  },
  {
    before: 'Justificatifs introuvables',
    after: 'Chaque facture liée à la bonne dépense',
  },
  {
    before: 'KPI Excel que personne ne comprend',
    after: 'KPI calculés sur vos données réelles',
  },
];

const solutionCards = [
  {
    title: 'Statut décisionnel projet',
    body: 'Chaque projet affiche : OK / À surveiller / Problématique. Basé sur les données réelles (complétude, alertes, dérapages). Vous savez immédiatement où regarder.',
  },
  {
    title: 'Alertes métier qui vous préviennent',
    body: 'Budget travaux dépassé de 15% → alerte critique. 3 justificatifs manquants → warning. Loyers estimés non renseignés → info. Vous corrigez avant que ça devienne critique.',
  },
  {
    title: 'KPI fiables, pas inventés',
    body: 'Coût d\'acquisition, dépenses totales, loyers estimés. Calculés automatiquement sur VOS données. Explicables en 30 secondes à n\'importe qui.',
  },
  {
    title: 'Dépenses et justificatifs liés',
    body: 'Chaque facture rattachée au bon projet. Document joint directement. Export CSV propre pour le comptable.',
  },
  {
    title: 'Vision projet complète',
    body: 'Vous voyez tout : lots, dépenses, documents, KPI. En un seul endroit. Sans reconstruire le dossier.',
  },
];

const decisionCards = [
  {
    question: 'Dois-je lancer les travaux maintenant ?',
    answer:
      'Vous voyez combien vous avez déjà engagé, ce qui reste, et si le projet est dans les clous. Vous décidez. Pas d\'approximation.',
  },
  {
    question: 'Ce projet est-il encore rentable ?',
    answer:
      'Rentabilité brute calculée automatiquement sur vos données réelles. Pas de formule cachée.',
  },
  {
    question: 'Qu\'est-ce qui bloque ?',
    answer:
      'Les alertes vous disent exactement quoi corriger : &ldquo;budget travaux dépassé de 12%&rdquo;, &ldquo;3 justificatifs manquants&rdquo;. Vous agissez.',
  },
  {
    question: 'Quel projet surveiller en priorité ?',
    answer:
      'Le dashboard vous montre les projets problématiques en premier. Vous ne perdez plus de temps sur ceux qui roulent.',
  },
];

const proofCards = [
  {
    title: 'Logique produit claire',
    body: 'Le produit fait ce qu\'il dit : projets, lots, dépenses, documents, KPI, alertes. Pas de sur-promesse. Chaque écran sert à prendre une décision.',
  },
  {
    title: 'Architecture solide',
    body: 'Stack sérieux : NestJS + PostgreSQL + React. Tests automatisés, déploiement sécurisé. Données multi-tenant, chiffrées, RGPD-compliant.',
  },
  {
    title: 'Engagement long terme',
    body: 'Pas un side-project qui va disparaître dans 6 mois. Roadmap claire : scoring projet avancé, intégration comptable, app mobile. Hébergement Europe (Vercel + PostgreSQL).',
  },
];

const faqItems = [
  {
    question: 'Le produit est-il fini ?',
    answer:
      "Non. Il fonctionne, mais il évolue. Des fonctionnalités vont s&apos;améliorer, d'autres vont être ajoutées. Si vous voulez un produit figé, ce n&apos;est pas pour vous.",
  },
  {
    question: 'Pourquoi payer un produit en beta ?',
    answer:
      "Parce qu&apos;il résout déjà le problème mieux que votre stack actuelle. Et parce que le tarif client pilote (15 EUR au lieu de 29 EUR) compense largement.",
  },
  {
    question: 'Que se passe-t-il après la phase pilote ?',
    answer:
      'Votre tarif reste à 15 EUR/mois à vie. Le prix public passe à 29 EUR (offre Pro), mais pas pour vous.',
  },
  {
    question: 'Puis-je quitter facilement ?',
    answer:
      'Oui. Sans engagement, résiliable à tout moment. Si ça ne vous convient plus, vous partez.',
  },
  {
    question: 'Combien de temps dure la phase pilote ?',
    answer: '3 à 6 mois. Le temps de stabiliser avec vos retours.',
  },
  {
    question: "Et si j&apos;ai un bug bloquant ?",
    answer:
      'Support prioritaire sous 24h. On corrige en priorité les bugs des clients pilotes.',
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer:
      'Oui. Hébergement Europe, données chiffrées, sauvegardes quotidiennes, RGPD-compliant.',
  },
  {
    question: 'Puis-je importer mes données Excel ?',
    answer:
      "Pas encore automatiquement. C'est sur la roadmap. Pour l'instant, vous ressaisissez.",
  },
  {
    question: 'Combien de projets puis-je gérer ?',
    answer: 'Illimité. 2 ou 20 projets, même tarif.',
  },
  {
    question: 'Puis-je inviter mon comptable/associé ?',
    answer:
      "Oui, jusqu'à 5 membres avec rôles (admin, manager, comptable, lecteur).",
  },
  {
    question:
      "Qu'est-ce qui différencie Axelys des autres outils immobiliers ?",
    answer:
      "Axelys ne fait PAS de gestion locative. Pas de comptabilité générale. Pas d'ERP complet. Juste du pilotage d&apos;opérations : projets, lots, dépenses, documents, KPI fiables, statut décisionnel. Si vous cherchez un outil qui fait tout, ce n&apos;est pas ici.",
  },
  {
    question: 'Pourquoi seulement 15 places ?',
    answer:
      'Parce qu\'on veut échanger vraiment avec chaque client pilote, pas gérer 100 comptes passifs. Qualité > Quantité.',
  },
];

const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: siteName,
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Logiciel de pilotage projet immobilier',
  operatingSystem: 'Web',
  url: siteUrl,
  inLanguage: 'fr-FR',
  description: defaultDescription,
  audience: {
    '@type': 'Audience',
    audienceType:
      'Investisseurs immobiliers, marchands de biens, petites structures multi-projets',
  },
  offers: {
    '@type': 'Offer',
    name: 'Client Pilote',
    price: '15',
    priceCurrency: 'EUR',
  },
};

const faqPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

export default function Home() {
  return (
    <div className="landing-shell">
      <div className="landing-orb landing-orb--left" />
      <div className="landing-orb landing-orb--right" />

      <header className="site-header">
        <a className="site-brand" href="#top">
          <Image src="/logo-text-bleu.svg" alt={siteName} width={250} height={50} />
        </a>

        <nav className="site-nav" aria-label="Navigation principale">
          <a href="#solution">Solution</a>
          <a href="#pilot">Programme pilote</a>
          <a href="#pricing">Tarif</a>
          <a href="#faq">FAQ</a>
        </nav>

        <a className="button" href="/apply">
          Demander un accès
        </a>
      </header>

      <main>
        <section className="hero" id="top">
          <div className="hero__copy">
            <div className="eyebrow">Outil de pilotage d&apos;opérations immobilières</div>
            <h1>
              Prenez des décisions fiables sur vos projets immobiliers.
              Le jour où vous devez arbitrer — pas après.
            </h1>
            <p className="hero__body">
              {siteName} vous dit si un projet est sain, à surveiller ou
              problématique. Avec des KPI calculés sur vos données réelles.
              Avec des alertes quand quelque chose dérape. Avec un statut
              décisionnel clair avant chaque arbitrage.
            </p>
            <p className="hero__body">
              Si vous pilotez 2 à 10 projets en parallèle et que vous en avez
              marre de reconstruire le dossier avant chaque comité, ce produit
              existe pour ça.
            </p>

            <div className="hero__actions">
              <a className="button" href="/apply">
                Demander un accès client pilote (15 places max)
              </a>
              <a className="button button--secondary" href="#workspace">
                Voir le produit
              </a>
            </div>
          </div>

          <div className="hero__preview" aria-hidden="true" id="workspace">
            <div className="app-preview">
              <aside className="app-preview__sidebar">
                <div className="app-preview__brand">{siteName}</div>
                <div className="app-preview__meta">Suivi opération immobilière</div>
                <div className="app-preview__nav">
                  <div className="app-preview__nav-item app-preview__nav-item--active">
                    Projets
                  </div>
                  <div className="app-preview__nav-item">Lots</div>
                  <div className="app-preview__nav-item">Dépenses</div>
                  <div className="app-preview__nav-item">Documents</div>
                </div>
              </aside>

              <div className="app-preview__content">
                <div className="app-preview__topline">
                  <div>
                    <strong>Projet rue de Lille</strong>
                    <div className="app-preview__meta">
                      Acquisition · Travaux · 4 lots · Export CSV
                    </div>
                  </div>
                  <span className="mini-badge mini-badge--ok">OK</span>
                </div>

                <div className="preview-kpis">
                  <div className="preview-kpi">
                    <span>Coût acquisition</span>
                    <strong>218 000 EUR</strong>
                  </div>
                  <div className="preview-kpi">
                    <span>Dépenses totales</span>
                    <strong>31 400 EUR</strong>
                  </div>
                  <div className="preview-kpi">
                    <span>Loyer estimé</span>
                    <strong>3 250 EUR</strong>
                  </div>
                </div>

                <div className="preview-panels">
                  <div className="preview-panel">
                    <h2>Alertes</h2>
                    <ul>
                      <li>
                        <span className="preview-alert preview-alert--warning">
                          Warning
                        </span>
                        <span>3 justificatifs manquants</span>
                      </li>
                      <li>
                        <span className="preview-alert preview-alert--info">
                          Info
                        </span>
                        <span>Loyers estimés à vérifier</span>
                      </li>
                    </ul>
                  </div>

                  <div className="preview-panel">
                    <h2>Suggestions</h2>
                    <ul>
                      <li>Ajouter facture électricité lot 2</li>
                      <li>Vérifier loyers marché actuel</li>
                      <li>Compléter surfaces lots 3 et 4</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="problem">
          <div className="section-heading">
            <div className="eyebrow">Le vrai problème</div>
            <h2>Vous perdez de l&apos;argent parce que vous décidez trop tard</h2>
            <p>
              Le problème n&apos;est pas votre rigueur. C&apos;est que vos données sont
              dispersées et que vous découvrez les dérapages quand il est trop
              tard pour corriger.
            </p>
          </div>

          <div className="problem-grid">
            {problemCards.map((card) => (
              <article className="problem-card" key={card.title}>
                <h3>{card.title}</h3>
                <p dangerouslySetInnerHTML={{ __html: card.body }} />
              </article>
            ))}
          </div>

          <div className="problem-conclusion">
            <p>
              Ce n&apos;est pas Excel le problème. C&apos;est le fait que vos données ne
              sont jamais au même endroit au bon moment.
            </p>
          </div>
        </section>

        <section className="section section--contrast" id="before-after">
          <div className="section-heading">
            <div className="eyebrow">Avant / Avec {siteName}</div>
            <h2>La différence entre subir et piloter</h2>
          </div>

          <div className="comparison-panel">
            <div className="comparison-column">
              <div className="comparison-column__title">Avant {siteName}</div>
              <ul>
                {beforeAfterRows.map((row) => (
                  <li key={row.before} dangerouslySetInnerHTML={{ __html: row.before }} />
                ))}
              </ul>
            </div>

            <div className="comparison-column comparison-column--accent">
              <div className="comparison-column__title">Avec {siteName}</div>
              <ul>
                {beforeAfterRows.map((row) => (
                  <li key={row.after}>{row.after}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="section" id="solution">
          <div className="section-heading">
            <div className="eyebrow">Ce que fait {siteName}</div>
            <h2>Vous donner les faits pour décider</h2>
            <p>
              {siteName} ne fait pas tout. Il fait exactement ce dont vous avez
              besoin pour garder le contrôle.
            </p>
          </div>

          <div className="solution-grid">
            {solutionCards.map((card) => (
              <article className="feature-card" key={card.title}>
                <h3>{card.title}</h3>
                <p dangerouslySetInnerHTML={{ __html: card.body }} />
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="decisions">
          <div className="section-heading">
            <div className="eyebrow">Comment ça aide à décider</div>
            <h2>
              Les questions auxquelles vous répondez en 2 minutes au lieu de 30
            </h2>
          </div>

          <div className="decision-grid">
            {decisionCards.map((card) => (
              <article className="decision-card" key={card.question}>
                <h3>{card.question}</h3>
                <p dangerouslySetInnerHTML={{ __html: card.answer }} />
              </article>
            ))}
          </div>

          <div className="decision-callout">
            <p>Vous pilotez. Vous ne subissez plus.</p>
          </div>
        </section>

        <section className="section section--dark" id="pilot">
          <div className="section-heading">
            <div className="eyebrow">Programme client pilote</div>
            <h2>Pourquoi on limite à 15 clients pilotes</h2>
            <p>
              {siteName} fonctionne. Le produit existe, il résout le problème.{' '}
              <strong>Mais on ne veut pas 100 utilisateurs passifs.</strong>
            </p>
            <p>
              On préfère 15 clients qui utilisent vraiment le produit, qui
              donnent du feedback, et qui construisent l&apos;outil avec nous.
            </p>
          </div>

          <div className="pilot-deal">
            <div className="pilot-deal__column">
              <h3>Ce que vous obtenez</h3>
              <ul>
                <li>Accès immédiat (pas de liste d&apos;attente)</li>
                <li>
                  <strong>15 EUR/mois à vie</strong> (50% de réduction sur l&apos;offre Pro à 29 EUR/mois)
                </li>
                <li>Influence directe sur la roadmap</li>
                <li>Accès anticipé aux nouvelles fonctionnalités</li>
                <li>Support prioritaire (réponse &lt; 24h)</li>
              </ul>
            </div>

            <div className="pilot-deal__column">
              <h3>Ce que vous devez accepter</h3>
              <ul>
                <li>Le produit n&apos;est pas parfait (bugs possibles)</li>
                <li>Donner du feedback régulier</li>
                <li>Utiliser le produit sur de vrais projets</li>
                <li>Être constructif (pas juste se plaindre)</li>
              </ul>
            </div>
          </div>

          <div className="pilot-filters">
            <div className="pilot-filter pilot-filter--good">
              <h3>C&apos;est pour vous si :</h3>
              <ul>
                <li>Vous gérez 2 à 10 projets immobiliers actifs</li>
                <li>
                  Vous en avez marre de reconstruire le dossier avant chaque
                  réunion
                </li>
                <li>
                  Vous êtes prêt à utiliser un produit imparfait qui avance vite
                </li>
                <li>
                  Vous voulez vraiment résoudre le problème (pas juste &ldquo;voir&rdquo;)
                </li>
              </ul>
            </div>

            <div className="pilot-filter pilot-filter--bad">
              <h3>Ce n&apos;est PAS pour vous si :</h3>
              <ul>
                <li>Vous voulez un produit 100% fini sans bug</li>
                <li>Vous ne voulez pas donner de feedback</li>
                <li>Vous aimez votre stack Excel actuelle</li>
                <li>Vous cherchez juste à tester sans utiliser réellement</li>
                <li>Vous comparez 12 solutions pendant 6 mois avant de décider</li>
                <li>
                  Vous n&apos;êtes pas prêt à payer pour un produit en évolution
                </li>
              </ul>
            </div>
          </div>

          <div className="pilot-why">
            <h3>Pourquoi on limite volontairement ?</h3>
            <div className="pilot-why-grid">
              <div>
                <strong>1. Support personnalisé</strong>
                <p>
                  On ne peut pas gérer 100 clients en parallèle avec un support
                  prioritaire.
                </p>
              </div>
              <div>
                <strong>2. Co-construction réelle</strong>
                <p>
                  On veut échanger avec chaque client pilote pour construire la
                  roadmap.
                </p>
              </div>
              <div>
                <strong>3. Qualité &gt; Quantité</strong>
                <p>
                  On préfère 15 clients satisfaits qui utilisent vraiment le
                  produit que 100 comptes inactifs.
                </p>
              </div>
            </div>
            <p className="pilot-why-final">
              Si vous cherchez un produit grand public avec 10 000 clients, ce
              n&apos;est pas ici.
            </p>
          </div>

          <div className="pilot-places">
            <strong>Places disponibles : 11 / 15</strong>
          </div>

          <div className="pilot-filter-final">
            <p>
              Si vous avez lu jusqu&apos;ici et que vous vous reconnaissez, alors on
              peut travailler ensemble.
            </p>
            <p>
              <strong>Sinon, ne postulez pas.</strong>
            </p>
          </div>

          <div className="pilot-cta">
            <a className="button button--large" href="/apply">
              Demander un accès client pilote
            </a>
          </div>
        </section>

        <section className="section" id="proof">
          <div className="section-heading">
            <div className="eyebrow">Crédibilité</div>
            <h2>Pourquoi ce produit tient debout</h2>
          </div>

          <div className="proof-grid">
            {proofCards.map((card) => (
              <article className="info-card" key={card.title}>
                <h3>{card.title}</h3>
                <p dangerouslySetInnerHTML={{ __html: card.body }} />
              </article>
            ))}
          </div>

          <div className="proof-no-bs">
            <p>
              Pas de témoignages inventés. Pas de &ldquo;1000+ clients&rdquo;.
              <br />
              Juste un produit qui fait ce qu&apos;il promet.
            </p>
          </div>
        </section>

        <section className="section section--contrast" id="pricing">
          <div className="section-heading">
            <div className="eyebrow">Tarif</div>
            <h2>Tarif client pilote (15 places uniquement)</h2>
          </div>

          <div className="pricing-single">
            <article className="pricing-card pricing-card--accent">
              <div className="pricing-card__badge">Client Pilote</div>
              <div className="pricing-card__price">
                <strong>15 EUR</strong>
                <span>/ mois</span>
              </div>
              <div className="pricing-card__subtitle">
                Prix bloqué à vie. 50% de réduction sur l&apos;offre Pro (29 EUR/mois)
              </div>

              <h3>Ce qui est inclus :</h3>
              <ul>
                <li>Projets illimités</li>
                <li>Lots, dépenses, documents</li>
                <li>Alertes métier + statut décisionnel</li>
                <li>KPI fiables calculés automatiquement</li>
                <li>Export CSV comptable</li>
                <li>Collaboration équipe (5 membres max)</li>
                <li>Support prioritaire (&lt; 24h)</li>
                <li>Influence sur la roadmap</li>
              </ul>

              <p className="pricing-card__commitment">
                Sans engagement. Résiliable à tout moment.
              </p>

              <a className="button button--full" href="/apply">
                Rejoindre les 15 clients pilotes
              </a>
            </article>
          </div>

          <div className="pricing-transparency">
            <h3>Transparence totale :</h3>
            <p>
              Après la phase pilote (3-6 mois), le prix public passera à 29 EUR/mois (offre Pro).
              <br />
              Les clients pilotes conservent leur tarif de 15 EUR/mois{' '}
              <strong>à vie</strong>.
              <br />C&apos;est le deal. On ne vous arnaque pas avec des &ldquo;prix
              promotionnels qui augmentent dans 3 mois&rdquo;.
            </p>

            <h3>Pourquoi on limite à 15 ?</h3>
            <p>
              Parce qu&apos;on veut échanger avec chaque client, itérer vite, et ne
              pas se noyer sous le support.
              <br />
              Quand le produit sera stabilisé, on ouvrira à plus de monde. Mais
              au prix public.
            </p>
          </div>
        </section>

        <section className="section" id="faq">
          <div className="section-heading">
            <div className="eyebrow">FAQ</div>
            <h2>Les questions avant de demander un accès</h2>
          </div>

          <div className="faq-list">
            {faqItems.map((item) => (
              <details className="faq-item" key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="section section--cta" id="final-cta">
          <div className="cta-panel">
            <div>
              <div className="eyebrow">Arrêtez de piloter à l&apos;aveugle</div>
              <h2>
                Rejoignez les 15 premiers clients pilotes qui construisent l&apos;outil de pilotage qu&apos;ils auraient voulu avoir depuis le début
              </h2>
            </div>
            <p>
              Le produit existe. Il fonctionne. Il n&apos;est pas parfait, mais il
              résout le problème.
            </p>
            <p>
              Si vous êtes prêt à utiliser un produit en évolution rapide en
              échange d&apos;un prix préférentiel et d&apos;une vraie influence, on vous
              attend.
            </p>

            <div className="cta-panel__places">
              <strong>Places restantes : 11 / 15</strong>
            </div>

            <a className="button cta-panel__button button--large" href="/apply">
              Demander un accès client pilote
            </a>

            <p className="cta-panel__note">
              Réponse sous 48h. On échange rapidement pour vérifier que c&apos;est
              le bon fit.
            </p>
          </div>
        </section>

        <footer className="site-footer">
          <p>
            {siteName} — Outil de pilotage d&apos;opérations immobilières pour
            prendre des décisions fiables.
          </p>
        </footer>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplicationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqPageSchema),
        }}
      />
    </div>
  );
}
