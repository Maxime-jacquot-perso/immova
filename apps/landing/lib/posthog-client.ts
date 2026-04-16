import posthog from 'posthog-js';

type PostHogPropertyValue = string | number | boolean;

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

export function captureLandingEvent<EventName extends keyof LandingEventMap>(
  eventName: EventName,
  properties?: LandingEventMap[EventName],
) {
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
  return posthog.get_distinct_id();
}
