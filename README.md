# Glissform website v2

Local website candidate built with Astro, React, TypeScript, SCSS, Three.js and GSAP. On supported desktop views, the star-filled hero pulls back into a reversible MacBook scene over 2,000px of scrolling, then the resting Mac and its copy scroll away naturally. The opening hero and MacBook text reveals retain their existing motion. There is no logo dive or automatic transition into the features. The initial HTML reserves the complete Mac reveal height, keeping native reload and history scroll restoration stable as the page hydrates. Compact, touch, reduced-motion and no-JavaScript views use a shorter hero in normal page flow.

Desktop sizing retains the approved 1920px-wide composition as its reference. Geometry, spacing, panels and decoration scale with the viewport; typography and controls have readable minimums, including 16px body text and 44px controls. At 1920px, body text retains its original 18px size. Pixel dimensions elsewhere in this guide describe that original composition. The Mac reveal distance and maximum scroll speed use the same scale, retaining their timing relationship; timed animations keep their durations. Publication uses the isolated `/v2/` deployment; the main homepage remains unchanged.

The four everyday-convenience features follow the hero with normal page scrolling and immediately readable text. On tablet and desktop, square, rounded demo panels sit beside the copy: text left for Start at login and Stay active, text right for Menu bar access and Stay updated. Phone rows stack copy above each demo. Each demo runs independently when at least half its panel is visible, pauses outside that range or while the page is hidden, and resumes from the same point. Reduced motion shows static demos and a stationary hero.

A Seamless Close customization section follows the everyday conveniences with six features: manual starting angle, automatic angle detection, adjustable blur, resume after a pause, return with Esc and connection effect. Phones use a native horizontal scroller with a visible next-card edge, gentle snapping and keyboard access. Tablet and desktop grids use two and three columns respectively. Each has a rounded 4:3 visual above static copy. The first demonstrates a continuous slider drag with a rolling angle tooltip; the second pairs a two-line laptop with a dashed angle arc and the same counter. The remaining visuals show a square passing through blur strengths, a stillness timer before desktop restoration, an Esc key triggering the same return, and a brief edge glow at contact. All six use one section-wide clock: they start together, retain their natural durations, hold their finished states, and repeat after the longest finishes plus two seconds of rest. The clock runs while any demo is at least half visible; newly visible demos join its current position. It pauses when all six are out of view or the page is hidden. The demos remain silent and have static reduced-motion states. There are no surrounding cards or reading-text animations.

Trackpad and wheel movement is capped at 1,600 reference scroll pixels per second only during the Mac reveal, with at most 80ms of pending movement. Small deltas stay exact and reversal clears the pending direction immediately. Scrolling beyond the reveal and through all feature rows is native, including scroll keys; no feature gestures are intercepted.

A static privacy section sits between the everyday conveniences and customization, explaining Screen Recording access, temporary in-memory screenshots and update traffic. On desktop, its centered blue panel spans the middle ten layout-grid columns (1176px reference width), with 24px corners and the existing feature typography, 40px icon slot and copy spacing. At compact widths, the copy wraps naturally and the phone layout stacks the icon and text.

The FAQ follows customization within the middle ten desktop grid columns (1176px reference width), matching the privacy card. Its intro spans three columns and accordion spans six, with one empty column between them; compact layouts stack the intro and questions, and tablet content fills the same width as the feature sections. The full-width background shares the first feature cards’ gray surface, with 40px top corners, 200px top padding and a 200px gap from customization at the desktop reference size. The intro shares the customization section’s headline and subtitle styles; the desktop reference gap after the Mac section is 200px, with 160px above and below the privacy card. Eight native accordion items cover cost, compatibility, installation, screen access, sleep, updates, quitting and feedback. The first answer starts open; opening another closes it. The accordion supports keyboard interaction and works without JavaScript. With JavaScript, answers expand and collapse smoothly with a short fade, reverse immediately on repeated input and switch instantly for reduced motion. The FAQ navigation link stays within this preview.

The shared gray FAQ container ends with a download card spanning the middle ten desktop columns and a footer row spanning all twelve columns. Both fill the shared tablet content width and fit the phone layout, with the footer wrapping or stacking as space requires. The card reuses the hero’s download button and live atmosphere: breathing glows, twinkling stars, cursor attraction/parallax, background-click ripples and occasional shooting stars. Its interactions use the card’s own coordinates, pause offscreen and respect reduced motion. A divider separates the card from the brand/home link and copyright row.

On supported desktop views, the gray FAQ and footer surface scrolls over customization: both feature rows remain readable before the section holds, then the rounded surface covers it with native page scrolling. A dark overlay gradually dims customization as the FAQ enters and clears when scrolling back. The hold releases once the surface fills the viewport, and reversing scroll uncovers the features. Compact, touch, reduced-motion and no-JavaScript views retain ordinary page flow.

## Responsive layout

| Viewport range | Main review width | Layout |
| --- | --- | --- |
| Below 768px | 414px | Phone: stacked sections, horizontally scrolling customization, compact Explore navigation. |
| 768–1199px | 768px | Tablet: paired convenience rows, two-column customization, full-width stacked FAQ. |
| 1200px and wider | 1440px | Desktop: full composition, retaining the original 1920px design reference. |

