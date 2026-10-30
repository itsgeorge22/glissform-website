# Glissform website

Production homepage at [glissform.app](https://glissform.app/), built with Astro, React, TypeScript, SCSS, Three.js and GSAP. On supported desktop views, the star-filled hero pulls back into a reversible MacBook scene over 2,000px of scrolling, then the resting Mac and its copy scroll away naturally. The opening hero and MacBook text reveals retain their existing motion. There is no logo dive or automatic transition into the features. The initial HTML reserves the complete Mac reveal height, keeping native reload and history scroll restoration stable as the page hydrates. Compact, touch, reduced-motion and no-JavaScript views use a shorter hero in normal page flow.

Desktop sizing retains the approved 1920px-wide composition as its reference. Geometry, spacing, panels and decoration scale with the viewport; typography and controls have readable minimums, including 16px body text and 44px controls. At 1920px, body text retains its original 18px size. Pixel dimensions elsewhere in this guide describe that original composition. The Mac reveal distance and maximum scroll speed use the same scale, retaining their timing relationship; timed animations keep their durations. The v2 design now replaces the former homepage; `/v2/` permanently redirects to `/`.

The four everyday-convenience features follow the hero with normal page scrolling and immediately readable text. On tablet and desktop, square, rounded demo panels sit beside the copy: text left for Start at login and Stay active, text right for Menu bar access and Stay updated. Phone rows stack copy above each demo. Each demo runs independently when at least half its panel is visible, pauses outside that range or while the page is hidden, and resumes from the same point. Reduced motion shows static demos and a stationary hero.

A Seamless Close customization section follows the everyday conveniences with six features: manual starting angle, automatic angle detection, adjustable blur, resume after a pause, return with Esc and connection effect. Phones use a native horizontal scroller with a visible next-card edge, gentle snapping and keyboard access. Tablet and desktop grids use two and three columns respectively. Each has a rounded 4:3 visual above static copy. The first demonstrates a continuous slider drag with a rolling angle tooltip; the second pairs a two-line laptop with a dashed angle arc and the same counter. The remaining visuals show a square passing through blur strengths, a stillness timer before desktop restoration, an Esc key triggering the same return, and a brief edge glow at contact. All six use one section-wide clock: they start together, retain their natural durations, hold their finished states, and repeat after the longest finishes plus two seconds of rest. The clock runs while any demo is at least half visible; newly visible demos join its current position. It pauses when all six are out of view or the page is hidden. The demos remain silent and have static reduced-motion states. There are no surrounding cards or reading-text animations.

Trackpad and wheel movement is capped at 1,600 reference scroll pixels per second only during the Mac reveal, with at most 80ms of pending movement. Small deltas stay exact and reversal clears the pending direction immediately. Scrolling beyond the reveal and through all feature rows is native, including scroll keys; no feature gestures are intercepted.

A static privacy section sits between the everyday conveniences and customization, explaining Screen Recording access, temporary in-memory screenshots and optional analytics. On desktop, its centered blue panel spans the middle ten layout-grid columns (1176px reference width), with 24px corners and the existing feature typography, 40px icon slot and copy spacing. At compact widths, the copy wraps naturally and the phone layout stacks the icon and text.

The FAQ follows customization within the middle ten desktop grid columns (1176px reference width), matching the privacy card. Its intro spans three columns and accordion spans six, with one empty column between them; compact layouts stack the intro and questions, and tablet content fills the same width as the feature sections. The full-width background shares the first feature cards’ gray surface, with 40px top corners, 200px top padding and a 200px gap from customization at the desktop reference size. The intro shares the customization section’s headline and subtitle styles; the desktop reference gap after the Mac section is 200px, with 160px above and below the privacy card. Eight native accordion items cover cost, compatibility, installation, screen access, sleep, updates, quitting and feedback. The first answer starts open; opening another closes it. The accordion supports keyboard interaction and works without JavaScript. With JavaScript, answers expand and collapse smoothly with a short fade, reverse immediately on repeated input and switch instantly for reduced motion. The FAQ navigation link targets the shared FAQ on the current page.

The shared gray FAQ container ends with a download card spanning the middle ten desktop columns and a footer row spanning all twelve columns. Both fill the shared tablet content width and fit the phone layout, with the footer wrapping or stacking as space requires. The card reuses the hero’s download button and live atmosphere: breathing glows, twinkling stars, cursor attraction/parallax, background-click ripples and occasional shooting stars. Its interactions use the card’s own coordinates, pause offscreen and respect reduced motion. A divider separates the card from the brand/home link and copyright row.

The homepage and privacy page share `src/home-next/PageEnding.astro`: place the preceding page content in its slot to reuse the FAQ, download card and footer. On supported desktop views, that content remains readable before it holds and the rounded gray surface scrolls over it, dimming it from 0% to 28%. Reversing scroll uncovers the content and clears the overlay. Compact, touch, reduced-motion and no-JavaScript views retain ordinary page flow. `FixedNavigation.tsx` shares the homepage’s glass dock with inner pages; the homepage retains its scene entrance, while privacy shows it immediately with a compact Explore menu on phones. Shared page styling lives in `src/site.scss`.

Download buttons on the homepage and privacy page open a shared installation guide while preserving the original DMG download. Four numbered cards stack vertically in a narrow, text-only modal and cover Applications, the first-open alert, Privacy & Security approval and confirmation. The header has a square close button and no app-icon label. The guide reuses the main page's heading/body styles and the privacy card's primary button, alongside the site's spring motion, a dimmed backdrop, native modal focus handling, Escape/outside-click dismissal and reduced-motion support. The installation guide link in the FAQ reopens it without downloading again. The Mac reveal's scroll limiter yields while a modal is open. Source: `src/InstallationGuide.astro`, `src/installationGuide.ts` and `src/installation-guide.scss`.

## Responsive layout

| Viewport range | Main review width | Layout |
| --- | --- | --- |
| Below 768px | 414px | Phone: stacked sections, horizontally scrolling customization, compact Explore navigation. |
| 768–1199px | 768px | Tablet: paired convenience rows, two-column customization, full-width stacked FAQ. |
| 1200px and wider | 1440px | Desktop: full composition, retaining the original 1920px design reference. |

The phone and tablet references follow September 2026 [mobile](https://gs.statcounter.com/screen-resolution-stats/mobile/worldwide/) and [tablet](https://gs.statcounter.com/screen-resolution-stats/tablet/worldwide/) screen-resolution data. Those are general page-view samples, not actual viewport measurements or Glissform audience analytics. The 1440px desktop reference is a practical review width, not a popularity claim. The 1200px layout boundary leaves room for readable desktop type and controls. Layouts remain fluid between references; also review 320px, 360px, 820px, 1024px, 1280px and the breakpoint edges.

Every range shares the same content, headings, links and initial HTML, following [Google's mobile-first guidance](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing). Compact navigation uses a native Explore menu, and compact hero buttons have a 56px minimum height. The Mac scene loads only at 1200px and wider with a fine pointer, hover support and no reduced-motion preference; other views use the normal-flow hero without downloading WebGL. Phones and tablets show a lightweight render of the desktop MacBook's nearly closed, 28° resting pose; wider static fallbacks retain their illustration. Compact hero and download-card stars fill the background without the desktop copy-exclusion rectangle. Their FAQ intro is centered with the same spacing as other section intros, and privacy content stacks with a 40px gap on phones or aligns at the top on tablets. Feature demos still run when visible, with static reduced-motion states.

## Work locally

Checkout: `/Users/george/Projects/glissform-website-next`. Requires Node 22.12 or later; Node 24 is used locally.

```sh
npm ci
npm run dev       # development server: http://127.0.0.1:5180/
npm run build     # typecheck and generate dist/
npm run preview   # built preview: http://127.0.0.1:4180/
npm run test:deploy # small production deployment checks against dist/
```

The review preview serves `dist/`, so rebuild after source changes and refresh the browser to see them. Start the preview if it is not running. Astro background servers can be stopped with `npx astro dev stop` or `npx astro preview stop`. Documentation-only edits need no rebuild.

Production HTML includes the page stylesheet without separate blocking CSS requests. Shared styles are separated from the retired homepage, each font face is declared once, and the existing regular and semibold Manrope files are preloaded without changing their glyphs or metrics. Logos and the compact MacBook use responsive image sources. Lower-page interactive sections hydrate within 400px of the viewport; demos prepare their first pose nearby and retain the existing half-visible playback threshold. The desktop FAQ scroll-over measures through a resize observer and stays inactive in compact layouts.

Follow [AGENTS.md](AGENTS.md) for design consistency, code structure, preview updates and verification. Automated verification is limited to `npm run build` (including type checking), `npm run check` for type checking alone, and `npm run test:deploy`. Visual and interaction behavior is reviewed manually.

After building, `npm run test:deploy` checks referenced HTML/CSS/JavaScript assets, section-link targets, download links against release metadata, production indexing/canonical/discovery settings and deployment-receiver archive safety. Receiver checks verify that assets and models publish before the homepage while downloads, updates, verification files and old assets stay intact. These checks run offline and do not assert copy, layout, section counts or component structure; they do not verify the remote DMG’s availability.

## Find the code

| Location | Purpose |
| --- | --- |
| `src/pages/index.astro` | Shared responsive page HTML and metadata. |
| `src/_colors.scss` | Shared interface colours, derived privacy surface and inverse text. Current pages use these CSS variables; `_tokens.scss` is retained for retired Vite pages. |
| `src/_scene-palette.scss`, `src/_materials.scss` | Shared hero/footer atmosphere and complete glass, navigation and shadow recipes. |
| `src/home-next/_feature-palette.scss`, `src/home-next/macBookPalette.ts` | Scoped feature accents, simulated macOS materials and unchanged MacBook artwork colours. |
| `src/home-next/` | V2 hero, static Seamless Close feature grid, Settings feature rows and animated demos, shared line-based text motion, navigation, styles, choreography, display geometry and Three.js hardware. |
| `src/home-next/heroScreenFormation.ts` | Initial screen, notch and star formation, with the opening's timing. |
| `src/hero-test/`, `src/hero-test-animation/` | Existing star interactions, assets and projection helpers reused by v2; also contain earlier studies. |
| `public/models/` | Prepared local model assets and provenance. |
| `scripts/`, `tests/` | Build/asset utilities and deployment checks. |

Earlier Vite sources remain in the checkout but are not routes in the Astro build or a design reference for v2. V2's current styles and components define the visual direction.

See [Motion guidelines](docs/MOTION.md) for rules covering text, visuals, composed units and collections, with separate choices for emphasis, size and timing driver. The [Hero motion reference](docs/MOTION_HERO_REFERENCE.md) records the current implementation settings. The hero navbar stays visible; the fixed desktop navbar remains visible after its scene entrance regardless of scroll direction. Compact views use the Explore menu. Shared motion lives in `textRevealMotion.ts`, `choreography.ts`, `heroEntrance.ts` and `sectionNavigation.ts` under `src/home-next/`.

## Local and production boundaries

Production builds use `index, follow`, a canonical URL of `https://glissform.app/`, matching social and structured-data URLs, and root discovery files. Development HTML uses `noindex, nofollow`; both local development and built-preview servers also send that exclusion as an `X-Robots-Tag` header. A local build serves `/` on port 4180. Download links retain the existing `/downloads/` destination. The website animation does not capture the visitor's screen or read a lid sensor.

An authorized push to `main` builds and deploys through Cloudflare Pages (`glissform-website`); GitHub Actions runs verification only. Existing `/downloads/` addresses redirect to GitHub Releases, and the exact signed update feed is served at `/updates/appcast.xml`. Preserve the Search Console file and Beget email records during domain cutover. See [deployment and rollback](docs/DEPLOYMENT.md).

The older checkout at `/Users/george/Projects/glissform-website` may contain independent uncommitted work; do not overwrite it while promoting this checkout. Future pushes and publication still require explicit authorization.

## Reference

- [AI product guide](public/llms.txt): concise public facts and canonical links, served at `/llms.txt` and linked from both page heads. Keep it aligned with published features, compatibility, price and privacy; the current release stays on the homepage.
- [CHANGELOG](CHANGELOG.md): completed work and local/published status.
- [Model provenance](public/models/README.md) and [hero asset provenance](src/hero-test/assets/README.md): sources, preparation and notices.
- [Archive](docs/archive/): earlier implementation notes, browser validation, loading audit and retired roadmap. Historical context only; no ongoing maintenance required.

## Optional analytics

The website analytics integration uses PostHog EU, with a compact optional usage prompt and a footer control to change the choice. It sends no analytics requests and stores no visitor ID before opt-in. Approved events count page views, download clicks at all four placements and sanitized traffic sources; no replay, autocapture or person profiles. See [implementation and review](docs/ANALYTICS.md). Publish the privacy page before the analytics-enabled app release.
