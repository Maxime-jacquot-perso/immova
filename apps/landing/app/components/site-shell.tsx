import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { LandingCtaLocation } from '../../lib/posthog-client';
import { appUrl, siteName } from '../site-config';
import {
  footerLinkGroups,
  marketingNavigation,
} from '../content/marketing-content';
import { LandingCtaLink } from './landing-cta-link';
import { LegalLinks } from './legal-links';
import styles from './marketing-ui.module.css';

type SiteShellProps = {
  children: ReactNode;
  currentPath: string;
  ctaHref?: string;
  ctaLabel?: string;
  ctaLocation?: LandingCtaLocation;
  ctaTrackingLabel?: string;
  ctaTarget?: string;
};

function isActivePath(currentPath: string, href: string, matches?: string[]) {
  if (currentPath === href) {
    return true;
  }

  return (
    matches?.some(
      (match) => currentPath === match || currentPath.startsWith(`${match}/`),
    ) ?? false
  );
}

export function SiteShell({
  children,
  currentPath,
  ctaHref = '/client-pilote',
  ctaLabel = 'Demander un accès',
  ctaLocation = 'header',
  ctaTrackingLabel = 'open_client_pilot_page',
  ctaTarget,
}: SiteShellProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.glowLeft} />
      <div className={styles.glowRight} />

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/">
            <Image
              src="/logo-text-bleu.svg"
              alt={siteName}
              width={220}
              height={44}
              priority
            />
          </Link>

          <nav className={styles.nav} aria-label="Navigation principale">
            {marketingNavigation.map((item) => {
              const isActive = isActivePath(currentPath, item.href, item.matches);
              return (
                <Link
                  className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`.trim()}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className={styles.headerActions}>
            <Link className={styles.loginLink} href={appUrl}>
              Se connecter
            </Link>
            <LandingCtaLink
              className={styles.buttonPrimary}
              href={ctaHref}
              location={ctaLocation}
              label={ctaTrackingLabel}
              target={ctaTarget ?? ctaHref}
            >
              {ctaLabel}
            </LandingCtaLink>
          </div>
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div className={styles.footerIntro}>
            <div className={styles.eyebrow}>Axelys</div>
            <h2 className={styles.sectionTitle}>
              Outil de décision et de pilotage immobilier.
            </h2>
            <p className={styles.footerCopy}>
              Le site public explique les usages, le programme client pilote et
              les ressources métier. Le simulateur détaillé, les comparaisons
              privées et la logique de conversion restent dans l’application.
            </p>
            <div className={styles.actionRow}>
              <LandingCtaLink
                className={styles.buttonPrimary}
                href="/client-pilote"
                location="footer"
                label="footer_request_pilot_access"
                target="/client-pilote"
              >
                Demander un accès pilote
              </LandingCtaLink>
              <Link className={styles.buttonGhost} href="/pricing">
                Voir les offres
              </Link>
            </div>
            <div className={styles.footerLegal}>
              <p className={styles.footerMeta}>
                Besoin d’ouvrir l’application privée ?{' '}
                <Link href={appUrl}>Se connecter</Link>.
              </p>
              <LegalLinks />
            </div>
          </div>

          {footerLinkGroups.map((group) => (
            <div key={group.title}>
              <h3 className={styles.footerColumnTitle}>{group.title}</h3>
              <ul className={styles.footerList}>
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
