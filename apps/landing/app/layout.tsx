import type { Metadata } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import { CookieConsentManager } from './components/cookie-consent-manager';
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
    default: `Pilotage d’opérations immobilières pour décider sur des faits | ${siteName}`,
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
      <body>
        {children}
        <CookieConsentManager />
      </body>
    </html>
  );
}
