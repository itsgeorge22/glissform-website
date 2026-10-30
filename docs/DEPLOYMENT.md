# Production deployment

The static Astro site deploys to the Vercel project `glissform-website` in George’s projects, connected to the private `itsgeorge22/glissform-website` repository. Production branch: `main`; build: `npm run build`; output: `dist`. Configuration lives in `vercel.json`.

## Publish

Run `npm run build` and `npm run test:deploy`, then push an authorized change to `main`. Vercel publishes automatically; GitHub Actions independently verifies the site. Check the deployed commit and affected live routes.

The deployment hostname is https://glissform-website.vercel.app/ and the canonical site is https://glissform.itsgeorge.pro/. Cloudflare DNS contains one DNS-only CNAME named `glissform` pointing to `928b76af860b7514.vercel-dns-017.com`. The portfolio’s root, www and email records are independent and must remain unchanged.

## Downloads and updates

`vercel.json` maps the existing versioned `/downloads/` installer and checksum addresses to immutable public GitHub Release assets. It also sets security and feed caching headers and redirects legacy `/v2` routes to `/`. Keep the Search Console verification file.

`public/updates/appcast.xml` is the signed production feed, offering 0.1.0 (build 21). **Do not format, edit or regenerate it without the Sparkle signing key and a separately authorized release.** The feed bytes and each installer are signed. Hosting changes do not change versions, tags or release assets.

For a future authorized release, publish and verify the signed installer and checksum on GitHub first, add its exact download redirects, then publish the newly signed feed. Verify public feed bytes, signatures and an installed-app update check.

## Legacy domain and recovery

The old `glissform.app` registration and Vercel binding remain in place for existing links and installed apps. Its nameservers are `ns1.vercel-dns.com` and `ns2.vercel-dns.com`. The Glissform Cloudflare zone and Pages project were deleted with the owner's approval on 2026-10-30. The old `_redirects` and `_headers` files are retained as migration references; Vercel uses `vercel.json`.

No further app updates are planned. Existing 0.1.0 installers still check `https://glissform.app/updates/appcast.xml`; retiring that domain can cause update-check errors. Do not modify the signed feed to change its URLs. Downloads from the new website continue to use GitHub Releases independently of the old registration.

Support contact: 4niklap@gmail.com. The Glissform mailbox was removed. Vercel deployments can be restored from its dashboard. Original VPS and DNS backups are outside Git in `~/Documents/Glissform-migration-2026-10-30/`; the VPS has not been cancelled.

[Former VPS deployment instructions](archive/VPS_DEPLOYMENT.md) are historical reference only.
