import type { Metadata } from 'next';
import { LegalDocumentPage } from '../legal/legal-document-page';

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente',
  description:
    'Conditions générales de vente des offres payantes Axelys éditées par REGERA.',
  alternates: {
    canonical: '/cgv',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function CgvPage() {
  return <LegalDocumentPage documentType="CGV" />;
}
