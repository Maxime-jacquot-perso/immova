import Link from 'next/link';
import { OfferCard } from '../components/offer-card';
import { SiteShell } from '../components/site-shell';
import styles from '../components/marketing-ui.module.css';
import { pricingMatrix, pricingPlans } from '../content/marketing-content';
import { buildMetadata } from '../seo';

export const metadata = buildMetadata({
  title: 'Pricing',
  description:
    'Découvrez le programme client pilote Axelys et la trajectoire des offres Simple et Pro, visibles mais non encore activables.',
  path: '/pricing',
  keywords: ['pricing logiciel immobilier', 'offre client pilote', 'outil pilotage immobilier'],
});

export default function PricingPage() {
  return (
    <SiteShell currentPath="/pricing">
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <div className={styles.eyebrow}>Pricing</div>
              <h1 className={styles.heroTitle}>Une offre ouverte maintenant, deux offres visibles pour la suite.</h1>
              <p className={styles.heroLead}>
                La seule offre activable aujourd’hui est le programme client
                pilote. Les offres Simple et Pro sont affichées pour clarifier
                la trajectoire commerciale, sans promettre un périmètre non prêt.
              </p>
              <div className={styles.actionRow}>
                <Link className={styles.buttonPrimary} href="/client-pilote">
                  Demander un accès pilote
                </Link>
                <Link className={styles.buttonSecondary} href="/blog">
                  Lire le blog
                </Link>
              </div>
            </div>
            <aside className={styles.heroPanel}>
              <p className={styles.kicker}>Principes</p>
              <ul className={styles.panelList}>
                <li>Client pilote mis en avant et activable</li>
                <li>Simple et Pro affichés comme à venir</li>
                <li>Aucune promesse détaillée sur un périmètre encore mouvant</li>
              </ul>
            </aside>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.pricingGrid}>
            {pricingPlans.map((plan) => (
              <OfferCard key={plan.slug} plan={plan} />
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Lecture rapide</div>
            <h2 className={styles.sectionTitle}>Ce qui est réellement ouvert aujourd’hui</h2>
          </div>
          <div className={styles.comparisonTableWrapper}>
            <table className={styles.comparisonTable}>
              <thead>
                <tr>
                  <th>Critère</th>
                  <th>Client pilote</th>
                  <th>Simple</th>
                  <th>Pro</th>
                </tr>
              </thead>
              <tbody>
                {pricingMatrix.map((row) => (
                  <tr key={row.label}>
                    <th>{row.label}</th>
                    {row.values.map((value) => (
                      <td key={value}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.ctaBand}>
          <div className={styles.ctaText}>
            <div className={styles.eyebrow}>Aujourd’hui</div>
            <h2 className={styles.sectionTitle}>Le bon CTA reste le programme client pilote.</h2>
            <p className={styles.sectionLead}>
              Si vous avez déjà des opérations concrètes à arbitrer ou à piloter,
              c’est la seule porte d’entrée actionnable maintenant.
            </p>
          </div>
          <div className={styles.actionRow}>
            <Link className={styles.buttonPrimary} href="/client-pilote">
              Découvrir le programme client pilote
            </Link>
            <Link className={styles.buttonGhost} href="/analyse-projet-immobilier">
              Voir les pages métier
            </Link>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
