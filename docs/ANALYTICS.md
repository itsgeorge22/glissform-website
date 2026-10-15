# Optional website analytics

PostHog EU project `307451`, [Glissform dashboard](https://eu.posthog.com/project/307451/dashboard/1027294). The website uses this project for optional analytics. The public `phc_` ingestion token in `src/analytics.ts` is intentionally public; it is not a personal API key.

`AnalyticsConsent.astro` supplies the shared homepage/privacy-page choice in a narrow bottom-right card on desktop and an inset fluid card on phones. Its copy explains optional page-view and download-click statistics. Allow uses the feature-icon blue; the grey Read More link opens the website-analytics section of the privacy page, and a compact text-only No thanks button sits below, without a background on hover. The main actions are at least 44px tall; No thanks is 28px tall and remains directly actionable. The title-to-description gap is 12px. No third-party analytics library loads, no analytics request is sent and no visitor ID is saved before opt-in. A browser choice expires after 180 days. The footer's Analytics choices and privacy page reopen it. Withdrawal aborts pending requests, clears the ID and stops capture; already received events are not deleted automatically. Blocked storage means no analytics. The page and downloads work without consent or JavaScript.

The privacy page uses the homepage’s shared hero headline/subtitle typography, blue privacy panel and rounded controls. Its desktop content occupies the middle eight grid columns (936px at the 1920px reference), with fluid tablet and phone insets and no section sidebar. Its policy describes current data practices without app-version or release-status text; revise it when collection, providers, retention or choices change.

| Event | Allowed data | Reporting |
| --- | --- | --- |
| `$pageview` | Random browser ID, allowlisted path, referring hostname, simple UTM source/medium/campaign labels | Unique homepage visitors and referral/campaign breakdowns. |
| `download_clicked` | Same context plus `hero`, `download_card`, `navbar` or `fixed_navbar` | Total clicks by button and unique clickers / unique homepage visitors. Not completed downloads or installs. |

Common properties: `environment`, `platform=web`, `schema_version=1`, no person profiles or GeoIP enrichment. No names, emails, arbitrary URL parameters/fragments, referrer paths, page text, recordings or app identity. Browser IDs and native installation IDs are deliberately separate. Reports describe consenting IDs; ad blockers, declined consent and cleared storage affect estimates. Do not present them as exact people or full visitor totals.

Only a production build on `glissform.app` labels events `production`. Localhost/127.0.0.1 label them `test`; other origins send nothing. Production dashboard insights explicitly filter production. Built-in PostHog screens may include tests unless filtered. The free plan is capped, without paid billing; current event retention is up to one year. Session replay, autocapture, console/performance capture, heatmaps and surveys are disabled in the project as well as absent from the integration.

Manual verification: rebuild and refresh port 4180; confirm declining survives reload; reopen Analytics choices, allow, reload and click a download; verify test events and placement in PostHog; withdraw and confirm no further events. Review the responsive banner and privacy page. Run the existing build/typecheck and deployment checks. See [deployment](DEPLOYMENT.md) for the receiver prerequisite and release order.
