import { LandingAnalytics } from './components/landing-analytics';
import { LandingCtaLink } from './components/landing-cta-link';
import { OfferCard } from './components/offer-card';
import { PilotApplicationForm } from './components/pilot-application-form';
import { SiteShell } from './components/site-shell';
import { ArticleCard } from './components/article-card';
import styles from './components/marketing-ui.module.css';
import { businessPageList } from './content/business-pages';
import { getFeaturedBlogPosts } from './content/blog-posts';
import {
  homeFaqItems,
  homeHeroHighlights,
  homeProblemCards,
  homePrivateCoreCards,
  homeValueCards,
  pricingPlans,
} from './content/marketing-content';
import { buildMetadata } from './seo';
import { defaultDescription, siteName, siteUrl } from './site-config';

export const metadata = buildMetadata({
  title: 'Outil de décision et de pilotage immobilier',
  description: defaultDescription,
  path: '/',
  keywords: [
    'outil de décision immobilier',
    'pilotage opération immobilière',
    'analyse projet immobilier',
    'analyse rentabilité immobilière',
    'logiciel marchand de biens',
  ],
});

const featuredPosts = getFeaturedBlogPosts(3);
const publicOffers = pricingPlans;

const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: siteName,
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Outil de décision et de pilotage immobilier',
  operatingSystem: 'Web',
  url: siteUrl,
  inLanguage: 'fr-FR',
  description: defaultDescription,
  offers: {
    '@type': 'Offer',
    name: 'Programme client pilote',
    price: '15',
    priceCurrency: 'EUR',
  },
};

const faqPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: homeFaqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

