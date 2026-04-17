import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticlePageTemplate } from '../../components/article-page-template';
import { blogPosts, getBlogPostBySlug } from '../../content/blog-posts';
import { buildMetadata } from '../../seo';

type BlogArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return buildMetadata({
      title: 'Article introuvable',
      path: `/blog/${slug}`,
    });
  }

  return buildMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    keywords: post.keywords,
    type: 'article',
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
  });
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return <ArticlePageTemplate post={post} />;
}
