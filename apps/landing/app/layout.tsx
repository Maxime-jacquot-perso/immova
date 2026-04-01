import type { Metadata } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import { defaultDescription, siteName, siteUrl } from './site-config';
import './globals.css';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: `Outil de pilotage projet immobilier pour decisions fiables | ${siteName}`,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    siteName,
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={ibmPlexSans.variable} lang="fr">
      <body>{children}</body>
    </html>
  );
}
