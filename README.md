# Glissform website

The website for **Glissform**, a free macOS app that adds perspective, blur and shadow as you close your MacBook lid.

[Visit the website](https://glissform.itsgeorge.pro/) · [Download Glissform](https://github.com/itsgeorge22/glissform/releases/latest) · [App source](https://github.com/itsgeorge22/glissform)

## About this repository

A static Astro site with React, TypeScript and SCSS. Three.js and GSAP power the interactive MacBook scene and feature demonstrations. Compact screens, reduced-motion preferences and browsers without WebGL receive simpler alternatives.

Active development is paused. The website, source and existing app downloads remain available; no further app releases are planned. This repository contains the website, not the native macOS app.

## Run locally

Requires Node.js 22.12 or later, npm and Python 3 for deployment checks.

```sh
git clone https://github.com/itsgeorge22/glissform-website.git
cd glissform-website
npm ci
npm run dev
```

Open http://127.0.0.1:5180/. To review a production build:

```sh
npm run build
npm run test:deploy
npm run preview
```

The built preview runs at http://127.0.0.1:4180/. Rebuild and refresh it after changes. Generated assets, build output and local environment files are excluded from Git.

## Project structure

| Path | Purpose |
| --- | --- |
| `src/pages/` | Homepage and privacy page. |
| `src/home-next/` | Current page sections, responsive navigation, motion and MacBook scene. |
| `src/siteMetadata.ts` | Website metadata and current download URL. |
| `src/site.scss`, `src/_colors.scss` | Shared styles and colour tokens. |
| `artwork/`, `public/assets/`, `public/models/` | Source artwork, assets and provenance. |
| `scripts/`, `tests/` | Asset preparation and deployment checks. |
| `vercel.json` | Hosting headers and versioned download redirects. |

Earlier Vite experiments and archived VPS configuration are retained as historical references; they do not define the production site.

## Hosting and privacy

Vercel deploys the static site from `main`. Installers are hosted on GitHub Releases. Versioned download redirects and the signed legacy update feed are preserved for existing users. See [deployment](docs/DEPLOYMENT.md) before changing these routes.

Website analytics are optional and require consent. There is no session recording or screen capture. See the [privacy policy](https://glissform.itsgeorge.pro/privacy/) and [analytics implementation](docs/ANALYTICS.md).

## Feedback and contributions

Use [website issues](https://github.com/itsgeorge22/glissform-website/issues) for broken links, accessibility problems and website bugs. App bugs belong in the [Glissform app repository](https://github.com/itsgeorge22/glissform/issues). Maintenance is limited; a response or fix is not guaranteed.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a change. Implementation guidance lives in [AGENTS.md](AGENTS.md), [motion guidelines](docs/MOTION.md) and the [hero reference](docs/MOTION_HERO_REFERENCE.md).

## Credits and licensing

Public source availability does not grant an open-source license. No project-wide license has been selected. Fonts and third-party assets retain their own notices; consult [model provenance](public/models/README.md), [hero asset credits](src/hero-test/assets/README.md), [artwork notes](artwork/README.md) and the included font licenses before reuse. Apple product imagery does not imply Apple endorsement.