export default function HomePage() {
  return (
    <SiteShell
      currentPath="/"
      ctaHref="#home-form"
      ctaLabel="Demander un accès"
      ctaLocation="header"
      ctaTrackingLabel="jump_to_home_form"
      ctaTarget="#home-form"
    >
      <LandingAnalytics />

      <div className={styles.page}>
        <section className={styles.hero} data-landing-section="hero" id="top">
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <div className={styles.eyebrow}>
                Décider avant achat. Piloter après acquisition.
              </div>
              <h1 className={styles.heroTitle}>
                L’outil de décision et de pilotage immobilier pour arbitrer avec méthode.
              </h1>
              <p className={styles.heroLead}>
                Axelys aide les investisseurs immobiliers actifs, marchands de
                biens et petites structures multi-projets à décider avant achat,
                puis à suivre un projet réel sans transformer le site public en
                simulateur gadget.
              </p>
              <ul className={styles.highlightList}>
                {homeHeroHighlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className={styles.actionRow}>
                <LandingCtaLink
                  className={styles.buttonPrimary}
                  href="#home-form"
                  location="hero"
                  label="request_pilot_access"
                  target="#home-form"
                >
                  Demander un accès client pilote
                </LandingCtaLink>
                <LandingCtaLink
                  className={styles.buttonSecondary}
                  href="/pricing"
                  location="hero"
                  label="view_pricing"
                  target="/pricing"
                >
                  Voir les offres
                </LandingCtaLink>
              </div>
              <div className={styles.quickMeta}>
                <span className={styles.quickMetaItem}>Offre ouverte: client pilote</span>
                <span className={styles.quickMetaItem}>Simple et Pro visibles, non activables</span>
                <span className={styles.quickMetaItem}>Simulateur réservé à l’app privée</span>
              </div>
            </div>

            <aside className={styles.heroPanel}>
              <p className={styles.kicker}>Ce qu’Axelys change</p>
              <h2 className={styles.panelTitle}>Arbitrer, suivre, corriger.</h2>
              <p className={styles.panelBody}>
                Le site public explique clairement le cadre. L’application privée
                porte le moteur d’analyse détaillé, la comparaison des opportunités
                et la conversion vers projet réel.
              </p>
              <div className={styles.statStrip}>
                <div className={styles.statCard}>
                  <span className={styles.kicker}>Avant achat</span>
                  <strong>Comparer une opportunité</strong>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.kicker}>Après achat</span>
                  <strong>Suivre les dérives utiles</strong>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.kicker}>Aujourd’hui</span>
                  <strong>Programme client pilote</strong>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className={styles.section} data-landing-section="problem" id="problem">
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Le problème</div>
            <h2 className={styles.sectionTitle}>Décider et piloter deviennent fragiles quand tout est dispersé.</h2>
            <p className={styles.sectionLead}>
              Axelys n’essaie pas de tout faire. Le produit s’attaque à ce qui
              abîme le plus vite la qualité d’un arbitrage et d’un suivi de projet.
            </p>
          </div>
          <div className={styles.cardGrid}>
            {homeProblemCards.map((item, index) => (
              <article
                className={`${styles.card} ${index === 0 ? styles.cardEmphasis : ''}`.trim()}
                key={item.title}
              >
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardText}>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} data-landing-section="solution" id="solution">
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Comment Axelys aide</div>
            <h2 className={styles.sectionTitle}>Axelys aide à arbitrer, pas seulement à calculer.</h2>
          </div>
          <div className={styles.cardGrid}>
            {homeValueCards.map((item) => (
              <article className={styles.card} key={item.title}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardText}>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} data-landing-section="proof" id="proof">
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Sécurité produit</div>
            <h2 className={styles.sectionTitle}>Le site public reste utile sans exposer le cœur du produit.</h2>
            <p className={styles.sectionLead}>
              Le contenu public prépare la compréhension et la conversion. Le vrai
              simulateur, la logique métier détaillée et la conversion vers projet
              restent dans l’application privée.
            </p>
          </div>
          <div className={styles.cardGrid}>
            {homePrivateCoreCards.map((item) => (
              <article className={styles.card} key={item.title}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardText}>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} data-landing-section="pilot" id="offers">
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Offres</div>
            <h2 className={styles.sectionTitle}>Le client pilote au centre. Simple et Pro visibles, mais pas activables.</h2>
          </div>
          <div className={styles.pricingGrid}>
            {publicOffers.map((plan) => (
              <OfferCard key={plan.slug} plan={plan} />
            ))}
          </div>
        </section>

        <section className={styles.sectionMuted}>
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Pages métier</div>
            <h2 className={styles.sectionTitle}>Des pages publiques utiles pour l’indexation, sans simulateur réel.</h2>
          </div>
          <div className={styles.resourceGrid}>
            {businessPageList.map((page) => (
              <LandingCtaLink
                className={styles.resourceCard}
                href={page.href}
                key={page.href}
                location="middle"
                label="open_business_page"
                target={page.href}
              >
                <p className={styles.resourceMeta}>Page métier</p>
                <h3 className={styles.resourceTitle}>{page.title}</h3>
                <p className={styles.resourceDescription}>{page.description}</p>
              </LandingCtaLink>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Blog</div>
            <h2 className={styles.sectionTitle}>Des articles utiles pour préparer une décision sérieuse.</h2>
          </div>
          <div className={styles.articleGrid}>
            {featuredPosts.map((post, index) => (
              <ArticleCard key={post.slug} post={post} featured={index === 0} />
            ))}
          </div>
        </section>

        <section className={styles.section} data-landing-section="faq" id="faq">
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>FAQ</div>
            <h2 className={styles.sectionTitle}>Les points à clarifier avant de candidater.</h2>
          </div>
          <div className={styles.faqGrid}>
            {homeFaqItems.map((item) => (
              <details className={styles.faqItem} key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.section} data-landing-section="form" id="home-form">
          <div className={styles.formGrid}>
            <div className={styles.heroContent}>
              <div className={styles.eyebrow}>Demande d’accès</div>
              <h2 className={styles.sectionTitle}>Candidater au programme client pilote</h2>
              <p className={styles.sectionLead}>
                Le bon point d’entrée aujourd’hui est le programme client pilote.
                Pas d’ouverture automatique, pas de promesse floue, juste un tri
                sérieux des contextes où Axelys peut déjà être utile.
              </p>
              <ul className={styles.signalList}>
                <li>Réponse humaine sur la pertinence du contexte</li>
                <li>Offre pilote à 15 € / mois pour les profils retenus</li>
                <li>Simple et Pro restent volontairement non activables</li>
              </ul>
              <div className={styles.actionRow}>
                <LandingCtaLink
                  className={styles.buttonGhost}
                  href="/client-pilote"
                  location="form"
                  label="open_client_pilot_page"
                  target="/client-pilote"
                >
                  Voir la page client pilote
                </LandingCtaLink>
              </div>
            </div>

            <PilotApplicationForm
              analyticsContext="landing"
              submitLabel="Envoyer ma demande"
              successTitle="Demande reçue"
              successDescription="Votre demande a bien été transmise. Si le profil et le contexte correspondent au programme, on revient vers vous."
              successNote="Pas de séquence automatique. Juste une réponse humaine quand le contexte correspond."
            />
          </div>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
      />
    </SiteShell>
  );
}
