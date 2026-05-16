import type { MetadataRoute } from 'next';
import { blogPosts } from './content/blog-posts';
import { businessPageList } from './content/business-pages';
import { publicPageEntries } from './content/public-pages';
import { toolPageList } from './content/tool-pages';
import { absoluteUrl } from './seo';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...publicPageEntries.map((page) => ({
      url: absoluteUrl(page.path),
      lastModified: new Date(`${page.updatedAt}T00:00:00.000Z`),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...businessPageList.map((page) => ({
      url: absoluteUrl(page.href),
      lastModified: new Date(`${page.updatedAt}T00:00:00.000Z`),
      changeFrequency: 'monthly' as const,
      priority: 0.86,
    })),
    ...toolPageList.map((page) => ({
      url: absoluteUrl(page.href),
      lastModified: new Date(`${page.updatedAt}T00:00:00.000Z`),
      changeFrequency: 'monthly' as const,
      priority: 0.82,
    })),
    ...blogPosts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(`${post.updatedAt}T00:00:00.000Z`),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
  ];
}