The phone and tablet references follow September 2026 [mobile](https://gs.statcounter.com/screen-resolution-stats/mobile/worldwide/) and [tablet](https://gs.statcounter.com/screen-resolution-stats/tablet/worldwide/) screen-resolution data. Those are general page-view samples, not actual viewport measurements or Glissform audience analytics. The 1440px desktop reference is a practical review width, not a popularity claim. The 1200px layout boundary leaves room for readable desktop type and controls. Layouts remain fluid between references; also review 320px, 360px, 820px, 1024px, 1280px and the breakpoint edges.

Every range shares the same content, headings, links and initial HTML, following [Google's mobile-first guidance](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing). Compact navigation uses a native Explore menu, and compact hero buttons have a 56px minimum height. The Mac scene loads only at 1200px and wider with a fine pointer, hover support and no reduced-motion preference; other views use the normal-flow hero without downloading WebGL. Phones and tablets show a lightweight render of the desktop MacBook's nearly closed, 28° resting pose; wider static fallbacks retain their illustration. Compact hero and download-card stars fill the background without the desktop copy-exclusion rectangle. Their FAQ intro is centered with the same spacing as other section intros, and privacy content stacks with a 40px gap on phones or aligns at the top on tablets. Feature demos still run when visible, with static reduced-motion states. These responsive changes are saved on the v2 branch for manual review and have not been deployed.

## Work locally

Checkout: `/Users/george/Projects/glissform-website-next`. Requires Node 22.12 or later; Node 24 is used locally.

```sh
npm ci
npm run dev       # development server: http://127.0.0.1:5180/
npm run build     # typecheck and generate dist/
npm run preview   # built preview: http://127.0.0.1:4180/
npm run build:v2  # isolated /v2 build in dist-v2/
npm run test:deploy:v2 # deployment checks against that build
npm run deploy:v2 # build, check and publish the committed v2 branch
```

The review preview serves `dist/`, so rebuild after source changes and refresh the browser to see them. Start the preview if it is not running. Astro background servers can be stopped with `npx astro dev stop` or `npx astro preview stop`. Documentation-only edits need no rebuild.

Follow [AGENTS.md](AGENTS.md) for design consistency, code structure, preview updates and verification. Automated verification is limited to `npm run build` (including type checking), `npm run check` for type checking alone, and `npm run test:deploy`. Visual and interaction behavior is reviewed manually.

After building, `npm run test:deploy` checks referenced HTML/CSS/JavaScript assets, section-link targets, download links against release metadata, v2’s `noindex, nofollow` policy and deployment-receiver archive safety. The `/v2` variant also resolves assets beneath the deployed base path. Receiver checks verify that v2 publication leaves the homepage, downloads and updates intact. These checks run offline and do not assert copy, layout, section counts or component structure; they do not verify the remote DMG’s availability.

## Find the code

| Location | Purpose |
| --- | --- |
| `src/pages/index.astro` | Shared responsive page HTML and metadata. |
| `src/home-next/` | V2 hero, static Seamless Close feature grid, Settings feature rows and animated demos, shared line-based text motion, navigation, styles, choreography, display geometry and Three.js hardware. |
| `src/home-next/heroScreenFormation.ts` | Initial screen, notch and star formation, with the opening's timing. |
| `src/hero-test/`, `src/hero-test-animation/` | Existing star interactions, assets and projection helpers reused by v2; also contain earlier studies. |
| `public/models/` | Prepared local model assets and provenance. |
| `scripts/`, `tests/` | Build/asset utilities and deployment checks. |

Earlier Vite sources remain in the checkout but are not routes in the Astro build or a design reference for v2. V2's current styles and components define the visual direction.

See [Motion guidelines](docs/MOTION.md) for rules covering text, visuals, composed units and collections, with separate choices for emphasis, size and timing driver. The [Hero motion reference](docs/MOTION_HERO_REFERENCE.md) records the current implementation settings. The hero navbar stays visible; the fixed desktop navbar remains visible after its scene entrance regardless of scroll direction. Compact views use the Explore menu. Shared motion lives in `textRevealMotion.ts`, `choreography.ts`, `heroEntrance.ts` and `sectionNavigation.ts` under `src/home-next/`.

## Local and production boundaries

V2 is a test page at `https://glissform.app/v2/` and uses `noindex, nofollow` in every build. Local development and preview servers also send `X-Robots-Tag: noindex, nofollow`. The ordinary local build still serves `/` on port 4180; `build:v2` uses a `/v2/` asset base and separate `dist-v2/` output. The Mac model, images, scripts, styles and OG image all stay under that path. Download links continue to use the existing root `/downloads/` destination. Responsive SEO improvements do not remove the candidate's indexing exclusion; publication requires separate authorization.

`deploy:v2` requires a clean, committed `codex/homepage-v2` branch, rebuilds and runs the small deployment checks, then uploads through the existing VPS SSH access. Set `GLISSFORM_VPS_KEY` to override the local identity-file path. Its separate receiver accepts only `index.html`, `assets/` and `models/` and writes exclusively inside `/var/www/glissform.app/v2/`; it preserves v1, root discovery files, downloads and updates. Verify the commit at `/v2/deployment.json`. No Nginx configuration change is needed: the existing directory routing serves `/v2/` and redirects `/v2` there.

V1 at `/Users/george/Projects/glissform-website` and the live homepage are separate. Do not push or publish without explicit authorization. The existing `main` deployment workflow publishes to the production root and must not be used for v2. The website animation does not capture the visitor's screen or read a lid sensor.

## Reference

- [CHANGELOG](CHANGELOG.md): completed work and local/published status.
- [Model provenance](public/models/README.md) and [hero asset provenance](src/hero-test/assets/README.md): sources, preparation and notices.
- [Archive](docs/archive/): earlier implementation notes, browser validation, loading audit and retired roadmap. Historical context only; no ongoing maintenance required.
