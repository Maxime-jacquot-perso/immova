import { ArticleCard } from '../components/article-card';
import { SiteShell } from '../components/site-shell';
import styles from '../components/marketing-ui.module.css';
import { blogPosts } from '../content/blog-posts';
import { buildMetadata } from '../seo';

export const metadata = buildMetadata({
  title: 'Blog',
  description:
    'Articles Axelys sur l’analyse de projet immobilier, la rentabilité, le pilotage d’opérations et les limites des approches dispersées.',
  path: '/blog',
  keywords: ['blog immobilier professionnel', 'analyse projet immobilier blog', 'pilotage immobilier contenu'],
});

export default function BlogIndexPage() {
  const [featuredPost, ...otherPosts] = blogPosts;

  return (
    <SiteShell currentPath="/blog">
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <div className={styles.eyebrow}>Blog</div>
              <h1 className={styles.heroTitle}>Un contenu SEO utile pour mieux décider et mieux piloter.</h1>
              <p className={styles.heroLead}>
                Le blog Axelys traite des sujets métier qui comptent vraiment:
                analyser un projet, lire une rentabilité sérieusement, repérer
                une dérive et centraliser l’information sans transformer le site
                public en outil métier ouvert.
              </p>
            </div>
            <ArticleCard post={featuredPost} featured />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Articles</div>
            <h2 className={styles.sectionTitle}>Tous les articles</h2>
          </div>
          <div className={styles.articleGrid}>
            {otherPosts.map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
