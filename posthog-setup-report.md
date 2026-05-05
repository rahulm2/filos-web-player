<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Filos cookalong web player.

## Summary of changes

- **`instrumentation-client.ts`** (new): Initializes the PostHog JS SDK using `instrumentation-client.ts` (Next.js 15.3+ pattern). Configured with a reverse proxy at `/ingest`, exception capture enabled, and debug mode in development.
- **`next.config.ts`**: Added PostHog reverse proxy rewrites (`/ingest/static/*`, `/ingest/array/*`, `/ingest/*`) and `skipTrailingSlashRedirect: true` to correctly route PostHog requests.
- **`.env.local`**: Created with `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` environment variables.
- **`src/hooks/useAnalytics.ts`**: Updated `track()` to call `posthog.capture()` directly (replacing the previous console-log-only stub). Updated `useAbandonTracking` to use `posthog.capture("session_abandon", ...)` on page hide/visibility change.
- **`src/components/CookalongPlayer.tsx`**: Added `session_complete` tracking when the pacing state reaches `COMPLETE`, and `phase_start` tracking at the first chunk of each new phase.
- **`src/components/PreCookScreen.tsx`**: Added `cta_tapped` event when the user taps "Start cooking with [creator]", capturing `recipe_title` and `creator` properties.
- **`src/app/api/track/route.ts`**: Implemented the previously-stubbed PostHog REST API forwarding (edge-compatible, no posthog-node dependency needed).

## Events

| Event | Description | File |
|---|---|---|
| `session_start` | User confirms and starts a cookalong session | `src/hooks/useAnalytics.ts` (via `posthog.capture`) |
| `session_complete` | User finishes all phases of the recipe | `src/components/CookalongPlayer.tsx` |
| `session_abandon` | User leaves mid-session (page hidden or unloaded) | `src/hooks/useAnalytics.ts` (`useAbandonTracking`) |
| `cta_tapped` | User taps the "Start cooking with X" CTA button | `src/components/PreCookScreen.tsx` |
| `gate_enter` | Audio playback reaches a gated step requiring manual tap | `src/components/CookalongPlayer.tsx` |
| `gate_advance` | User taps Next to advance past a gate | `src/components/CookalongPlayer.tsx` |
| `phase_start` | A new cooking phase begins (Prep, Cook, Plate, etc.) | `src/components/CookalongPlayer.tsx` |
| `survey_response` | User selects an answer on the post-cook survey | `src/components/CompleteScreen.tsx` |
| `email_submit` | User submits their email for future recipe notifications | `src/components/CompleteScreen.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/410858/dashboard/1547172
- **Session Conversion Funnel** (CTA tap → start → complete): https://us.posthog.com/project/410858/insights/2mSd3qzn
- **Daily Session Activity** (starts, completions, abandons over time): https://us.posthog.com/project/410858/insights/m90QaK0T
- **Gate Engagement Rate** (gates entered vs gates advanced): https://us.posthog.com/project/410858/insights/7EzOu4Vq
- **Email Capture & Survey Engagement**: https://us.posthog.com/project/410858/insights/kPn8wryF
- **Session Completion vs Abandon** (start → complete funnel): https://us.posthog.com/project/410858/insights/VaRC2dqI

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
