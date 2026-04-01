import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Demande d\'accès client pilote',
  description: 'Rejoignez les 15 premiers clients pilotes d\'Axelys et participez à la construction de l\'outil de pilotage projet immobilier.',
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
