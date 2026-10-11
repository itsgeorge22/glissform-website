# Glissform website v2

Local website candidate built with Astro, React, TypeScript, SCSS, Three.js and GSAP. It currently contains the star-filled screen hero and reversible scroll-driven MacBook scene, followed by a pinned sequence covering login, menu-bar access, background operation and updates. Each new scroll gesture triggers one timed handoff, then holds the feature for reading. Feature text keeps the shared line reveal, with headline and subtitle lines travelling together. Reversing scroll retraces an active handoff immediately; panels continue smoothly after scrolling stops. Each panel fits the viewport with 64px above and below. Arrow/Page keys and Space also advance or return through the features. All four messages remain available in screen-reader reading order independently of visual playback. The desktop experience starts at 1056px; narrower windows show a placeholder. Reduced motion retains a stationary hero and shows the feature rows in normal page flow.

## Work locally

Checkout: `/Users/george/Projects/glissform-website-next`. Requires Node 22.12 or later; Node 24 is used locally.

```sh
npm ci
npm run dev       # development server: http://127.0.0.1:5180/
npm run build     # typecheck and generate dist/
npm run preview   # built preview: http://127.0.0.1:4180/
```

The review preview serves `dist/`, so rebuild after source changes and refresh the browser to see them. Start the preview if it is not running. Astro background servers can be stopped with `npx astro dev stop` or `npx astro preview stop`. Documentation-only edits need no rebuild.

Follow [AGENTS.md](AGENTS.md) for design consistency, code structure, preview updates and verification. Relevant checks before an authorized push or upload are listed in [package.json](package.json), including `test:seo`, `test:hardware`, `test:hero-animation` and `test:hero-stars`; do not run them routinely for small visual edits.

## Find the code

| Location | Purpose |
| --- | --- |
| `src/pages/index.astro` | Page HTML, metadata and narrow-window placeholder. |
| `src/home-next/` | V2 hero, Settings feature scroll sequence, shared line-based text motion, navigation, styles, choreography, display geometry and Three.js hardware. |
| `src/hero-test/`, `src/hero-test-animation/` | Existing star interactions, assets and projection helpers reused by v2; also contain earlier studies. |
| `public/models/` | Prepared local model assets and provenance. |
| `scripts/`, `tests/` | Build/asset utilities and focused checks. |

Earlier Vite sources remain in the checkout but are not routes in the Astro build or a design reference for v2. V2's current styles and components define the visual direction.

See [Motion guidelines](docs/MOTION.md) for rules covering text, visuals, composed units and collections, with separate choices for emphasis, size and timing driver. The [Hero motion reference](docs/MOTION_HERO_REFERENCE.md) records the current implementation settings. The hero navbar stays visible; the fixed top navbar hides after 80px downward beyond the MacBook section's release and returns after 40px upward. Shared motion lives in `textRevealMotion.ts`, `choreography.ts`, `heroEntrance.ts` and `navigationScroll.ts` under `src/home-next/`.

## Local and production boundaries

This candidate is local and uses `noindex, nofollow`. V1 at `/Users/george/Projects/glissform-website` and glissform.app are separate. Do not push or publish without explicit authorization; the existing `main` deployment workflow publishes to production. Existing navigation/download links lead to public destinations, which does not mean v2 is published. The website animation does not capture the visitor's screen or read a lid sensor.

## Reference

- [CHANGELOG](CHANGELOG.md): completed work and local/published status.
- [Model provenance](public/models/README.md) and [hero asset provenance](src/hero-test/assets/README.md): sources, preparation and notices.
- [Archive](docs/archive/): earlier implementation notes, browser validation, loading audit and retired roadmap. Historical context only; no ongoing maintenance required.
