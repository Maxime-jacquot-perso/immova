import { BusinessPageTemplate } from '../components/business-page-template';
import { businessPages } from '../content/business-pages';
import { buildMetadata } from '../seo';

const page = businessPages.operationsPilotage;

export const metadata = buildMetadata({
  title: page.title,
  description: page.description,
  path: page.path,
  keywords: ['pilotage opération immobilière', 'suivi projet immobilier', 'alerte dérive projet immobilier'],
});

export default function PilotageOperationImmobilierePage() {
  return <BusinessPageTemplate page={page} />;
}
