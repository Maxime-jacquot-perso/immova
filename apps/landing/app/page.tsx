import type { Metadata } from 'next';
import {
  defaultDescription,
  seoKeywords,
  siteName,
  siteUrl,
} from './site-config';

export const metadata: Metadata = {
  title:
    'Logiciel de pilotage projet immobilier pour suivre depenses, documents et KPI',
  description: defaultDescription,
  keywords: seoKeywords,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title:
      'Logiciel de pilotage projet immobilier pour suivre depenses, documents et KPI',
    description: defaultDescription,
    url: '/',
  },
  twitter: {
    title:
      'Logiciel de pilotage projet immobilier pour suivre depenses, documents et KPI',
    description: defaultDescription,
  },
};

const proofItems = [
  {
    title: 'Suivi operation par operation',
    body: 'Une vue claire par projet immobilier au lieu de reconstruire le dossier dans plusieurs fichiers.',
  },
  {
    title: 'Depenses et justificatifs relies',
    body: 'Factures, montants et pieces restent rattaches au bon projet et aux bonnes depenses.',
  },
  {
    title: 'KPI explicables',
    body: 'Les indicateurs viennent des donnees saisies et restent lisibles pour toute l equipe.',
  },
  {
    title: 'Export CSV simple',
    body: 'Quand il faut partager ou transmettre, les depenses sortent proprement sans export maison.',
  },
];

const audienceCards = [
  {
    title: 'Investisseurs immobiliers',
    body: 'Pour suivre un projet sans empiler les tableurs, garder les justificatifs accessibles et lire rapidement les KPI utiles.',
  },
  {
    title: 'Marchands de biens',
    body: "Pour piloter plusieurs operations avec une lecture nette des depenses engagees, des documents relies et de l'avancement projet.",
  },
  {
    title: 'Petites structures multi-projets',
    body: "Pour partager un meme cadre de travail, avec membres et roles simples, sans basculer dans un ERP immobilier trop lourd.",
  },
];

const trackingCards = [
  {
    title: 'Projets',
    body: "Retrouvez le statut, les montants clefs et le detail de chaque operation dans un seul logiciel de pilotage projet immobilier.",
  },
  {
    title: 'Lots',
    body: 'Gardez la structure du projet sous la main pour suivre les lots relies, leur surface et leurs loyers estimes.',
  },
  {
    title: 'Depenses',
    body: 'Suivez les depenses et factures de travaux immobilier sans perdre le lien avec le projet et les pieces justificatives.',
  },
  {
    title: 'Documents',
    body: 'Organisez la gestion documentaire projet immobilier de facon simple, avec un acces direct depuis le detail projet.',
  },
  {
    title: 'KPI fiables',
    body: 'Lisez des KPI projet immobilier calcules a partir des donnees saisies, sans formule opaque ni tableau parallele.',
  },
];

const avoidCards = [
  {
    title: 'Fichiers disperses',
    body: 'Le projet ne depend plus de plusieurs feuilles, dossiers partages ou versions locales qui se contredisent.',
  },
  {
    title: 'Justificatifs introuvables',
    body: 'Les pieces utiles restent attachees aux bonnes depenses au lieu de se perdre entre mail, drive et bureau.',
  },
  {
    title: 'Suivi budget approximatif',
    body: "Le budget ne se lit plus a travers des copier coller mais depuis les depenses reellement saisies dans l'outil.",
  },
  {
    title: 'KPI impossibles a expliquer',
    body: "Les indicateurs restent relies a une source claire, ce qui evite les chiffres difficiles a justifier en reunion ou en comite d'investissement.",
  },
  {
    title: 'Dependance a des exports maison',
    body: 'Le produit garde un export CSV simple, sans obliger a recreer la structure du projet a la main a chaque partage.',
  },
];

