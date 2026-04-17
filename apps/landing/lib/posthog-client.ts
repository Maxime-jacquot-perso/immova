import posthog from 'posthog-js';

type PostHogPropertyValue = string | number | boolean;
export type AnalyticsConsentStatus = 'pending' | 'accepted' | 'rejected';

const ANALYTICS_CONSENT_STORAGE_KEY = 'axelys:analytics-consent';
const ANALYTICS_CONSENT_COOKIE_NAME = 'axelys_analytics_consent';
let analyticsInitialized = false;

export type LandingCtaLocation =
  | 'header'
  | 'hero'
  | 'middle'
  | 'footer'
  | 'form';

export type LandingScrollDepth = 25 | 50 | 75 | 100;

export type LandingSectionId =
  | 'hero'
  | 'problem'
  | 'solution'
  | 'proof'
  | 'pilot'
  | 'faq'
  | 'form';

export type LandingFormField =
  | 'firstname'
  | 'email'
  | 'profile_type'
  | 'project_count'
  | 'problem_description'
  | 'acknowledgement';

type LandingEventMap = {
  landing_viewed: undefined;
  landing_cta_clicked: {
    location: LandingCtaLocation;
    label: string;
    target: string;
  };
  landing_scroll_depth_reached: {
    depth: LandingScrollDepth;
  };
  landing_section_viewed: {
    section: LandingSectionId;
  };
  landing_form_started: {
    form_name: string;
  };
  landing_form_submitted: {
    form_name: string;
    profile_type?: string;
    project_count?: string;
  };
  landing_form_abandoned: {
    form_name: string;
    reason: 'page_hidden' | 'route_change' | 'inactive_timeout';
    last_field?: LandingFormField;
    profile_type?: string;
    project_count?: string;
  };
};

function compactProperties(
  properties: Record<string, PostHogPropertyValue | undefined>,
) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined && value !== ''),
  ) as Record<string, PostHogPropertyValue>;
}

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function resolveConsentValue(value: string | null | undefined): AnalyticsConsentStatus {
  if (value === 'accepted' || value === 'rejected') {
    return value;
  }

  return 'pending';
}

function initializeAnalytics() {
  if (analyticsInitialized) {
    if (posthog.has_opted_out_capturing()) {
      posthog.opt_in_capturing();
    }
    return;
  }

  const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

  if (!projectToken) {
    return;
  }

  posthog.init(projectToken, {
    api_host: '/ingest',
    ui_host: 'https://eu.posthog.com',
    defaults: '2026-01-30',
    capture_exceptions: true,
    debug: process.env.NODE_ENV === 'development',
  });
  analyticsInitialized = true;
}

export function getAnalyticsConsentStatus(): AnalyticsConsentStatus {
  if (!canUseBrowserStorage()) {
    return 'pending';
  }

  return resolveConsentValue(
    window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY),
  );
}

export function setAnalyticsConsentStatus(
  status: Exclude<AnalyticsConsentStatus, 'pending'>,
) {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, status);
  document.cookie = `${ANALYTICS_CONSENT_COOKIE_NAME}=${status}; path=/; max-age=15552000; samesite=lax`;

  if (status === 'accepted') {
    initializeAnalytics();
    return;
  }

  if (analyticsInitialized) {
    posthog.opt_out_capturing();
  }
}

export function initializeAnalyticsIfConsented() {
  if (getAnalyticsConsentStatus() === 'accepted') {
    initializeAnalytics();
  }
}

export function isAnalyticsEnabled() {
  return analyticsInitialized && getAnalyticsConsentStatus() === 'accepted';
}

export function captureLandingEvent<EventName extends keyof LandingEventMap>(
  eventName: EventName,
  properties?: LandingEventMap[EventName],
) {
  if (!isAnalyticsEnabled()) {
    return;
  }

  if (properties) {
    posthog.capture(
      eventName,
      compactProperties(
        properties as Record<string, PostHogPropertyValue | undefined>,
      ),
    );
    return;
  }

  posthog.capture(eventName);
}

export function getPostHogDistinctId() {
  if (!isAnalyticsEnabled()) {
    return '';
  }

  return posthog.get_distinct_id();
}
