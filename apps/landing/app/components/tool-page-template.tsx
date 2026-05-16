import Link from 'next/link';
import { getRelatedBlogPosts } from '../content/blog-posts';
import type { ToolPageContent } from '../content/tool-pages';
import { businessPageList } from '../content/business-pages';
import { buildBreadcrumbSchema } from '../seo';
import { ArticleCard } from './article-card';
import { JsonLd } from './json-ld';
import { LandingCtaLink } from './landing-cta-link';
import styles from './marketing-ui.module.css';
import { SiteShell } from './site-shell';
import { ToolCalculator } from './tool-calculators';

type ToolPageTemplateProps = {
  page: ToolPageContent;
};

export function ToolPageTemplate({ page }: ToolPageTemplateProps) {
  const relatedPages = businessPageList.filter((item) =>
    page.relatedPagePaths.includes(item.href),
  );
  const relatedPosts = getRelatedBlogPosts(page.relatedBlogSlugs);

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Accueil', path: '/' },
    { name: 'Outils', path: '/outils' },
    { name: page.title, path: page.path },
  ]);

  return (
    <SiteShell currentPath="/outils">
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <div className={styles.breadcrumbRow}>
                <Link className={styles.breadcrumb} href="/">
                  Accueil
                </Link>
                <span className={styles.breadcrumbSeparator}>/</span>
                <Link className={styles.breadcrumb} href="/outils">
                  Outils
                </Link>
              </div>
              <div className={styles.eyebrow}>{page.eyebrow}</div>
              <h1 className={styles.heroTitle}>{page.heroTitle}</h1>
              <p className={styles.heroLead}>{page.heroLead}</p>
              <ul className={styles.highlightList}>
                {page.heroPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <div className={styles.actionRow}>
                <LandingCtaLink
                  className={styles.buttonPrimary}
                  href="/client-pilote"
                  label="open_client_pilot_page"
                  location="resource_page"
                  target="/client-pilote"
                >
                  Découvrir Axelys
                </LandingCtaLink>
                <Link className={styles.buttonSecondary} href="/outils">
                  Voir tous les outils
                </Link>
              </div>
            </div>

            <aside className={styles.heroPanel}>
              <p className={styles.kicker}>Repère utile</p>
              <h2 className={styles.panelTitle}>{page.sidebarTitle}</h2>
              <p className={styles.panelBody}>{page.sidebarBody}</p>
              <ul className={styles.panelList}>
                {page.sidebarPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Calculateur</div>
            <h2 className={styles.sectionTitle}>{page.calculator.title}</h2>
            <p className={styles.sectionLead}>{page.calculator.description}</p>
          </div>
          <div className={styles.calculatorPanel}>
            <ToolCalculator kind={page.calculator.kind} />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Lecture</div>
            <h2 className={styles.sectionTitle}>{page.pedagogy.title}</h2>
          </div>
          <article className={styles.editorialSection}>
            <div className={styles.prose}>
              {page.pedagogy.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {page.pedagogy.bullets ? (
                <ul>
                  {page.pedagogy.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </article>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Prudence</div>
            <h2 className={styles.sectionTitle}>{page.limits.title}</h2>
          </div>
          <article className={styles.editorialSection}>
            <div className={styles.prose}>
              {page.limits.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <ul>
                {page.limits.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>
          </article>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Axelys</div>
            <h2 className={styles.sectionTitle}>{page.axelys.title}</h2>
          </div>
          <div className={styles.editorialGrid}>
            <article className={styles.editorialSection}>
              <div className={styles.prose}>
                {page.axelys.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                <ul>
                  {page.axelys.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
            </article>

            <aside className={styles.sidebarCard}>
              <div className={styles.eyebrow}>Important</div>
              <h3 className={styles.sidebarTitle}>
                Un repère utile, pas un verdict.
              </h3>
              <p className={styles.sidebarText}>
                Ces estimations aident à relire un dossier plus vite et à éviter les
                conclusions trop rapides. Elles gagnent en valeur quand elles sont
                replacées dans une analyse complète du projet.
              </p>
              <ul className={styles.sidebarList}>
                <li>Comparer plus vite plusieurs opportunités</li>
                <li>Voir plus tôt ce qui fragilise un dossier</li>
                <li>Décider avec davantage de contexte</li>
              </ul>
            </aside>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Ressources liées</div>
            <h2 className={styles.sectionTitle}>Pages et articles pour approfondir</h2>
            <p className={styles.sectionLead}>
              Retrouvez ici des explications métier et des articles pour replacer ce
              calcul dans une décision immobilière plus large.
            </p>
          </div>
          <div className={styles.resourceGrid}>
            {relatedPages.map((item) => (
              <Link className={styles.resourceCard} href={item.href} key={item.href}>
                <p className={styles.resourceMeta}>Guide métier</p>
                <h3 className={styles.resourceTitle}>{item.title}</h3>
                <p className={styles.resourceDescription}>{item.description}</p>
              </Link>
            ))}
          </div>
          <div className={styles.articleGrid}>
            {relatedPosts.map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
        </section>

        <section className={styles.ctaBand}>
          <div className={styles.ctaText}>
            <div className={styles.eyebrow}>Programme client pilote</div>
            <h2 className={styles.sectionTitle}>
              Aller plus loin quand vous avez de vrais dossiers à arbitrer
            </h2>
            <p className={styles.sectionLead}>
              Commencez par cette estimation, puis passez à une analyse plus complète si
              vous devez comparer plusieurs biens, négocier une offre ou suivre une
              opération réelle.
            </p>
          </div>
          <div className={styles.actionRow}>
            <LandingCtaLink
              className={styles.buttonPrimary}
              href="/client-pilote"
              label="open_client_pilot_page"
              location="footer"
              target="/client-pilote"
            >
              Demander un accès
            </LandingCtaLink>
            <Link className={styles.buttonGhost} href="/pricing">
              Voir les offres
            </Link>
          </div>
        </section>
      </div>

      <JsonLd data={breadcrumbSchema} />
    </SiteShell>
  );
}
