import { BusinessPageTemplate } from '../components/business-page-template';
import { businessPages } from '../content/business-pages';
import { buildMetadata } from '../seo';

const page = businessPages.profitabilityAnalysis;

export const metadata = buildMetadata({
  title: page.title,
  description: page.description,
  path: page.path,
  keywords: ['analyse rentabilité immobilière', 'rentabilité projet immobilier', 'décision investissement immobilier'],
});

export default function AnalyseRentabiliteImmobilierePage() {
  return <BusinessPageTemplate page={page} />;
}
