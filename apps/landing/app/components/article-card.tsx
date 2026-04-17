import Link from 'next/link';
import type { BlogPost } from '../content/blog-posts';
import { formatFrenchDate } from '../seo';
import styles from './marketing-ui.module.css';

type ArticleCardProps = {
  post: BlogPost;
  featured?: boolean;
};

export function ArticleCard({ post, featured = false }: ArticleCardProps) {
  const classes = [
    styles.articleCard,
    featured ? styles.articleCardFeatured : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Link className={classes} href={`/blog/${post.slug}`}>
      <div className={styles.articleMeta}>
        {post.category} · {formatFrenchDate(post.publishedAt)} · {post.readingTime}
      </div>
      <h3 className={styles.resourceTitle}>{post.title}</h3>
      <p className={styles.articleExcerpt}>{post.excerpt}</p>
      <span className={styles.buttonGhost}>Lire l’article</span>
    </Link>
  );
}
