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
