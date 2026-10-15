# Production deployment

The Astro homepage publishes at `https://glissform.app/`. The reviewed v2 layout is the production source; `/v2`, `/v2/` and `/v2/index.html` redirect permanently to `/`. Their assets remain available to cached pages. Local development and preview servers send `X-Robots-Tag: noindex, nofollow`; production HTML allows indexing and uses the root canonical URL.

## Publish an approved change

1. Run `npm run build` and `npm run test:deploy`, refresh the built preview on port 4180, and review the affected viewports.
2. Commit the approved source. Push to `main` only with publication authorization. `.github/workflows/deploy.yml` builds and validates the same source on Node 22 before sending the archive through the restricted SSH receiver.
3. Verify `https://glissform.app/deployment.json` matches the intended full commit SHA. Check the live HTML, assets, model, canonical/robots metadata, downloads, update feed and redirects. A successful push alone is not deployment verification.

The receiver at `/usr/local/lib/glissform-website-receive.py` is installed from `scripts/receive-deploy.py` and runs as `glissform-website-deploy`. It accepts only `deploy <40-character commit SHA>`, rejects traversal/links/unrelated paths, and retains the legacy preview-page allowlist for rollback. The current workflow archives only `index.html`, `privacy/index.html`, `robots.txt`, `sitemap.xml`, `llms.txt`, `assets/` and `models/`. Downloads, updates, Google verification and old assets are never part of the uploaded archive. Dependencies publish first, then HTML and the marker are atomically replaced.

Before the first `llms.txt` deployment, install the updated receiver: the previous allowlist rejects this new root file. Install the updated performance snippet too so the AI guide uses the same cache revalidation as the other discovery files. The guide publishes before the HTML that links to it; older archives without it remain accepted.

## Analytics rollout

Before the first analytics website deployment, install the updated `scripts/receive-deploy.py` on the server: the previous receiver rejects `privacy/index.html`. Its narrow allowlist accepts only that page HTML, not arbitrary files beneath privacy. Upload assets and the privacy page before atomically replacing the homepage.

Review the consent banner on phone/tablet/desktop, decline then reload, allow and verify a test page view plus a download click, then withdraw. Production dashboard filters must remain `environment=production`. Publish the privacy page before releasing the analytics-enabled native app. Its wording is release-independent; update it when privacy practices change.

## Server configuration

Server configuration is maintained separately from content deployment and requires the existing administrator SSH identity. No keys or credentials belong in this repository.

- Install `config/website-security.nginx.conf` at `/etc/nginx/snippets/glissform-website-security.conf` before installing the site/performance configuration that includes it.
- Install `config/website-performance.nginx.conf` at `/etc/nginx/snippets/glissform-website-performance.conf`.
- Install `config/website.nginx.conf` at `/etc/nginx/sites-available/glissform.app`; its enabled symlink must remain present. Run `nginx -t` before reloading Nginx.
- Both HTTPS virtual hosts enable HTTP/2 with the `listen ... ssl http2` syntax supported by the deployed Nginx 1.24. Confirm the server has `http_v2_module` before reloading and verify that a client offering `h2` negotiates it afterward.
- The Let's Encrypt `glissform.app` certificate must cover both `glissform.app` and `www.glissform.app`. HTTP serves `/.well-known/acme-challenge/` from `/var/www/glissform.app`, permitting webroot renewal; other HTTP traffic redirects to canonical HTTPS. The system Certbot timer handles renewal.
- Install `config/renew-glissform-certificate.sh` in `/etc/letsencrypt/renewal-hooks/deploy/` with mode `0755` so successful webroot renewals validate and reload Nginx to serve the new certificate.
- Fingerprinted Astro assets receive immutable caching. Homepage and privacy HTML (including directory URLs), discovery files, the deployment marker, models, retained legacy Vite files and unfingerprinted assets revalidate. Preserve existing download and appcast caching.

### Staged security rollout

The checked-in configuration is installed separately; a website build or push does not install it on the server. Install all three configuration files together only during an authorized server change. Every location that defines `add_header` includes the shared security snippet because Nginx 1.24 does not merge parent headers into such locations. After reload, check headers on the homepage, privacy page, redirects, a missing path and representative assets, downloads and update-feed responses; check that cache policies are unchanged apart from privacy HTML.

The first stage enforces framing protection (`frame-ancestors 'none'` and `X-Frame-Options: DENY`), object/base restrictions, MIME checking and same-origin opener isolation. It sets a referrer policy and starts HSTS at one day, without `includeSubDomains` or preload. Verify both HTTPS hostnames and certificate renewal before extending HSTS to one year. Cover every subdomain before considering `includeSubDomains`; preload is a separate long-lived decision.

Script/resource restrictions and Trusted Types remain **report-only**. They do not yet provide strict CSP/XSS enforcement or satisfy the corresponding Lighthouse hardening recommendations. Review their browser console diagnostics on the built homepage and privacy page, including desktop WebGL, compact/reduced-motion views, navigation, installation-guide open/close, and analytics decline/allow/withdraw. The candidate permits same-origin assets, local blob images/workers, existing inline animation styles and only `https://eu.i.posthog.com` for external connections. Consent continues to control whether analytics requests occur. No reporting endpoint or new visitor telemetry is configured.

Astro currently emits inline bootstrap scripts, so the candidate intentionally reports those until a build-managed hash policy or appropriately generated nonces is implemented. Review Trusted Types sinks and supported browser behavior before enforcement; do not silence them with a permissive default policy. Resolve legitimate diagnostics and repeat the affected interactions before replacing the report-only policy with an enforced one. Keep the minimal enforced policy in place during that evaluation. See [Chrome's CSP rollout guidance](https://web.dev/articles/strict-csp) and [Nginx header inheritance](https://nginx.org/en/docs/http/ngx_http_headers_module.html#add_header).

## Rollback

Before the homepage promotion or future server changes, save a root-owned backup outside the public web root under `/var/backups/glissform-website/`. Include the previous root HTML, discovery files, deployment marker, current Nginx site and both snippets, and deployment receiver. Record hashes of downloads, the update feed and Google verification so preservation can be verified. Existing asset files must remain available.

To restore the old homepage, acquire `/home/glissform-website-deploy/deploy.lock`, restore the backed-up root discovery files, atomically replace `index.html`, and restore the matching deployment marker last. Retained assets satisfy the old HTML. If reverting server configuration, restore the saved site and matching snippets together, run `nginx -t`, and reload. Keep the expanded valid TLS certificate. Do not restore or delete downloads or update feeds. Verify the restored marker, homepage and release endpoints before reporting rollback complete.

Indexability permits crawling; it does not confirm Google has indexed the new page. The existing Search Console verification is retained. After publication, URL Inspection can request a fresh crawl of the canonical homepage; the root sitemap remains the discovery source.
