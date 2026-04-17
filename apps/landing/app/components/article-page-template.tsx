import Link from 'next/link';
import type { BlogPost } from '../content/blog-posts';
import { businessPageList } from '../content/business-pages';
import { getRelatedBlogPosts } from '../content/blog-posts';
import { absoluteUrl, formatFrenchDate } from '../seo';
import { LandingCtaLink } from './landing-cta-link';
import { ArticleCard } from './article-card';
import styles from './marketing-ui.module.css';
import { SiteShell } from './site-shell';

type ArticlePageTemplateProps = {
  post: BlogPost;
};

export function ArticlePageTemplate({ post }: ArticlePageTemplateProps) {
  const relatedPages = businessPageList.filter((page) =>
    post.relatedPagePaths.includes(page.href),
  );
  const relatedPosts = getRelatedBlogPosts(post.relatedPostSlugs);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: 'fr-FR',
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    author: {
      '@type': 'Organization',
      name: 'Axelys',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Axelys',
    },
  };

  return (
    <SiteShell currentPath="/blog">
      <div className={styles.page}>
        <section className={styles.articleHero}>
          <div className={styles.breadcrumbRow}>
            <Link className={styles.breadcrumb} href="/blog">
              Blog
            </Link>
            <span className={styles.quickMetaItem}>{post.category}</span>
          </div>
          <h1 className={styles.articleTitle}>{post.title}</h1>
          <p className={styles.heroLead}>{post.description}</p>
          <div className={styles.metaRow}>
            <span>Publié le {formatFrenchDate(post.publishedAt)}</span>
            <span>Mis à jour le {formatFrenchDate(post.updatedAt)}</span>
            <span>{post.readingTime}</span>
          </div>
        </section>

        <div className={styles.articleLayout}>
          <article className={styles.articleBody}>
            <section className={styles.editorialSection}>
              <div className={styles.prose}>
                {post.intro.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>

            {post.sections.map((section) => (
              <section className={styles.editorialSection} key={section.title}>
                <div className={styles.prose}>
                  <h2>{section.title}</h2>
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
              </section>
            ))}
          </article>

          <aside className={styles.sidebarCard}>
            <div className={styles.eyebrow}>Pour aller plus loin</div>
            <h2 className={styles.sidebarTitle}>Relier la lecture à l’usage réel</h2>
            <p className={styles.sidebarText}>
              Ces sujets prennent vraiment de la valeur quand ils servent à comparer,
              décider et suivre un projet concret.
            </p>
            <ul className={styles.sidebarList}>
              {relatedPages.map((page) => (
                <li key={page.href}>
                  <Link href={page.href}>{page.title}</Link>
                </li>
              ))}
            </ul>
            <LandingCtaLink
              className={styles.buttonPrimary}
              href="/client-pilote"
              location="blog"
              label="request_pilot_access_from_blog"
              target="/client-pilote"
            >
              Demander un accès pilote
            </LandingCtaLink>
          </aside>
        </div>

        {relatedPosts.length ? (
          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <div className={styles.eyebrow}>À lire ensuite</div>
              <h2 className={styles.sectionTitle}>Articles liés</h2>
            </div>
            <div className={styles.articleGrid}>
              {relatedPosts.map((relatedPost) => (
                <ArticleCard key={relatedPost.slug} post={relatedPost} />
              ))}
            </div>
          </section>
        ) : null}

        <section className={styles.ctaBand}>
          <div className={styles.ctaText}>
            <div className={styles.eyebrow}>Axelys</div>
            <h2 className={styles.sectionTitle}>Voir si Axelys convient à vos opérations</h2>
            <p className={styles.sectionLead}>
              Si vous avez des dossiers concrets à arbitrer ou à suivre, le programme
              client pilote est le bon point d’entrée aujourd’hui.
            </p>
          </div>
          <div className={styles.actionRow}>
            <LandingCtaLink
              className={styles.buttonPrimary}
              href="/client-pilote"
              location="blog"
              label="open_client_pilot_page"
              target="/client-pilote"
            >
              Découvrir le programme client pilote
            </LandingCtaLink>
            <Link className={styles.buttonGhost} href="/pricing">
              Voir les offres
            </Link>
          </div>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema),
        }}
      />
    </SiteShell>
  );
}
