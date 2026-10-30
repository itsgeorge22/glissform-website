# Production deployment

The existing Astro site is hosted by the Cloudflare Pages project `glissform-website`, connected only to `itsgeorge22/glissform-website`. Production branch: `main`; Node: `22`; build command: `npm run build && npm run test:deploy`; output directory: `dist`.

## Publish

Run the build and deployment checks, then push an authorized change to `main`. Pages builds and publishes automatically. GitHub Actions independently verifies the website and no longer uploads to the VPS. Check the deployed commit and status in Cloudflare, then inspect the affected live routes.

The preview hostname is https://glissform-website.pages.dev/. The canonical site is https://glissform.app/. Both the root and `www` custom domains are active with HTTPS. Beget email DNS records must be preserved. Unrelated Cloudflare domains must not change.

## Downloads and updates

`public/_redirects` maps existing versioned `/downloads/` DMG and checksum addresses to immutable GitHub Release assets. Keep the app repository public for unauthenticated downloads. Existing website buttons and installed apps retain their original URLs.

`public/updates/appcast.xml` is the signed production feed, currently offering 0.1.0 (build 21). **Do not format, edit or regenerate it without the Sparkle signing key and a separately authorized release.** A signature covers the file bytes, and each installer has its own signature. This hosting migration does not change the app version, tags or release assets.

`public/_headers` sets security and feed caching headers. Search Console's existing verification file is retained. `/v2`, `/v2/` and `/v2/index.html` redirect to `/`; `www` redirects to the canonical host through the zone-level rule below.

For any future release: publish and verify the signed installer and checksum on GitHub Releases, add its exact legacy download redirects, then publish the newly signed feed through Pages. Verify the public feed bytes and signatures and an installed-app update check. Never publish a feed before its installer is publicly downloadable.

## Canonical hostname

Cloudflare Single Redirect `Glissform www to canonical root` matches `(http.host eq "www.glissform.app")`, redirects dynamically to `concat("https://glissform.app", http.request.uri.path)` with status 301, and preserves query strings. Domain-level rules are not supported in Pages `_redirects`; keep this rule in the `glissform.app` zone.

## Migration verification and rollback

Cutover completed on 2026-10-30. Both custom domains have active HTTPS. Verified the homepage and privacy page, 21 homepage assets, all 18 installer/checksum redirects, the downloaded rc.2 checksum, the byte-identical signed feed, discovery files and the Search Console file (served through Pages’ same-host clean-URL redirect). All original Beget MX, SPF and email autoconfiguration records match. The www redirect preserves paths and query strings.

The owner confirmed that the installed rc.2 app successfully checked for updates after migration on 2026-10-30. The subsequent upgrade to 0.1.0 has not been exercised on an installed app; new app testing was explicitly waived for that release. The VPS has not been cancelled.

The pre-migration public web root and original DNS records are backed up outside Git in `~/Documents/Glissform-migration-2026-10-30/`. The VPS remains available at its existing address. Restore the original web A records or previous Beget nameservers if cutover fails; do not delete the Pages project or existing DNS records as a rollback shortcut. A previous Pages deployment can also be restored through its dashboard.

[Former VPS deployment instructions](archive/VPS_DEPLOYMENT.md) are historical reference only.
