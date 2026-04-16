import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { LandingAnalytics } from './components/landing-analytics';
import { LandingCtaLink } from './components/landing-cta-link';
import { PilotApplicationForm } from './components/pilot-application-form';
import styles from './page.module.css';
import {
  appUrl,
  defaultDescription,
  seoKeywords,
  siteName,
  siteUrl,
} from './site-config';

export const metadata: Metadata = {
  title:
    'Pilotage d’opérations immobilières pour investisseurs actifs et marchands de biens',
  description: defaultDescription,
  keywords: seoKeywords,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Axelys - Pilotez vos opérations immobilières avec des faits',
    description: defaultDescription,
    url: '/',
  },
  twitter: {
    title: 'Axelys - Pilotez vos opérations immobilières avec des faits',
    description: defaultDescription,
  },
};

const heroPoints = [
  'Projets, lots, dépenses et documents au même endroit.',
  'Lecture rapide des projets sains, à surveiller ou problématiques.',
  'KPI calculés sur des données réelles.',
];

const problemItems = [
  {
    title: 'Vous ouvrez le mauvais projet d’abord',
    body: 'Le vrai point chaud ressort trop tard.',
  },
  {
    title: 'Le budget vit dans plusieurs versions',
    body: 'Avant chaque arbitrage, vous reconstruisez la base.',
  },
  {
    title: 'Les pièces sont à part',
    body: 'Le justificatif n’est pas là quand il faut trancher.',
  },
  {
    title: 'La dérive se voit après coup',
    body: 'Le problème apparaît quand le budget a déjà bougé.',
  },
];

const solutionItems = [
  {
    title: 'Prioriser les bons dossiers',
    body: 'Un statut simple aide à ouvrir le bon projet en premier.',
  },
  {
    title: 'Corriger plus tôt',
    body: 'Les alertes utiles remontent avant le point de trop.',
  },
  {
    title: 'Justifier vite',
    body: 'Les chiffres et les pièces restent attachés au bon projet.',
  },
];

const proofRows = [
  {
    label: 'Projet',
    value: 'Budget en dérive',
  },
  {
    label: 'Budget travaux prévu',
    value: '10 000 €',
  },
  {
    label: 'Dépenses engagées',
    value: '30 000 €',
  },
  {
    label: 'Statut',
    value: 'Problématique',
  },
];

const offerSections = [
  {
    title: 'Ce que vous obtenez',
    items: [
      'Un accès au produit sur vos projets réels.',
      'Le tarif pilote à 15 € / mois.',
      'Des échanges directs pendant le déploiement.',
    ],
  },
  {
    title: 'Ce que vous acceptez',
    items: [
      'Un produit encore en phase pilote.',
      'Des ajustements de parcours et de priorités.',
      'Un usage réel, pas une simple visite.',
    ],
  },
  {
    title: 'Pourquoi c’est limité',
    items: [
      'Pour garder des retours exploitables.',
      'Pour suivre de près les premiers comptes actifs.',
      'Pas de liste d’attente artificielle.',
    ],
  },
];

const faqItems = [
  {
    question: 'À qui s’adresse Axelys aujourd’hui ?',
    answer:
      'Aux investisseurs immobiliers actifs, marchands de biens et petites structures qui pilotent plusieurs opérations en parallèle.',
  },
  {
    question: 'Est-ce un logiciel de gestion locative ?',
    answer:
      'Non. Le produit sert à suivre des opérations et à arbitrer sur des données fiables.',
  },
  {
    question: 'Qu’est-ce qui est déjà disponible ?',
    answer:
      'Le suivi après achat : projets, lots, dépenses, documents, KPI, alertes et statuts visibles.',
  },
  {
    question: 'Que comprend le programme client pilote ?',
    answer:
      'Un accès au produit, un tarif pilote à 15 € / mois et des échanges directs pendant la phase pilote.',
  },
  {
    question: 'Comment se passe la demande d’accès ?',
    answer:
      'Vous remplissez le formulaire. Chaque demande reçoit une réponse humaine.',
  },
];

