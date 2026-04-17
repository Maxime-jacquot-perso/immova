'use client';

import { SpeedInsights } from '@vercel/speed-insights/next';
import { useEffect, useState } from 'react';
import {
  getAnalyticsConsentStatus,
  initializeAnalyticsIfConsented,
  setAnalyticsConsentStatus,
  type AnalyticsConsentStatus,
} from '../../lib/posthog-client';
import { LegalLinks } from './legal-links';
import styles from './cookie-consent-manager.module.css';

export function CookieConsentManager() {
  const [consentStatus, setConsentStatus] =
    useState<AnalyticsConsentStatus>(() => getAnalyticsConsentStatus());

  useEffect(() => {
    initializeAnalyticsIfConsented();
  }, []);

  const handleDecision = (
    nextStatus: Exclude<AnalyticsConsentStatus, 'pending'>,
  ) => {
    setAnalyticsConsentStatus(nextStatus);
    setConsentStatus(nextStatus);
  };

  return (
    <>
      {consentStatus === 'accepted' ? <SpeedInsights /> : null}
      {consentStatus === 'pending' ? (
        <aside
          aria-label="Consentement cookies"
          className={styles.banner}
          role="dialog"
        >
          <div>
            <h2 className={styles.title}>Cookies et mesure d’audience</h2>
            <p className={styles.copy}>
              La landing n’active des mesures d’audience et de performance
              non essentielles qu’après votre accord. Cela couvre notamment
              PostHog et Vercel Speed Insights.
            </p>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.button}
              onClick={() => handleDecision('accepted')}
              type="button"
            >
              Accepter
            </button>
            <button
              className={styles.buttonSecondary}
              onClick={() => handleDecision('rejected')}
              type="button"
            >
              Refuser
            </button>
          </div>

          <LegalLinks
            className={styles.links}
            documents={['PRIVACY_POLICY', 'MENTIONS_LEGALES']}
          />
        </aside>
      ) : null}
    </>
  );
}
