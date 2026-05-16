import Link from 'next/link';
import { SiteShell } from '../components/site-shell';
import { ToolCard } from '../components/tool-card';
import styles from '../components/marketing-ui.module.css';
import { businessPageList } from '../content/business-pages';
import { toolPageList } from '../content/tool-pages';
import { buildMetadata } from '../seo';

export const metadata = buildMetadata({
  title: 'Outils immobiliers simples',
  description:
    'Découvrez les outils Axelys pour calculer une rentabilité locative, estimer des frais de notaire, lire un cashflow immobilier et lancer une simulation locative simplifiée.',
  path: '/outils',
  keywords: [
    'outils immobiliers',
    'calculateur rentabilité locative',
    'simulation investissement locatif',
  ],
});

export default function OutilsPage() {
  return (
    <SiteShell currentPath="/outils">
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <div className={styles.eyebrow}>Outils immobiliers</div>
              <h1 className={styles.heroTitle}>
                Des calculateurs immobiliers utiles pour aller vite sur l’essentiel.
              </h1>
              <p className={styles.heroLead}>
                Retrouvez ici des calculateurs simples pour estimer rapidement une
                rentabilité, des frais de notaire, un cashflow ou une simulation locative.
              </p>
              <ul className={styles.highlightList}>
                <li>Des repères rapides après une visite, une annonce ou une négociation</li>
                <li>Des chiffres lisibles pour comparer un dossier sans perdre de temps</li>
                <li>Des guides métier et un accès Axelys si vous voulez aller plus loin</li>
              </ul>
              <div className={styles.actionRow}>
                <Link className={styles.buttonPrimary} href="/client-pilote">
                  Découvrir Axelys
                </Link>
                <Link className={styles.buttonSecondary} href="/analyse-projet-immobilier">
                  Lire nos guides métier
                </Link>
              </div>
            </div>

            <aside className={styles.heroPanel}>
              <p className={styles.kicker}>À savoir</p>
              <h2 className={styles.panelTitle}>
                Des repères utiles avant d’engager du temps ou de l’argent.
              </h2>
              <p className={styles.panelBody}>
                Ces outils vous aident à filtrer une opportunité, comparer plusieurs biens
                et préparer une décision plus sereinement.
              </p>
              <ul className={styles.panelList}>
                <li>Rentabilité, frais, cashflow et simulation locative</li>
                <li>Des calculs rapides à relire avec votre propre contexte</li>
                <li>Une suite possible avec Axelys si le projet mérite plus d’analyse</li>
              </ul>
            </aside>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Calculs</div>
            <h2 className={styles.sectionTitle}>Tous les outils disponibles</h2>
          </div>
          <div className={styles.resourceGrid}>
            {toolPageList.map((tool) => (
              <ToolCard key={tool.href} tool={tool} />
            ))}
          </div>
        </section>

        <section className={styles.sectionMuted}>
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Méthode</div>
            <h2 className={styles.sectionTitle}>Des estimations simples à relire avec méthode</h2>
            <p className={styles.sectionLead}>
              Ces calculateurs donnent un ordre de grandeur utile. Ils ne remplacent ni
              l’analyse complète d’un dossier ni les vérifications propres à votre
              situation.
            </p>
          </div>
          <div className={styles.cardGrid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>Aller vite sur l’essentiel</h3>
              <p className={styles.cardText}>
                Obtenez un premier repère après une visite, une annonce ou une négociation.
              </p>
            </article>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>Garder la bonne distance</h3>
              <p className={styles.cardText}>
                Un bon chiffre d’appel ne suffit pas : charges, vacance, fiscalité,
                financement ou travaux peuvent changer la décision.
              </p>
            </article>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>Approfondir au bon moment</h3>
              <p className={styles.cardText}>
                Si le dossier tient la route, Axelys vous aide ensuite à comparer,
                arbitrer et suivre l’opération plus finement.
              </p>
            </article>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Guides métier</div>
            <h2 className={styles.sectionTitle}>Continuer avec une lecture plus structurée</h2>
          </div>
          <div className={styles.resourceGrid}>
            {businessPageList.map((page) => (
              <Link className={styles.resourceCard} href={page.href} key={page.href}>
                <p className={styles.resourceMeta}>Guide métier</p>
                <h3 className={styles.resourceTitle}>{page.title}</h3>
                <p className={styles.resourceDescription}>{page.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.ctaBand}>
          <div className={styles.ctaText}>
            <div className={styles.eyebrow}>Axelys</div>
            <h2 className={styles.sectionTitle}>
              Passer du calcul simple à la décision puis au pilotage
            </h2>
            <p className={styles.sectionLead}>
              Commencez par une estimation rapide, puis passez à une analyse plus complète
              quand il faut comparer plusieurs biens, négocier une offre ou suivre une
              opération réelle.
            </p>
          </div>
          <div className={styles.actionRow}>
            <Link className={styles.buttonPrimary} href="/client-pilote">
              Découvrir le programme client pilote
            </Link>
            <Link className={styles.buttonGhost} href="/blog">
              Lire le blog
            </Link>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
