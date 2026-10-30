# Production deployment

The static Astro site deploys to the Vercel project `glissform-website` in George’s projects, connected to the private `itsgeorge22/glissform-website` repository. Production branch: `main`; build: `npm run build`; output: `dist`. Configuration lives in `vercel.json`.

## Publish

Run `npm run build` and `npm run test:deploy`, then push an authorized change to `main`. Vercel publishes automatically; GitHub Actions independently verifies the site. Check the deployed commit and affected live routes.

The deployment hostname is https://glissform-website.vercel.app/ and the canonical site is https://glissform.app/. Both root and `www` connect to production; `vercel.json` redirects `www` to the root with paths and query strings preserved.

## Downloads and updates

`vercel.json` maps the existing versioned `/downloads/` installer and checksum addresses to immutable public GitHub Release assets. It also sets security and feed caching headers and redirects legacy `/v2` routes to `/`. Keep the Search Console verification file.

`public/updates/appcast.xml` is the signed production feed, offering 0.1.0 (build 21). **Do not format, edit or regenerate it without the Sparkle signing key and a separately authorized release.** The feed bytes and each installer are signed. Hosting changes do not change versions, tags or release assets.

For a future authorized release, publish and verify the signed installer and checksum on GitHub first, add its exact download redirects, then publish the newly signed feed. Verify public feed bytes, signatures and an installed-app update check.

## DNS migration status

On 2026-10-30, Beget accepted the change to `ns1.vercel-dns.com` and `ns2.vercel-dns.com`. Public propagation and custom-domain HTTPS verification are pending. The old Cloudflare Pages project and zone remain available until cutover is verified. Their `_redirects` and `_headers` files are retained during this transition. No other domains are in scope.

The owner removed the Glissform mailbox; obsolete Beget email records are not migrated. Public support contact: 4niklap@gmail.com.

Vercel’s deployment hostname passed all 20 installer/checksum redirect checks and served the byte-identical signed feed. The owner previously confirmed the installed rc.2 update check after the Cloudflare migration; an installed upgrade to 0.1.0 has not been tested. The VPS has not been cancelled.

## Recovery

The original web root and DNS records are backed up outside Git in `~/Documents/Glissform-migration-2026-10-30/`. During this transition, Cloudflare nameservers `jasper.ns.cloudflare.com` and `kara.ns.cloudflare.com` remain a rollback option while their zone exists. Vercel deployments can be restored from the dashboard. Do not delete the old hosting before public DNS and HTTPS checks pass.

[Former VPS deployment instructions](archive/VPS_DEPLOYMENT.md) are historical reference only.
