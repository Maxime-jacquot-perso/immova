import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Formulaire client pilote',
  description:
    'Page utilitaire non indexée pour déposer une demande d’accès au programme client pilote Axelys.',
  alternates: {
    canonical: '/client-pilote',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
