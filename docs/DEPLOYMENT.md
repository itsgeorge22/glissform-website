# Production deployment

The existing Astro site is hosted by the Cloudflare Pages project `glissform-website`, connected only to `itsgeorge22/glissform-website`. Production branch: `main`; Node: `22`; build command: `npm run build && npm run test:deploy`; output directory: `dist`.

## Publish

Run the build and deployment checks, then push an authorized change to `main`. Pages builds and publishes automatically. GitHub Actions independently verifies the website and no longer uploads to the VPS. Check the deployed commit and status in Cloudflare, then inspect the affected live routes.

The preview hostname is https://glissform-website.pages.dev/. The canonical site remains https://glissform.app/; domain cutover must only occur after downloads and update checks are verified. Beget email DNS records must be preserved. Unrelated Cloudflare domains must not change.

## Downloads and updates

`public/_redirects` maps existing versioned `/downloads/` DMG and checksum addresses to immutable GitHub Release assets. Keep the app repository public for unauthenticated downloads. Existing website buttons and installed apps retain their original URLs.

`public/updates/appcast.xml` is the exact signed production feed. **Do not format, edit or regenerate it without the Sparkle signing key and a separately authorized release.** A signature covers the file bytes, and each installer has its own signature. This hosting migration does not change the app version, tags or release assets.

`public/_headers` sets security and feed caching headers. Search Console's existing verification file is retained. `/v2`, `/v2/` and `/v2/index.html` redirect to `/`; `www` redirects to the canonical host.

For any future release: publish and verify the signed installer and checksum on GitHub Releases, add its exact legacy download redirects, then publish the newly signed feed through Pages. Verify the public feed bytes and signatures and an installed-app update check. Never publish a feed before its installer is publicly downloadable.

## Migration verification and rollback

Before changing DNS, verify the Pages homepage and privacy page, redirects, installer checksums, signed feed and Search Console file. After cutover, repeat checks on glissform.app and www, and verify email records match the original Beget zone. Keep the VPS running until final acceptance.

The pre-migration public web root and original DNS records are backed up outside Git in `~/Documents/Glissform-migration-2026-10-30/`. The VPS remains available at its existing address. Restore the original web A records or previous Beget nameservers if cutover fails; do not delete the Pages project or existing DNS records as a rollback shortcut. A previous Pages deployment can also be restored through its dashboard.

[Former VPS deployment instructions](archive/VPS_DEPLOYMENT.md) are historical reference only.
