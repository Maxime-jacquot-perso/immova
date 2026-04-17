import { BusinessPageTemplate } from '../components/business-page-template';
import { businessPages } from '../content/business-pages';
import { buildMetadata } from '../seo';

const page = businessPages.projectAnalysis;

export const metadata = buildMetadata({
  title: page.title,
  description: page.description,
  path: page.path,
  keywords: ['analyse projet immobilier', 'outil décision immobilier', 'comparaison opportunités immobilières'],
});

export default function AnalyseProjetImmobilierPage() {
  return <BusinessPageTemplate page={page} />;
}
