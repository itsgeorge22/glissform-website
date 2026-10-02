import { build } from 'vite';
import { readFile, writeFile, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

await build();
try {
  await build({
    build: { ssr: 'src/entry-server.tsx', outDir: '.prerender', emptyOutDir: true, copyPublicDir: false },
    ssr: { noExternal: ['gsap'] },
  });
  const { render } = await import(pathToFileURL(resolve('.prerender/entry-server.js')).href);
  let html = await readFile('dist/index.html', 'utf8');
  // This single-page site can ship its exact styles and three small WOFF2 faces
  // with the HTML: no stylesheet/font request chain. CSS also adjusts fallback font metrics.
  const stylesheet = html.match(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/);
  if (!stylesheet) throw new Error('Missing production stylesheet');
  let css = await readFile(resolve('dist', '.' + stylesheet[1]), 'utf8');
  const fontUrls = [...new Set(css.match(/\/assets\/inter-latin-[456]00-normal-[\w-]+\.woff2/g))];
  if (fontUrls.length !== 3) throw new Error('Expected three Inter WOFF2 faces');
  for (const url of fontUrls) {
    const font = await readFile(resolve('dist', '.' + url));
    css = css.replaceAll(url, `data:font/woff2;base64,${font.toString('base64')}`);
  }
  html = html.replace(stylesheet[0], () => `<style data-site-styles>${css}</style>`);
  if (!html.includes('<div id="root"></div>')) throw new Error('Missing prerender mount point');
  const markup = render();
  await writeFile('dist/index.html', html.replace('<div id="root"></div>', () => `<div id="root">${markup}</div>`));
} finally {
  await rm('.prerender', { recursive: true, force: true });
}
await import('./compress-assets.mjs');