const comparisonRows = [
  {
    left: 'Les depenses vivent dans plusieurs onglets et fichiers.',
    right: 'Les depenses sont saisies dans le detail projet, avec leurs justificatifs.',
  },
  {
    left: 'Les documents sont ranges ailleurs et retrouves au dernier moment.',
    right: 'Les documents restent relies au projet et consultables depuis le meme espace.',
  },
  {
    left: 'Les KPI changent selon le tableur qui sert de reference.',
    right: 'Les KPI sont calcules depuis les donnees saisies dans le produit.',
  },
  {
    left: 'Le projet se reconstitue manuellement avant chaque arbitrage.',
    right: 'Le detail projet donne une lecture directe de ce qui est engage, documente et exportable.',
  },
];

const differentiators = [
  {
    title: 'Pas un ERP immobilier lourd',
    body: 'Le produit ne cherche pas a couvrir toute la chaine immobiliere. Il se concentre sur le pilotage des operations.',
  },
  {
    title: 'Pas une usine a gaz de gestion locative',
    body: 'La promesse ne tourne pas autour des locataires, du cash-flow reel ou de la comptabilite generale.',
  },
  {
    title: 'Un outil centre sur le pilotage',
    body: "Chaque ecran sert a comprendre un projet, ses lots, ses depenses, ses documents et les KPI qui en decoulent.",
  },
];

const workflowSteps = [
  {
    number: '01',
    title: 'Creer le projet et ses lots',
    body: 'Vous posez le cadre de l operation avec les informations utiles au suivi reel du projet.',
  },
  {
    number: '02',
    title: 'Ajouter depenses et justificatifs',
    body: 'Chaque facture et chaque document viennent alimenter le meme espace de travail, sans recopie dans des fichiers annexes.',
  },
  {
    number: '03',
    title: 'Lire les KPI et exporter',
    body: "Vous obtenez une lecture exploitable du projet et un export CSV simple quand il faut partager ou transmettre.",
  },
];

const decisionCards = [
  {
    title: "Ou en est le budget d'un projet aujourd hui ?",
    body: 'Vous voyez les montants engages, les depenses totales et ce qui est deja documente.',
  },
  {
    title: 'Quelles depenses travaux sont deja engagees ?',
    body: 'Le suivi des depenses travaux immobilier ne depend plus de rapprochements manuels.',
  },
  {
    title: 'Quels lots sont relies au projet ?',
    body: 'La vue projet garde les lots, leur structure et leurs loyers estimes dans le meme cadre.',
  },
  {
    title: 'Quel export partager au comptable ?',
    body: 'Les depenses restent exportables en CSV sans refaire un fichier specifique pour chaque besoin.',
  },
];

const pricingPlans = [
  {
    name: 'Free',
    priceLabel: '0 EUR',
    priceValue: '0',
    description: "Pour decouvrir l'outil sur un premier projet.",
    bullets: [
      '1 projet actif',
      'Suivi de base des lots, depenses et documents',
      'KPI essentiels sur le projet',
      'Export CSV limite',
    ],
    cta: 'Tester la plateforme',
    tone: 'muted',
  },
  {
    name: 'Pro',
    priceLabel: '29 EUR',
    priceValue: '29',
    description: 'Pour piloter serieusement plusieurs operations.',
    bullets: [
      'Plusieurs projets actifs',
      'Lots, depenses, documents, KPI et export CSV',
      'Collaboration simple avec membres et roles',
      'Offre centrale pour investisseurs et marchands de biens',
    ],
    cta: "Commencer avec l'offre Pro",
    tone: 'accent',
  },
  {
    name: 'Business',
    priceLabel: '59 EUR',
    priceValue: '59',
    description: 'Pour un usage equipe plus large.',
    bullets: [
      'Capacites plus larges pour equipes multi-projets',
      'Cadre plus confortable pour suivre plusieurs operations',
      'Collaboration simple a plus grande echelle',
      'Onboarding prioritaire',
    ],
    cta: 'Demander une demo',
    tone: 'default',
  },
];

