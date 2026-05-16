import { ArticleCard } from '../components/article-card';
import { SiteShell } from '../components/site-shell';
import { ToolCard } from '../components/tool-card';
import styles from '../components/marketing-ui.module.css';
import { blogPosts } from '../content/blog-posts';
import { toolPageList } from '../content/tool-pages';
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
              <h1 className={styles.heroTitle}>Des articles pour mieux décider et mieux piloter.</h1>
              <p className={styles.heroLead}>
                Le blog Axelys traite des sujets qui reviennent sur le terrain : analyser
                un projet, lire une rentabilité sérieusement, repérer une dérive et garder
                une vision claire quand plusieurs opérations avancent en parallèle.
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

        <section className={styles.sectionMuted}>
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Outils publics</div>
            <h2 className={styles.sectionTitle}>Chiffrer rapidement un projet immobilier.</h2>
            <p className={styles.sectionLead}>
              Obtenez un premier ordre de grandeur sur la rentabilité, les frais de
              notaire, le cashflow ou un projet locatif, puis approfondissez si le dossier
              le mérite.
            </p>
          </div>
          <div className={styles.resourceGrid}>
            {toolPageList.map((tool) => (
              <ToolCard key={tool.href} tool={tool} />
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
