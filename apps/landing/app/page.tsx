import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PilotApplicationForm } from './components/pilot-application-form';
import styles from './page.module.css';
import {
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
  'Centralisez projets, lots, dépenses et documents.',
  'Repérez vite les projets OK, à surveiller ou problématiques.',
  'Arbitrez avec des KPI calculés sur des données réelles.',
];

const fitColumns = [
  {
    title: 'Axelys est pour vous si',
    tone: 'good',
    items: [
      'Vous pilotez plusieurs opérations en parallèle.',
      'Vous arbitrez entre budget, travaux, justificatifs et rentabilité.',
      'Vous voulez une lecture simple avant que le problème ne soit trop visible.',
    ],
  },
  {
    title: 'Axelys n’est pas pour vous si',
    tone: 'bad',
    items: [
      'Vous cherchez un logiciel de gestion locative.',
      'Vous attendez un ERP immobilier qui couvre tout.',
      'Vous n’avez pas encore de besoin clair de pilotage multi-projets.',
    ],
  },
];

const problemItems = [
  {
    title: 'Vous ouvrez le mauvais projet d’abord',
    body: 'Tous les dossiers paraissent urgents. Le vrai point chaud ressort trop tard.',
  },
  {
    title: 'Le budget vit dans plusieurs versions',
    body: 'Tableur, mails, notes de chantier : avant chaque arbitrage, vous reconstruisez la même base.',
  },
  {
    title: 'Les pièces sont à part',
    body: 'Quand il faut expliquer une dépense, le justificatif n’est pas au bon endroit.',
  },
  {
    title: 'La dérive se voit après coup',
    body: 'Le problème apparaît quand la marge, le planning ou le budget ont déjà bougé.',
  },
];

const decisionItems = [
  {
    label: 'Statut projet',
    title: 'Voir où regarder d’abord',
    body: 'Un statut clair aide à prioriser les dossiers à ouvrir.',
  },
  {
    label: 'Alertes métier',
    title: 'Corriger avant la dérive',
    body: 'Les signaux utiles remontent avant le point de trop.',
  },
  {
    label: 'KPI fiables',
    title: 'Arbitrer sans refaire Excel',
    body: 'Les chiffres utiles viennent des données déjà saisies.',
  },
  {
    label: 'Documents liés',
    title: 'Justifier vite une décision',
    body: 'Les pièces restent rattachées au bon projet et aux bonnes dépenses.',
  },
];

const productNotes = [
  {
    title: 'Portefeuille',
    body: 'Une vue rapide pour savoir quels projets ouvrent en priorité.',
  },
  {
    title: 'Projet',
    body: 'Un détail qui rassemble lots, dépenses, documents et niveau de vigilance.',
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
      'Un usage réel, pas une simple visite de curiosité.',
    ],
  },
  {
    title: 'Pourquoi c’est limité',
    items: [
      'Pour garder des retours exploitables.',
      'Pour rester sélectif sur les bons profils.',
      'Pour garder un programme suivi de près, sans liste d’attente artificielle.',
    ],
  },
];

