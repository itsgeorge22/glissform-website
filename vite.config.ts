import { defineConfig } from 'vite';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { siteUrl, siteTitle, siteDescription, socialImage, softwareApplication } from './src/siteMetadata';

const mime: Record<string, string> = {
  html: 'text/html; charset=utf-8', js: 'application/javascript', css: 'text/css', svg: 'image/svg+xml',
};

// A local-only viewer keeps the responsive page at a phone/tablet width
// inside the app's wider browser panel. It is not part of the deployed build.
function mobilePreview(request: IncomingMessage, response: ServerResponse, next: () => void) {
  const url = new URL(request.url ?? '/', 'http://localhost');
  if (url.pathname === '/__preview/static-page' && existsSync(resolve('dist/index.html'))) {
    // Inspect the built HTML with its module entry removed: no hydration or demo.
    const html = readFileSync(resolve('dist/index.html'), 'utf8')
      .replace(/<script\b[^>]*\btype="module"[^>]*>[^]*?<\/script>/g, '')
      .replace(/<noscript>([^]*?)<\/noscript>/g, '$1');
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Robots-Tag', 'noindex');
    response.setHeader('Content-Security-Policy', "script-src 'none'");
    response.end(request.method === 'HEAD' ? undefined : html);
    return;
  }
  const compact = url.pathname === '/__preview/compact';
  if (!compact && url.pathname !== '/__preview/mobile') return next();
  const requested = Number(url.searchParams.get('width'));
  const widths = compact ? [768, 769, 834, 1024, 1155, 1156] : [320, 375, 390, 430, 640, 768];
  const width = widths.includes(requested) ? requested : compact ? 834 : 390;
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Robots-Tag', 'noindex');
  response.end(request.method === 'HEAD' ? undefined : `<!doctype html>
<html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Glissform — ${compact ? 'Compact' : 'Mobile'} Preview</title>
<style>html,body{margin:0;height:100%;background:#eef1f5}body{display:flex;justify-content:center}iframe{border:0;width:min(${width}px,100%);height:100%;background:#fafbfd;box-shadow:0 0 32px #1d1d1f12}${compact ? `iframe{position:absolute;top:0;left:50%;width:${width}px;transform-origin:top center}` : ''}</style></head>
<body><iframe src="${url.searchParams.get('static') === '1' ? '/__preview/static-page' : '/'}" title="Glissform ${width}px preview"></iframe>${compact ? `<script>const frame=document.querySelector('iframe');function fit(){const scale=Math.min(1,innerWidth/${width});frame.style.transform='translateX(-50%) scale('+scale+')';frame.style.height=innerHeight/scale+'px'}addEventListener('resize',fit);fit()</script>` : ''}</body></html>`);
}

export default defineConfig({
  appType: 'mpa',
  build: { assetsInlineLimit: 0 },
  plugins: [{
    name: 'site-metadata',
    transformIndexHtml(_html, context) {
      if (context.path !== '/' && context.path !== '/index.html') return [];
      const meta = (property: string, content: string) => ({ tag: 'meta', attrs: { property, content } });
      return [
        { tag: 'link', attrs: { rel: 'canonical', href: siteUrl } },
        meta('og:type', 'website'), meta('og:site_name', 'Glissform'),
        meta('og:url', siteUrl), meta('og:title', siteTitle), meta('og:description', siteDescription),
        meta('og:image', socialImage), meta('og:image:width', '1200'), meta('og:image:height', '630'),
        meta('og:image:type', 'image/png'), meta('og:image:alt', 'Glissform — Subtle animations for everyday Mac moments'),
        ...Object.entries({ 'twitter:card': 'summary_large_image', 'twitter:title': siteTitle, 'twitter:description': siteDescription, 'twitter:image': socialImage, 'twitter:image:alt': 'Glissform — Subtle animations for everyday Mac moments' }).map(([name, content]) => ({ tag: 'meta', attrs: { name, content } })),
        { tag: 'script', attrs: { type: 'application/ld+json' }, children: JSON.stringify(softwareApplication).replace(/</g, '\\u003c') },
      ].map(tag => ({ ...tag, injectTo: 'head' as const }));
    },
  }, {
    name: 'compressed-production-preview',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = new URL(request.url ?? '/', 'http://localhost');
        if (url.pathname === '/hero-test' || url.pathname === '/hero-test/') request.url = '/hero-test.html' + url.search;
        if (url.pathname.startsWith('/hero-test')) response.setHeader('X-Robots-Tag', 'noindex, nofollow');
        next();
      });
      server.middlewares.use(mobilePreview);
    },
    configurePreviewServer(server) {
      server.middlewares.use(mobilePreview);
      const root = resolve('dist');
      server.middlewares.use((request, response, next) => {
        const url = new URL(request.url ?? '/', 'http://localhost');
        const file = resolve(root, '.' + (url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname)));
        if (!file.startsWith(root + sep)) return next();
        const hashed = /\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.[a-z0-9]+$/.test(url.pathname);
        response.setHeader('Cache-Control', hashed ? 'public, max-age=31536000, immutable' : 'no-cache');
        const type = mime[file.split('.').at(-1) ?? ''];
        if (!type) return next();
        response.setHeader('Vary', 'Accept-Encoding');
        if (!/\bgzip\b(?!\s*;\s*q=0(?:\.0*)?(?:\s*,|$))/.test(request.headers['accept-encoding'] ?? '')
          || !(file.endsWith('.html') ? existsSync(file) : existsSync(file + '.gz'))) return next();
        const body = file.endsWith('.html') ? gzipSync(readFileSync(file)) : readFileSync(file + '.gz');
        response.setHeader('Content-Type', type);
        response.setHeader('Content-Encoding', 'gzip');
        response.setHeader('Content-Length', body.length);
        response.end(request.method === 'HEAD' ? undefined : body);
      });
    },
  }],
});
