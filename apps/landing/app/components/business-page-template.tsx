import Link from 'next/link';
import type { BusinessPageContent } from '../content/business-pages';
import { businessPageList } from '../content/business-pages';
import { getRelatedBlogPosts } from '../content/blog-posts';
import { LandingCtaLink } from './landing-cta-link';
import { ArticleCard } from './article-card';
import styles from './marketing-ui.module.css';
import { SiteShell } from './site-shell';

type BusinessPageTemplateProps = {
  page: BusinessPageContent;
};

export function BusinessPageTemplate({
  page,
}: BusinessPageTemplateProps) {
  const relatedPosts = getRelatedBlogPosts(page.relatedBlogSlugs);
  const relatedPages = businessPageList.filter((item) => item.href !== page.path);

  return (
    <SiteShell currentPath={page.path}>
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
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
                  location="resource_page"
                  label="request_pilot_access"
                  target="/client-pilote"
                >
                  Demander un accès pilote
                </LandingCtaLink>
                <Link className={styles.buttonSecondary} href="/pricing">
                  Voir les offres
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
            <div className={styles.eyebrow}>Problème métier</div>
            <h2 className={styles.sectionTitle}>Pourquoi ce sujet mérite une vraie méthode</h2>
            <p className={styles.sectionLead}>
              Ces difficultés reviennent dès que la décision se prend sur des hypothèses
              dispersées ou un suivi trop fragmenté.
            </p>
          </div>
          <div className={styles.cardGrid}>
            {page.problemCards.map((item, index) => (
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

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Méthode</div>
            <h2 className={styles.sectionTitle}>Comment reprendre une lecture fiable</h2>
          </div>
          <div className={styles.editorialGrid}>
            <div className={styles.editorialMain}>
              {page.sections.map((section) => (
                <article className={styles.editorialSection} key={section.title}>
                  <div className={styles.prose}>
                    <h3>{section.title}</h3>
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {section.bullets ? (
                      <ul>
                        {section.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>

            <aside className={styles.sidebarCard}>
              <div className={styles.eyebrow}>À retenir</div>
              <h3 className={styles.sidebarTitle}>Le bon cadre aide à trancher.</h3>
              <p className={styles.sidebarText}>
                Un bon outil n’essaie pas d’impressionner. Il aide à comparer, à décider,
                puis à garder une base claire pour la suite du projet.
              </p>
              <ul className={styles.sidebarList}>
                <li>Comparer plusieurs dossiers avec la même grille</li>
                <li>Éviter les angles morts avant de s’engager</li>
                <li>Garder une base exploitable pour le suivi réel</li>
              </ul>
            </aside>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Aller plus loin</div>
            <h2 className={styles.sectionTitle}>Ressources liées</h2>
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
            <h2 className={styles.sectionTitle}>Voir si Axelys est pertinent sur vos opérations réelles</h2>
            <p className={styles.sectionLead}>
              Le programme client pilote est la seule offre ouverte aujourd’hui. Simple
              et Pro restent visibles, mais à venir.
            </p>
          </div>
          <div className={styles.actionRow}>
            <LandingCtaLink
              className={styles.buttonPrimary}
              href="/client-pilote"
              location="resource_page"
              label="open_client_pilot_page"
              target="/client-pilote"
            >
              Demander un accès
            </LandingCtaLink>
            <Link className={styles.buttonGhost} href="/pricing">
              Consulter les offres
            </Link>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
