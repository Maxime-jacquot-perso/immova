import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Demande d’accès client pilote',
  description:
    'Formulaire de demande d’accès au programme client pilote Axelys pour investisseurs immobiliers actifs et marchands de biens.',
  alternates: {
    canonical: '/apply',
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
