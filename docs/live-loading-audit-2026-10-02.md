# Live loading and indexing audit — 2026-10-02

Tested URL: https://glissform.app/. The live deployment marker reported commit `e88c9ea3c0c4ed2657404b17dad7f194fe6d128d`. No website content, styling or animation behavior changed during this audit.

## Google PageSpeed Insights

Three initial-load tests used Google's Lighthouse 13.5.0 / HeadlessChromium 153.0.8010.36. Mobile used an emulated Moto G Power with Slow 4G throttling; desktop used the report's emulated desktop/custom throttling. These are simulated loading tests, not physical device tests or animation benchmarks.

| Test (Europe/Tallinn) | Device | Performance | First content | Largest content | Blocking time | Layout shift | Speed Index |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 13:41:23 | Mobile | 85 | 1.1 s | 1.4 s | 350 ms | 0.157 | 3.0 s |
| 13:41:23 | Desktop | 83 | 0.5 s | 0.8 s | 370 ms | 0.001 | 1.1 s |
| 13:43:33 | Mobile | 63 | 2.6 s | 7.2 s | 230 ms | 0 | 6.0 s |
| 13:43:33 | Desktop | 90 | 0.3 s | 1.1 s | 220 ms | 0.001 | 1.0 s |
| 13:44:32 | Mobile | 65 | 2.7 s | 7.2 s | 160 ms | 0 | 5.7 s |
| 13:44:32 | Desktop | 71 | 0.5 s | 1.3 s | 690 ms | 0.001 | 1.0 s |

Median performance scores: **65 mobile**, **83 desktop**. All tests scored **100 SEO**, **100 Best Practices** and **96 Accessibility**. Lighthouse SEO checks do not establish indexing, rankings or rich-result eligibility. The accessibility audit flagged contrast; no visual changes were made.