const faqItems = [
  {
    question: "A qui s'adresse la plateforme ?",
    answer:
      "La plateforme s'adresse surtout aux investisseurs immobiliers, marchands de biens et petites structures qui pilotent plusieurs projets en parallele.",
  },
  {
    question: "Est-ce un logiciel de gestion locative ?",
    answer:
      "Non. Le produit n'est pas un logiciel de gestion locative complet. Il est centre sur le pilotage d'operations immobilieres, pas sur toute la gestion locative.",
  },
  {
    question: 'Que peut-on suivre dans un projet ?',
    answer:
      'Vous pouvez suivre les projets, les lots, les depenses ou factures, les documents, des KPI projet simples et fiables et un export CSV comptable.',
  },
  {
    question: 'Les KPI sont-ils calcules a partir des donnees saisies ?',
    answer:
      'Oui. Les KPI visibles sont calcules a partir des donnees saisies dans le produit afin de garder des indicateurs explicables et utiles.',
  },
  {
    question: 'Peut-on exporter les depenses ?',
    answer:
      'Oui. Le produit propose un export CSV simple pour transmettre ou retraiter les depenses sans recreer un fichier maison.',
  },
  {
    question: 'Peut-on travailler en equipe ?',
    answer:
      "Oui. Le produit prevoit une collaboration simple avec organisation courante, memberships et roles simples adaptes a un usage B2B.",
  },
  {
    question: 'Quelle difference entre Free, Pro et Business ?',
    answer:
      "Free permet de decouvrir la plateforme sur un premier projet. Pro est l'offre centrale pour piloter plusieurs operations. Business ouvre un cadre plus large pour les equipes multi-projets avec plus de confort d'usage.",
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
  offers: pricingPlans.map((plan) => ({
    '@type': 'Offer',
    name: plan.name,
    price: plan.priceValue,
    priceCurrency: 'EUR',
  })),
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
          <span className="site-brand__mark">PI</span>
          <span>{siteName}</span>
        </a>

        <nav className="site-nav" aria-label="Navigation principale">
          <a href="#for-who">Pour qui</a>
          <a href="#tracking">Ce que vous suivez</a>
          <a href="#pricing">Tarifs</a>
          <a href="#faq">FAQ</a>
        </nav>

        <a className="button" href="#final-cta">
          Demander une demo
        </a>
      </header>

      <main>
        <section className="hero" id="top">
          <div className="hero__copy">
            <div className="eyebrow">Logiciel de pilotage projet immobilier</div>
            <h1>
              Stoppez les tableurs disperses. Pilotez chaque projet immobilier
              dans un espace clair, fiable et exploitable.
            </h1>
            <p className="hero__body">
              Quand les depenses vivent dans plusieurs fichiers, que les pieces
              justificatives sont eparpillees et que le budget se suit a la
              main, il devient difficile de savoir ou en est vraiment une
              operation. {siteName} centralise projets, lots, depenses,
              documents et KPI fiables pour garder une lecture immediate de
              chaque projet.
            </p>

            <div className="hero__actions">
              <a className="button" href="#pricing">
                Tester la plateforme
              </a>
              <a className="button button--secondary" href="#workspace">
                Voir l outil
              </a>
            </div>

            <div className="hero-split-card">
              <div className="hero-split-card__column">
                <span className="hero-split-card__label">
                  Ce qui vous ralentit
                </span>
                <ul>
                  <li>Tableurs disperses selon les sujets</li>
                  <li>Justificatifs eparpilles entre dossiers et mails</li>
                  <li>Depenses difficiles a suivre projet par projet</li>
                  <li>Manque de visibilite sur ce qui est vraiment engage</li>
                </ul>
              </div>

              <div className="hero-split-card__column hero-split-card__column--accent">
                <span className="hero-split-card__label">
                  Ce que la plateforme remet a plat
                </span>
                <ul>
                  <li>Un detail projet qui sert de reference</li>
                  <li>Des documents relies aux bonnes depenses</li>
                  <li>Des KPI fiables et comprenables</li>
                  <li>Un export CSV simple quand il faut partager</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="hero__preview" aria-hidden="true" id="workspace">
            <div className="app-preview">
              <aside className="app-preview__sidebar">
                <div className="app-preview__brand">{siteName}</div>
                <div className="app-preview__meta">Suivi operation immobiliere</div>
                <div className="app-preview__nav">
                  <div className="app-preview__nav-item app-preview__nav-item--active">
                    Projects
                  </div>
                  <div className="app-preview__nav-item">Lots</div>
                  <div className="app-preview__nav-item">Expenses</div>
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
                  <span className="mini-badge">Vue projet</span>
                </div>

                <div className="preview-kpis">
                  <div className="preview-kpi">
                    <span>Cout acquisition</span>
                    <strong>218 000 EUR</strong>
                  </div>
                  <div className="preview-kpi">
                    <span>Depenses totales</span>
                    <strong>31 400 EUR</strong>
                  </div>
                  <div className="preview-kpi">
                    <span>Loyer estime</span>
                    <strong>3 250 EUR</strong>
                  </div>
                </div>

                <div className="preview-panels">
                  <div className="preview-panel">
                    <h2>Dernieres depenses</h2>
                    <ul>
                      <li>
                        <span>Electricite lot 2</span>
                        <strong>7 240 EUR</strong>
                      </li>
                      <li>
                        <span>Menuiserie facade</span>
                        <strong>4 980 EUR</strong>
                      </li>
                      <li>
                        <span>Notaire acquisition</span>
                        <strong>15 600 EUR</strong>
                      </li>
                    </ul>
                  </div>

                  <div className="preview-panel">
                    <h2>Documents relies</h2>
                    <ul>
                      <li>
                        <span>Facture travaux lot 2</span>
                        <strong>PDF</strong>
                      </li>
                      <li>
                        <span>Acte authentique</span>
                        <strong>PDF</strong>
                      </li>
                      <li>
                        <span>Export depenses mars</span>
                        <strong>CSV</strong>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="preview-summary">
                  <div>
                    <span className="preview-summary__label">Reference</span>
                    <strong>MD-2026-014</strong>
                  </div>
                  <div>
                    <span className="preview-summary__label">Lots</span>
                    <strong>4 actifs</strong>
                  </div>
                  <div>
                    <span className="preview-summary__label">Documents</span>
                    <strong>18 fichiers</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="proof-band" aria-labelledby="proof-title">
          <h2 className="sr-only" id="proof-title">
            Preuves rapides
          </h2>
          {proofItems.map((item) => (
            <article className="proof-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </section>

        <section className="section" id="for-who">
          <div className="section-heading">
            <div className="eyebrow">Pour qui</div>
            <h2>Un outil de pilotage B2B pense pour ceux qui doivent vraiment suivre un projet.</h2>
            <p>
              Le produit sert a piloter une operation immobiliere, pas a
              transformer le quotidien en empilement d outils, de modules et de
              processus superflus.
            </p>
          </div>

          <div className="audience-grid">
            {audienceCards.map((card) => (
              <article className="info-card" key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="tracking">
          <div className="section-heading">
            <div className="eyebrow">Ce que vous suivez</div>
            <h2>Ce que vous suivez en un seul endroit.</h2>
            <p>
              {siteName} rassemble les briques utiles au suivi d une operation
              immobiliere : projets, lots, depenses, documents et KPI projet
              immobilier. Vous gardez une base exploitable sans sortir du scope
              reel du produit.
            </p>
          </div>

          <div className="tracking-grid">
            {trackingCards.map((card) => (
              <article className="feature-card" key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section section--contrast" id="comparison">
          <div className="section-heading">
            <div className="eyebrow">Tableurs vs outil</div>
            <h2>Pourquoi c est mieux qu un empilement de tableurs.</h2>
            <p>
              Quand le detail projet vit dans des feuilles differentes, les
              depenses, documents et KPI deviennent fragiles. Ici, la reference
              reste le projet lui-meme.
            </p>
          </div>

          <div className="comparison-panel">
            <div className="comparison-column">
              <div className="comparison-column__title">Avec des tableurs</div>
              <ul>
                {comparisonRows.map((row) => (
                  <li key={row.left}>{row.left}</li>
                ))}
              </ul>
            </div>

            <div className="comparison-column comparison-column--accent">
              <div className="comparison-column__title">Avec {siteName}</div>
              <ul>
                {comparisonRows.map((row) => (
                  <li key={row.right}>{row.right}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="section-subheading">
            <h3>Ce que vous evitez</h3>
            <p>
              La valeur du produit se voit aussi dans ce qu il retire du
              quotidien : friction, approximations et dependance aux bricolages
              maison.
            </p>
          </div>

          <div className="avoid-grid">
            {avoidCards.map((card) => (
              <article className="info-card info-card--compact" key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="difference">
          <div className="section-heading">
            <div className="eyebrow">Pourquoi ce produit est different</div>
            <h2>Un cadre clair pour piloter des operations, pas une usine a gaz.</h2>
            <p>
              La promesse reste volontairement nette : vous aider a suivre un
              projet immobilier de facon credible, sans glisser vers un ERP
              complet ou une gestion locative avancee.
            </p>
          </div>

          <div className="difference-grid">
            {differentiators.map((item) => (
              <article className="difference-card" key={item.title}>
                <span className="difference-card__kicker">Positionnement</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="workflow">
          <div className="section-heading">
            <div className="eyebrow">Comment ca marche</div>
            <h2>Un parcours simple, pense pour le suivi reel du projet.</h2>
          </div>

          <div className="workflow-grid">
            {workflowSteps.map((step) => (
              <article className="workflow-card" key={step.number}>
                <span className="workflow-card__number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="decisions">
          <div className="section-heading">
            <div className="eyebrow">Ce que le produit aide a decider</div>
            <h2>Une lecture exploitable pour arbitrer plus vite et plus proprement.</h2>
            <p>
              Le produit aide a decider a partir des informations saisies, sans
              recoller les morceaux d une operation avant chaque echange.
            </p>
          </div>

          <div className="decision-grid">
            {decisionCards.map((card) => (
              <article className="decision-card" key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="pricing">
          <div className="section-heading">
            <div className="eyebrow">Tarifs</div>
            <h2>Trois offres lisibles pour choisir le bon niveau d usage.</h2>
            <p>
              Le coeur du produit reste le meme : projets, lots, depenses,
              documents, KPI fiables et export CSV. Ce qui change selon les
              plans, c est l ampleur du suivi et le confort de collaboration.
            </p>
          </div>

          <div className="pricing-grid">
            {pricingPlans.map((plan) => (
              <article
                className={`pricing-card pricing-card--${plan.tone}`}
                key={plan.name}
              >
                <div className="pricing-card__header">
                  <div>
                    <h3>{plan.name}</h3>
                    <p>{plan.description}</p>
                  </div>
                  {plan.name === 'Pro' ? (
                    <span className="mini-badge">Offre centrale</span>
                  ) : null}
                </div>

                <div className="pricing-card__price">
                  <strong>{plan.priceLabel}</strong>
                  <span>/ mois</span>
                </div>

                <ul>
                  {plan.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>

                <a
                  className={`button button--full ${
                    plan.name === 'Pro' ? '' : 'button--secondary'
                  }`}
                  href={plan.name === 'Business' ? '#final-cta' : '#top'}
                >
                  {plan.cta}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="faq">
          <div className="section-heading">
            <div className="eyebrow">FAQ</div>
            <h2>Les questions utiles avant de tester la plateforme.</h2>
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
              <div className="eyebrow">Passer des fichiers au pilotage</div>
              <h2>Donnez a chaque projet immobilier un espace clair, fiable et exploitable.</h2>
            </div>
            <p>
              Si vous voulez suivre une operation sans disperser les depenses,
              les pieces et les KPI dans plusieurs outils, la plateforme est
              pensee pour ca.
            </p>
            <a className="button cta-panel__button" href="#top">
              Demander une demo
            </a>
          </div>
        </section>

        <footer className="site-footer">
          <p>
            {siteName} aide a centraliser projets, lots, depenses, documents et
            KPI fiables pour le suivi d operation immobiliere.
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
