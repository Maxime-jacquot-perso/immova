import type { Metadata } from 'next';
import { LegalDocumentPage } from '../legal/legal-document-page';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description:
    'Informations légales relatives à Axelys, solution éditée par REGERA.',
  alternates: {
    canonical: '/mentions-legales',
  },
};

export default function MentionsLegalesPage() {
  return <LegalDocumentPage documentType="MENTIONS_LEGALES" />;
}