const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: siteName,
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Logiciel de pilotage d’opérations immobilières',
  operatingSystem: 'Web',
  url: siteUrl,
  inLanguage: 'fr-FR',
  description: defaultDescription,
  audience: {
    '@type': 'Audience',
    audienceType:
      'Investisseurs immobiliers actifs, marchands de biens et petites structures multi-projets',
  },
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
    <div className={styles.shell}>
      <div className={styles.glowLeft} />
      <div className={styles.glowRight} />

      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          <Image
            src="/logo-text-bleu.svg"
            alt={siteName}
            width={250}
            height={50}
            priority
          />
        </Link>

        <nav className={styles.nav} aria-label="Navigation principale">
          <a href="#problem">Problème</a>
          <a href="#solution">Comment ça aide</a>
          <a href="#pilot">Offre pilote</a>
          <a href="#faq">FAQ</a>
          <a href={appUrl}>Se connecter</a>
        </nav>

        <LandingCtaLink
          className={styles.buttonPrimary}
          href="#access"
          location="header"
          label="request_pilot_access"
          target="#access"
        >
          Demander un accès
        </LandingCtaLink>
      </header>

      <main className={styles.main}>
        <LandingAnalytics />

        <section
          className={styles.hero}
          id="top"
          data-landing-section="hero"
        >
          <div className={styles.heroContent}>
            <div className={styles.eyebrow}>
              Pour investisseurs immobiliers actifs et marchands de biens
            </div>
            <h1>
              Pilotez vos opérations immobilières avec des faits, pas avec des
              impressions.
            </h1>
            <p className={styles.heroLead}>
              {siteName} vous montre rapidement quels projets sont OK, à
              surveiller ou problématiques à partir de vos lots, dépenses,
              documents et KPI calculés sur des données réelles.
            </p>

            <ul className={styles.heroList}>
              {heroPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>

            <div className={styles.heroActions}>
              <LandingCtaLink
                className={styles.buttonPrimary}
                href="#access"
                location="hero"
                label="request_pilot_access"
                target="#access"
              >
                Demander un accès client pilote
              </LandingCtaLink>
              <LandingCtaLink
                className={styles.buttonSecondary}
                href="#proof"
                location="hero"
                label="view_concrete_example"
                target="#proof"
              >
                Voir un exemple concret
              </LandingCtaLink>
            </div>
          </div>

          <div className={styles.previewShell} aria-label="Aperçu du produit">
            <div className={styles.previewHeader}>
              <div>
                <p className={styles.previewLabel}>Portefeuille</p>
                <strong>3 projets à ouvrir en priorité</strong>
              </div>
              <span className={styles.statusBadgeWarning}>À surveiller</span>
            </div>

            <div className={styles.previewBody}>
              <aside className={styles.previewSidebar}>
                <div className={styles.previewSidebarTitle}>Opérations</div>
                <div className={styles.previewProjectList}>
                  <div className={styles.previewProjectItem}>
                    <span>Immeuble Roubaix Centre</span>
                    <span className={styles.statusBadgeOk}>OK</span>
                  </div>
                  <div className={styles.previewProjectItem}>
                    <span>T2 Lille Fives</span>
                    <span className={styles.statusBadgeWarning}>
                      À surveiller
                    </span>
                  </div>
                  <div className={styles.previewProjectItem}>
                    <span>Division Tourcoing</span>
                    <span className={styles.statusBadgeDanger}>
                      Problématique
                    </span>
                  </div>
                </div>
              </aside>

              <div className={styles.previewContent}>
                <div className={styles.previewTopline}>
                  <div>
                    <p className={styles.previewLabel}>Projet ouvert</p>
                    <strong>Division Tourcoing</strong>
                  </div>
                  <span className={styles.statusBadgeDanger}>Problématique</span>
                </div>

                <div className={styles.kpiGrid}>
                  <div className={styles.kpiCard}>
                    <span>Dépenses engagées</span>
                    <strong>84 300 €</strong>
                  </div>
                  <div className={styles.kpiCard}>
                    <span>Lots actifs</span>
                    <strong>6</strong>
                  </div>
                  <div className={styles.kpiCard}>
                    <span>Documents liés</span>
                    <strong>19</strong>
                  </div>
                </div>

                <div className={styles.signalGrid}>
                  <article className={styles.signalCard}>
                    <h2>Alertes à traiter</h2>
                    <ul>
                      <li>Budget travaux au-dessus de la référence projet.</li>
                      <li>Deux justificatifs manquent sur des dépenses récentes.</li>
                    </ul>
                  </article>

                  <article className={styles.signalCard}>
                    <h2>Action probable</h2>
                    <p>Revoir le poste travaux le plus exposé et rattacher les pièces manquantes.</p>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.quickCta}>
          <p>
            Vous avez déjà plusieurs projets en cours ? Voyez vite si Axelys
            peut servir sur l’un d’eux.
          </p>
          <LandingCtaLink
            className={styles.buttonPrimary}
            href="#access"
            location="middle"
            label="test_on_my_project"
            target="#access"
          >
            Tester sur un de mes projets
          </LandingCtaLink>
        </section>

        <section
          className={styles.section}
          id="problem"
          data-landing-section="problem"
        >
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Problème</div>
            <h2>Le vrai coût, c’est de voir le problème trop tard.</h2>
          </div>

          <div className={styles.problemGrid}>
            {problemItems.map((item) => (
              <article className={styles.problemCard} key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>

          <div className={styles.inlineCta}>
            <p>Si vous pilotez déjà plusieurs opérations, le plus simple est de voir si vos projets sont sains.</p>
            <LandingCtaLink
              className={styles.buttonPrimary}
              href="#access"
              location="middle"
              label="check_project_health"
              target="#access"
            >
              Voir si mes projets sont sains
            </LandingCtaLink>
          </div>
        </section>

        <section
          className={styles.section}
          id="solution"
          data-landing-section="solution"
        >
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Comment ça aide</div>
            <h2>Trois usages. Pas plus.</h2>
          </div>

          <div className={styles.decisionGrid}>
            {solutionItems.map((item) => (
              <article className={styles.decisionCard} key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className={`${styles.section} ${styles.sectionAlt}`}
          id="proof"
          data-landing-section="proof"
        >
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Exemple concret</div>
            <h2>En quelques secondes, vous voyez ce qui a bougé.</h2>
            <p>Exemple simplifié tiré du jeu de démo du repo.</p>
          </div>

          <div className={styles.proofGrid}>
            <article className={styles.proofCard}>
              <div className={styles.proofHeader}>
                <div>
                  <p className={styles.previewLabel}>Projet travaux sous tension</p>
                  <strong>Lecture rapide dans Axelys</strong>
                </div>
                <span className={styles.statusBadgeDanger}>Problématique</span>
              </div>

              <div className={styles.proofRows}>
                {proofRows.map((row) => (
                  <div className={styles.proofRow} key={row.label}>
                    <span>{row.label}</span>
                    <strong>{row.value}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className={styles.proofAside}>
              <p className={styles.previewLabel}>Cause</p>
              <strong>Dérive travaux</strong>
              <p className={styles.proofCause}>+20 000 € (+200 %)</p>
              <p className={styles.proofNote}>
                Vous savez immédiatement pourquoi le projet remonte.
              </p>
            </article>
          </div>
        </section>

        <section
          className={styles.section}
          id="pilot"
          data-landing-section="pilot"
        >
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Offre client pilote</div>
            <h2>Un cadre simple. Pas un discours de lancement.</h2>
          </div>

          <div className={styles.offerPanel}>
            <div className={styles.offerSummary}>
              <div>
                <p className={styles.previewLabel}>Tarif pilote</p>
                <div className={styles.priceRow}>
                  <strong>15 €</strong>
                  <span>/ mois</span>
                </div>
              </div>
              <p>
                Prix public visé hors programme : 29 € / mois. Le tarif pilote
                reste ensuite.
              </p>
            </div>

            <div className={styles.offerGrid}>
              {offerSections.map((section) => (
                <article className={styles.offerCard} key={section.title}>
                  <h3>{section.title}</h3>
                  <ul>
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <div className={styles.credibilityStrip}>
              <span className={styles.credibilityPill}>Hébergé en Europe</span>
              <span className={styles.credibilityPill}>Stack web standard</span>
              <span className={styles.credibilityPill}>Déploiement progressif</span>
            </div>
          </div>
        </section>

        <section
          className={styles.section}
          id="faq"
          data-landing-section="faq"
        >
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>FAQ</div>
            <h2>Les objections critiques avant de demander un accès.</h2>
          </div>

          <div className={styles.faqList}>
            {faqItems.map((item) => (
              <details className={styles.faqItem} key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section
          className={`${styles.section} ${styles.sectionFinal}`}
          id="access"
          data-landing-section="form"
        >
          <div className={styles.accessPanel}>
            <div className={styles.accessCopy}>
              <div className={styles.eyebrow}>Demande d’accès</div>
              <h2>Demandez un accès si vous pilotez déjà plusieurs opérations.</h2>
              <p className={styles.accessPromise}>
                Vous saurez rapidement si Axelys est utile pour vos projets.
              </p>

              <div className={styles.accessSignals}>
                <span className={styles.accessSignal}>Réponse sous 24–48 h</span>
                <span className={styles.accessSignal}>Accès progressif</span>
                <span className={styles.accessSignal}>Aucun engagement</span>
              </div>

              <p>
                Le formulaire sert à vérifier si le produit correspond à votre
                contexte. Pas d’accès automatique.
              </p>

              <p className={styles.accessNote}>
                Vous préférez une page dédiée ? Le même formulaire reste
                accessible sur <Link href="/apply">/apply</Link>.
              </p>
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

        <footer className={styles.footer}>
          <p>
            {siteName} - Outil de pilotage d’opérations immobilières pour agir
            sur des faits.{' '}
            <LandingCtaLink
              href={appUrl}
              location="footer"
              label="open_application"
              target={appUrl}
            >
              Ouvrir l’application
            </LandingCtaLink>
            .
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
