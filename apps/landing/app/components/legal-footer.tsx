import { appUrl, publisherName, siteName } from '../site-config';
import { LandingCtaLink } from './landing-cta-link';
import { LegalLinks } from './legal-links';

type LegalFooterProps = {
  ctaLocation: 'footer';
};

export function LegalFooter({ ctaLocation }: LegalFooterProps) {
  return (
    <>
      <p>
        {siteName} est une solution éditée par {publisherName}.{' '}
        <LandingCtaLink
          href={appUrl}
          location={ctaLocation}
          label="open_application"
          target={appUrl}
        >
          Ouvrir l’application
        </LandingCtaLink>
        .
      </p>
      <LegalLinks />
    </>
  );
}
