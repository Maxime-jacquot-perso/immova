import type { Metadata } from 'next';
import { LegalDocumentPage } from '../legal/legal-document-page';

export const metadata: Metadata = {
  title: 'Conditions Générales d’Utilisation',
  description:
    'Conditions générales d’utilisation de la plateforme Axelys éditée par REGERA.',
  alternates: {
    canonical: '/cgu',
  },
};

export default function CguPage() {
  return <LegalDocumentPage documentType="CGU" />;
}
