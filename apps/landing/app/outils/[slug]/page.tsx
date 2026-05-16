import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ToolPageTemplate } from '../../components/tool-page-template';
import { getToolPageBySlug, toolPageList } from '../../content/tool-pages';
import { buildMetadata } from '../../seo';

type ToolPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  return toolPageList.map((tool) => ({
    slug: tool.href.replace('/outils/', ''),
  }));
}

export async function generateMetadata({
  params,
}: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getToolPageBySlug(slug);

  if (!page) {
    return buildMetadata({
      title: 'Outil introuvable',
      path: `/outils/${slug}`,
    });
  }

  return buildMetadata({
    title: page.title,
    description: page.description,
    path: page.path,
    keywords: page.keywords,
  });
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const page = getToolPageBySlug(slug);

  if (!page) {
    notFound();
  }

  return <ToolPageTemplate page={page} />;
}
