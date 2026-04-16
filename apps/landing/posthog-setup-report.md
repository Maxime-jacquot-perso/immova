<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Axelys landing page. PostHog is initialized via `instrumentation-client.ts` (the recommended approach for Next.js 15.3+), enabling automatic pageview tracking, session replay, and error tracking out of the box. A reverse proxy is configured in `next.config.mjs` to route PostHog requests through `/ingest`, improving ad-blocker resilience. Server-side tracking is added to the pilot application API route using `posthog-node`.

| Event | Description | File |
|---|---|---|
| `pilot_application_submitted` | User successfully submitted the pilot access request form | `app/components/pilot-application-form.tsx` |
| `pilot_application_submit_failed` | Pilot access request form submission failed (network or validation error) | `app/components/pilot-application-form.tsx` |
| `pilot_application_received` | Server successfully received and forwarded a pilot application to the backend API | `app/api/pilot-applications/route.ts` |
| `pilot_application_api_error` | Server-side error when processing a pilot application (backend API failure) | `app/api/pilot-applications/route.ts` |
| `apply_page_viewed` | Captured automatically via PostHog pageview tracking for the `/apply` conversion page | (automatic) |

## Files created / modified

- **`instrumentation-client.ts`** (new) — PostHog client-side initialization
- **`next.config.mjs`** (modified) — Added `/ingest` reverse proxy rewrites and `skipTrailingSlashRedirect`
- **`lib/posthog-server.ts`** (new) — Singleton server-side PostHog client (`posthog-node`)
- **`app/components/pilot-application-form.tsx`** (modified) — Added `pilot_application_submitted` and `pilot_application_submit_failed` events
- **`app/api/pilot-applications/route.ts`** (modified) — Added `pilot_application_received` and `pilot_application_api_error` server-side events
- **`.env.local`** (created) — `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST`

## Action required

Run the following command from the monorepo root to install the PostHog packages:

```bash
pnpm add posthog-js posthog-node --filter @immo/landing
```

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://eu.posthog.com/project/160052/dashboard/624406
- **Pilot application conversion funnel**: https://eu.posthog.com/project/160052/insights/p5AC0mQn
- **Daily pilot applications submitted**: https://eu.posthog.com/project/160052/insights/g0G0fW0Z
- **Applications by profile type**: https://eu.posthog.com/project/160052/insights/aDdaTmsp
- **Application success vs failure rate**: https://eu.posthog.com/project/160052/insights/PER134FH
- **Applications by active project count**: https://eu.posthog.com/project/160052/insights/YCmGaORt

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
