import type { Metadata } from 'next';
import { defaultDescription, siteName, siteUrl } from './site-config';

type BuildMetadataInput = {
  title: string;
  description?: string;
  path?: string;
  keywords?: string[];
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
};

export function buildMetadata({
  title,
  description = defaultDescription,
  path = '/',
  keywords,
  type = 'website',
  publishedTime,
  modifiedTime,
}: BuildMetadataInput): Metadata {
  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: path,
      type,
      siteName,
      locale: 'fr_FR',
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export function absoluteUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, siteUrl).toString();
}

export function formatFrenchDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00Z`));
}