Reports: [first](https://pagespeed.web.dev/analysis/https-glissform-app/fsj69cx6jf?form_factor=mobile), [second](https://pagespeed.web.dev/analysis/https-glissform-app/ef67rkln3e?form_factor=mobile), [third](https://pagespeed.web.dev/analysis/https-glissform-app/ed71tea0z6?form_factor=mobile). Each report includes its Desktop tab.

### Findings

- Mobile loading varied substantially. Two tests reported 7.2 s LCP; the slower report identified the hero headline as the LCP element and render delay as its contributor. Render-blocking requests were also flagged. Font/style delivery needs a focused follow-up before attributing the delay to a specific implementation.
- The first mobile test reported a 0.157 layout shift affecting the hero download link, with Inter web fonts listed as contributors. Other mobile tests reported zero shift, so it is an intermittent loading issue.
- Desktop main content loaded in 0.8–1.3 s, but initial JavaScript work caused 220–690 ms of blocking. The first report attributed its long tasks primarily to the site's main bundle. A startup profile is needed to identify specific consumers; these measurements do not invalidate owner acceptance of smooth animations.
- Google estimated roughly 1.2–1.4 MiB of potential image savings across the reports. Settings screenshots and small blur choices are delivered at larger dimensions than the audit's rendered sizes. Responsive image sources can reduce mobile transfers; compression changes must preserve the accepted visual quality. Google's estimated savings are not measured savings from an implemented change.
- All reports showed **No Data** for real-user experience. Real-user Core Web Vitals and INP cannot yet be assessed from these reports. [Google's documentation](https://developers.google.com/speed/docs/insights/v5/about) explains the separate lab and real-user data requirements.

## Crawl readiness and Search Console

Live HTTP checks confirmed the home page, robots file and sitemap return 200, with no `X-Robots-Tag` restriction. The home page has one canonical URL, `https://glissform.app/`, and no robots exclusion. Marketing/FAQ content is present in initial HTML. Robots allows crawling and names `https://glissform.app/sitemap.xml`; the sitemap parses correctly and contains the canonical home page only.

After owner confirmation, the URL-prefix property `https://glissform.app/` was verified through Google's HTML file on 2026-10-02. The verification file is installed directly at `/var/www/glissform.app/googlec3ba2f453f07c122.html`; it must remain available to retain verification. The restricted deployment receiver preserves unrelated root files, so routine website deployments do not remove it.

Google URL Inspection confirmed **URL is on Google / Page is indexed**. Last crawl: **2026-10-02 13:53:29 Europe/Tallinn**, as **Googlebot smartphone**. Crawl allowed: Yes; page fetch: Successful; indexing allowed: Yes. Both the declared canonical and Google's selected canonical are `https://glissform.app/`. The newly created property's aggregate reports are still processing; the URL inspection is the direct evidence for homepage indexing.

The sitemap was submitted and Search Console confirmed **Sitemap submitted successfully**. Its initial processing status was **Couldn't fetch**, type Unknown and zero discovered pages. A server access-log request identified as Googlebot received the sitemap with HTTP 200 at 10:53:55 UTC. Google's live URL Inspection test at **13:57:05 Europe/Tallinn** then confirmed **URL is available to Google**, crawl allowed Yes and page fetch Successful, using Google Inspection Tool smartphone. The sitemap was resubmitted once after this successful test. The final Sitemaps report still showed Couldn't fetch, Unknown and zero discovered pages. Successful submission and live fetch do not establish successful sitemap parsing/processing; the report must show Success before that follow-up is complete. The XML sitemap itself does not need to appear in search results, so indexing was not requested for it.

The sitemap's XML structure, canonical URL and public availability were checked. No DNS, TLS, robots or website-content changes were needed. [Google's sitemap troubleshooting guidance](https://support.google.com/webmasters/answer/7451001) recommends the live fetch test for this error and notes that some fetch errors are transient.


## Local loading follow-up — 2026-10-02 (pre-publication measurements)

The canonical website checkout was clean at the start: `2195ee4` already contained this audit. There were no existing uncommitted website or native-app changes to preserve. The live deployment marker also reported `2195ee4c0928aafe8316df52eaf2827f3fb45996`. At the time of these measurements, all changes below were local; no commit, push, production deployment or Search Console resubmission had been performed. The owner subsequently authorized committing and pushing this work on 2026-10-02. The main-branch workflow publishes the website; `/deployment.json` identifies the live commit.

### Implemented

- Embed the existing production CSS and exact Inter 400/500/600 WOFF2 files in the initial HTML. This removes the external stylesheet/font chain. Adjust the local Arial fallback's size and vertical metrics for the brief font-decoding interval; final Inter typography is unchanged. The [CSS size-adjust descriptor](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/size-adjust) provides the fallback adjustment.
- Generate lossless 480/800px settings screenshots, plus 1200px for Seamless Close, and 240/480px blur previews. Retain original masters for high-density displays and account for existing cropping in `sizes`. The resized Battery Ripple 1200px file was larger than the original, so it is deliberately excluded. At the mobile test density, the two settings images use 800px variants totaling 242,496 bytes instead of 581,648 bytes (58% less); no lossy encoding was added.
- Split GSAP, ScrollTrigger, the renderer and wallpaper out of the initial bundle. Initialize the existing motion as the scene approaches within 400px of the viewport. Reserve its original scroll distance in advance to retain stable lower section links and reverse scrolling. Keep lightweight fallback scaling, Reduce Motion, chunk/image/graphics failure cleanup and unmount cancellation. The renderer's geometry, shader, easing, 0.4-second scrub, reveal and reversal are unchanged.
- Create future-field particles and allocate/draw its canvas only when visible, on desktop, and allowed by the motion preference. Retain the existing motion, pointer response and pause/resume rules.
- Compress HTML in the local production preview, matching production's existing gzip behavior. No server configuration changed.

The initial JavaScript is 286,273 bytes (87,899 bytes with gzip) versus 415,205 bytes (138,564 bytes with the same local gzip encoder): 37% less compressed startup JavaScript. Deferred work still occurs when scrolling toward the scene. This is a loading improvement, not proof of animation frame performance. The combined HTML/CSS/fonts transfer is approximately 98 KB compressed, versus 15 KB for HTML alone before the change; the separate stylesheet/font transfers disappear. This single-page approach trades separate font/style cache entries for earlier availability.

### Repeated local production tests

Lighthouse 13.5.0, Chrome for Testing 153.0.8010.12 on the development Mac. Mobile: Lighthouse's default simulated mobile/Slow 4G configuration (412×823, 1.75× density); desktop: the desktop preset. Both before/after snapshots were served locally with the same gzip handler. The baseline is the production build captured before edits. Each run used a fresh Lighthouse navigation, with three samples per device and version. The final after samples below supersede exploratory measurements. They are **not new Google-hosted PageSpeed reports**, do not include production network latency, and are not directly comparable to the earlier live scores.

| Time (Europe/Tallinn) | Sample | Performance | First content | Largest content | Blocking | Layout shift |
| --- | --- | --- | --- | --- | --- | --- |
| 14:18:01 | Before mobile 1 | 67 | 2.30 s | 6.91 s | 70.0 ms | 0.161483 |
| 14:18:22 | Before mobile 2 | 66 | 2.41 s | 6.98 s | 41.0 ms | 0.161483 |
| 14:18:43 | Before mobile 3 | 66 | 2.41 s | 6.99 s | 53.5 ms | 0.161483 |
| 14:24:03 | After mobile 1 | 83 | 1.80 s | 4.50 s | 0.0 ms | 0.000174 |
| 14:24:14 | After mobile 2 | 83 | 1.80 s | 4.58 s | 0.0 ms | 0.000174 |
| 14:24:24 | After mobile 3 | 90 | 1.83 s | 3.53 s | 0.0 ms | 0.000174 |
| 14:19:04 | Before desktop 1 | 97 | 0.52 s | 1.26 s | 0.0 ms | 0.001138 |
| 14:19:25 | Before desktop 2 | 97 | 0.53 s | 1.24 s | 0.0 ms | 0.001138 |
| 14:19:46 | Before desktop 3 | 97 | 0.53 s | 1.25 s | 5.0 ms | 0.001138 |
| 14:24:34 | After desktop 1 | 99 | 0.44 s | 0.92 s | 0.0 ms | 0.000222 |
| 14:24:45 | After desktop 2 | 100 | 0.45 s | 0.72 s | 0.0 ms | 0.000222 |
| 14:24:55 | After desktop 3 | 99 | 0.44 s | 0.92 s | 0.0 ms | 0.000222 |

Median local mobile performance improved **66 → 83**, largest content **6.98 → 4.50 s**, and blocking **53.5 → 0 ms**. Final mobile scores ranged from 83 to 90; earlier exploratory after runs also scored 90, illustrating lab variation. Desktop median performance improved **97 → 99**, with largest content **1.25 → 0.92 s**. Desktop baseline blocking was already near zero in this local comparison, unlike the earlier Google-hosted reports; do not merge these environments. Final layout shift was below **0.001** in every sample (Lighthouse displays this rounded as 0), versus 0.161483 on baseline mobile. All final samples retained 100 SEO, 100 Best Practices and 96 Accessibility. The existing contrast finding remains unchanged to preserve the approved colors.

Additional 320px, 390px and 768px mobile-width loading checks measured CLS 0.000280, 0.000153 and 0.000347 respectively. Raw reports and diagnostic traces are outside Git in `/tmp/glissform-loading-audit/`; final comparisons are `final-{before,after}-{mobile,desktop}-{1,2,3}.json`. No real-user field data or physical mobile-browser acceptance was established.

### Verification and preview

- Production build, 11 SEO/asset/deployment checks, four lazy-loading lifecycle checks, and 14 future-field motion/lifecycle checks pass. `git diff --check` passes.
- Extracted visible text matches the baseline exactly. Initial HTML still contains all marketing/FAQ content and metadata. Responsive image candidates exist in the build and load in the browser.
- Local browser checks cover the mobile, compact and desktop layouts, loaded fonts, no horizontal overflow at the checked layouts, mobile menu/Escape, automatic/manual feature switching, deferred renderer initialization, reveal and upward-scroll reversal. Desktop reserved track space matched the animated height (1580px in the checked viewport). Fresh direct navigation to `#customise` retained the expected approximately 96px section offset below the 72px header.
- Reduced-motion loading/fallback scale, pending-import unmount, failed-chunk cleanup, field visibility/preference transitions and context-loss handling are covered by focused tests. These are not new physical animation benchmarks.
- Preview: `http://127.0.0.1:5175/__preview/mobile`; compact: `http://127.0.0.1:5175/__preview/compact`; full page: `http://127.0.0.1:5175/`.
- README, CHANGELOG and ROADMAP reviewed and updated together. Product content, public beta version/download destination, privacy claims, support claims, discovery files and repository positioning remain unchanged. GitHub metadata/forms and production assets were not modified. Publication was subsequently authorized. New Google-hosted PageSpeed measurements remain a separate follow-up; these recorded results are local tests.

### Search Console recheck

The authenticated Sitemaps report was reopened on 2026-10-02 for `https://glissform.app/`. `/sitemap.xml` still shows **Couldn't fetch**, **Unknown** type and **0 discovered pages**, submitted Oct 2, 2026. No successful last-read date is displayed. A fresh public request still returns the valid XML containing the canonical homepage. The earlier homepage indexing evidence remains separate from this unresolved sitemap-processing result. No resubmission or verification-file changes were made. The roadmap item stays open until Search Console reports Success.