const credibilityItems = [
  {
    title: 'Périmètre clair',
    body: 'Axelys couvre aujourd’hui projets, lots, dépenses, documents, KPI et alertes. Pas davantage.',
  },
  {
    title: 'Base technique standard',
    body: 'Next.js, React, NestJS et PostgreSQL. Une stack lisible et maintenable.',
  },
  {
    title: 'Promesse maîtrisée',
    body: 'Aucune intégration, application mobile ou conformité n’est mise en avant ici sans base réelle.',
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
      'Non. Le produit sert à piloter des opérations et à arbitrer sur des données fiables.',
  },
  {
    question: 'Qu’est-ce qui est déjà disponible ?',
    answer:
      'Le pilotage après achat : projets, lots, dépenses, documents, KPI, alertes et statut clair.',
  },
  {
    question: 'Que comprend le programme client pilote ?',
    answer:
      'Un accès au produit, un tarif pilote à 15 € / mois et des échanges directs pendant la phase pilote.',
  },
  {
    question: 'Le tarif pilote reste-t-il ensuite ?',
    answer:
      'Oui. Le prix public visé hors programme est de 29 € / mois, mais le tarif pilote est conservé ensuite.',
  },
  {
    question: 'Comment se passe la demande d’accès ?',
    answer:
      'Vous remplissez le formulaire. Chaque demande est lue et reçoit une réponse humaine.',
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
          <a href="#fit">Pour qui</a>
          <a href="#decision">Comment ça aide</a>
          <a href="#pilot">Offre pilote</a>
          <a href="#faq">FAQ</a>
        </nav>

        <a className={styles.buttonPrimary} href="#access">
          Demander un accès
        </a>
      </header>

      <main className={styles.main}>
        <section className={styles.hero} id="top">
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
              documents et KPI calculés sur les données réelles.
            </p>

            <ul className={styles.heroList}>
              {heroPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>

            <div className={styles.heroActions}>
              <a className={styles.buttonPrimary} href="#access">
                Demander un accès client pilote
              </a>
              <a className={styles.buttonSecondary} href="#product">
                Voir l’aperçu produit
              </a>
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
                    <strong>84 300 €</strong>
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
                    <p>
                      Revoir le poste travaux le plus exposé et rattacher les
                      pièces manquantes.
                    </p>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section} id="fit">
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Pour qui / Pas pour qui</div>
            <h2>Le produit vise un cas précis. C’est volontaire.</h2>
            <p>
              Axelys ne cherche pas à plaire à tout le marché. Il vise les
              profils qui ont déjà un vrai besoin de pilotage multi-projets.
            </p>
          </div>

          <div className={styles.fitGrid}>
            {fitColumns.map((column) => (
              <article
                className={`${styles.fitCard} ${
                  column.tone === 'good' ? styles.fitCardGood : styles.fitCardBad
                }`}
                key={column.title}
              >
                <h3>{column.title}</h3>
                <ul>
                  {column.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} id="problem">
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Problème</div>
            <h2>Le vrai coût, c’est de décider trop tard.</h2>
            <p>
              Quand l’information utile est dispersée, le bon arbitrage arrive
              souvent après le bon moment.
            </p>
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
            <p>
              Si vous pilotez déjà plusieurs opérations, le plus simple est de
              voir si Axelys correspond à votre façon de travailler.
            </p>
            <a className={styles.buttonPrimary} href="#access">
              Demander un accès
            </a>
          </div>
        </section>

        <section className={styles.section} id="decision">
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Comment Axelys aide à décider</div>
            <h2>Chaque brique sert un arbitrage concret.</h2>
          </div>

          <div className={styles.decisionGrid}>
            {decisionItems.map((item) => (
              <article className={styles.decisionCard} key={item.title}>
                <span className={styles.cardLabel}>{item.label}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.sectionAlt}`} id="product">
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Aperçu produit</div>
            <h2>Ce que vous voyez à l’écran doit servir une lecture utile.</h2>
            <p>
              D’abord le niveau de vigilance. Ensuite les chiffres et les pièces
              qui permettent de confirmer ou corriger la décision.
            </p>
          </div>

          <div className={styles.productLayout}>
            <div className={styles.productPanel}>
              <div className={styles.productPanelHeader}>
                <div>
                  <p className={styles.previewLabel}>Lecture type</p>
                  <strong>Portefeuille + détail projet</strong>
                </div>
                <span className={styles.productPanelNote}>
                  Aperçu d’interface
                </span>
              </div>

              <div className={styles.productPanelBody}>
                <div className={styles.productColumn}>
                  <h3>Pourquoi ce bloc compte</h3>
                  <p>
                    Il montre quel projet ouvrir maintenant, avec un niveau de
                    vigilance lisible.
                  </p>
                </div>
                <div className={styles.productColumn}>
                  <h3>Ce que vous vérifiez</h3>
                  <p>
                    KPI, alertes, dépenses et documents liés, sans repartir
                    dans des fichiers dispersés.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.productNotes}>
              {productNotes.map((note) => (
                <article className={styles.productNoteCard} key={note.title}>
                  <h3>{note.title}</h3>
                  <p>{note.body}</p>
                </article>
              ))}
              <p className={styles.productCaption}>
                Les valeurs affichées ici illustrent la structure de lecture,
                pas une promesse décorative.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section} id="pilot">
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Offre client pilote</div>
            <h2>Un seul cadre. Clair dès le départ.</h2>
            <p>
              Le produit est payant, encore en phase pilote, et réservé à un
              petit nombre de profils actifs pour garder des retours utiles.
            </p>
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
                est conservé ensuite.
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
          </div>
        </section>

        <section className={styles.section} id="credibility">
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Crédibilité</div>
            <h2>Un discours borné. Un produit qui assume son vrai stade.</h2>
          </div>

          <div className={styles.credibilityGrid}>
            {credibilityItems.map((item) => (
              <article className={styles.credibilityCard} key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>

          <div className={styles.transparencyPanel}>
            <p>
              Pas de faux avis. Pas de compteur artificiel. Pas de promesse de
              sécurité ou de conformité non documentée ici.
            </p>
          </div>
        </section>

        <section className={styles.section} id="faq">
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>FAQ</div>
            <h2>Les objections utiles avant de demander un accès.</h2>
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

        <section className={`${styles.section} ${styles.sectionFinal}`} id="access">
          <div className={styles.accessPanel}>
            <div className={styles.accessCopy}>
              <div className={styles.eyebrow}>Demande d’accès</div>
              <h2>Demandez un accès si vous pilotez déjà plusieurs opérations.</h2>
              <p>
                Le formulaire sert à vérifier rapidement si le produit
                correspond à votre contexte. Il n’y a pas d’accès automatique.
              </p>

              <ul className={styles.accessList}>
                <li>Pour investisseurs actifs, marchands de biens et structures multi-projets.</li>
                <li>Réponse humaine, pas de séquence marketing automatique.</li>
                <li>Si le produit n’est pas adapté à votre contexte, on vous le dira simplement.</li>
              </ul>

              <p className={styles.accessNote}>
                Vous préférez une page dédiée ? Le même formulaire reste
                accessible sur <Link href="/apply">/apply</Link>.
              </p>
            </div>

            <PilotApplicationForm
              submitLabel="Envoyer ma demande"
              successTitle="Demande reçue"
              successDescription="Votre demande a bien été transmise. Si le profil et le contexte correspondent au programme, on revient vers vous."
              successNote="Pas de séquence automatique. Juste une réponse humaine quand le contexte correspond."
            />
          </div>
        </section>

        <footer className={styles.footer}>
          <p>
            {siteName} - Outil de pilotage d’opérations immobilières pour
            décider sur des faits.
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
