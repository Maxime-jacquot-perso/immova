import type { Metadata } from 'next';
import { LegalDocumentPage } from '../legal/legal-document-page';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description:
    'Politique de confidentialité applicable au site et à la plateforme Axelys, édités par REGERA.',
  alternates: {
    canonical: '/politique-de-confidentialite',
  },
};

export default function PolitiqueConfidentialitePage() {
  return <LegalDocumentPage documentType="PRIVACY_POLICY" />;
}
