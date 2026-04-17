import type { MetadataRoute } from 'next';
import { blogPosts } from './content/blog-posts';
import { absoluteUrl } from './seo';

const staticPages = [
  { path: '/', priority: 1, changeFrequency: 'weekly' as const },
  { path: '/pricing', priority: 0.9, changeFrequency: 'weekly' as const },
  { path: '/client-pilote', priority: 0.95, changeFrequency: 'weekly' as const },
  {
    path: '/analyse-rentabilite-immobiliere',
    priority: 0.86,
    changeFrequency: 'monthly' as const,
  },
  {
    path: '/analyse-projet-immobilier',
    priority: 0.86,
    changeFrequency: 'monthly' as const,
  },
  {
    path: '/pilotage-operation-immobiliere',
    priority: 0.86,
    changeFrequency: 'monthly' as const,
  },
  { path: '/blog', priority: 0.85, changeFrequency: 'weekly' as const },
  { path: '/mentions-legales', priority: 0.35, changeFrequency: 'yearly' as const },
  { path: '/cgu', priority: 0.35, changeFrequency: 'yearly' as const },
  { path: '/cgv', priority: 0.35, changeFrequency: 'yearly' as const },
  {
    path: '/politique-de-confidentialite',
    priority: 0.35,
    changeFrequency: 'yearly' as const,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...staticPages.map((page) => ({
      url: absoluteUrl(page.path),
      lastModified: new Date('2026-04-17T00:00:00.000Z'),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...blogPosts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(`${post.updatedAt}T00:00:00.000Z`),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
  ];
}
