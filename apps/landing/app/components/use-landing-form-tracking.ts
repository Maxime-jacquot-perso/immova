'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  captureLandingEvent,
  type LandingFormField,
} from '../../lib/posthog-client';

const FORM_INACTIVITY_TIMEOUT_MS = 60_000;

type LandingFormProperties = {
  profile_type?: string;
  project_count?: string;
};

type UseLandingFormTrackingOptions = {
  enabled: boolean;
  formName: string;
  getProperties: () => LandingFormProperties;
};

export function useLandingFormTracking({
  enabled,
  formName,
  getProperties,
}: UseLandingFormTrackingOptions) {
  const startedRef = useRef(false);
  const submittedRef = useRef(false);
  const abandonedRef = useRef(false);
  const lastFieldRef = useRef<LandingFormField | undefined>(undefined);
  const inactivityTimeoutRef = useRef<number | null>(null);
  const getPropertiesRef = useRef(getProperties);

  useEffect(() => {
    getPropertiesRef.current = getProperties;
  }, [getProperties]);

  const clearInactivityTimeout = useCallback(() => {
    if (inactivityTimeoutRef.current !== null) {
      window.clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
  }, []);

  const buildProperties = useCallback(
    () => ({
      form_name: formName,
      ...getPropertiesRef.current(),
    }),
    [formName],
  );

  const trackAbandon = useCallback(
    (reason: 'page_hidden' | 'route_change' | 'inactive_timeout') => {
      if (
        !enabled ||
        !startedRef.current ||
        submittedRef.current ||
        abandonedRef.current
      ) {
        return;
      }

      abandonedRef.current = true;
      clearInactivityTimeout();
      captureLandingEvent('landing_form_abandoned', {
        ...buildProperties(),
        reason,
        last_field: lastFieldRef.current,
      });
    },
    [buildProperties, clearInactivityTimeout, enabled],
  );

  const scheduleInactivityCheck = () => {
    if (!enabled || !startedRef.current || submittedRef.current) {
      return;
    }

    clearInactivityTimeout();
    inactivityTimeoutRef.current = window.setTimeout(() => {
      trackAbandon('inactive_timeout');
    }, FORM_INACTIVITY_TIMEOUT_MS);
  };

  const registerInteraction = (field?: LandingFormField) => {
    if (!enabled) {
      return;
    }

    if (field) {
      lastFieldRef.current = field;
    }

    if (!startedRef.current) {
      startedRef.current = true;
      captureLandingEvent('landing_form_started', {
        form_name: formName,
      });
    }

    scheduleInactivityCheck();
  };

  const markSubmitted = () => {
    if (!enabled) {
      return;
    }

    submittedRef.current = true;
    clearInactivityTimeout();
    captureLandingEvent('landing_form_submitted', buildProperties());
  };

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const handlePageHide = () => {
      trackAbandon('page_hidden');
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackAbandon('page_hidden');
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      trackAbandon('route_change');
      clearInactivityTimeout();
    };
  }, [clearInactivityTimeout, enabled, trackAbandon]);

  return {
    registerInteraction,
    markSubmitted,
  };
}
