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
  const html = await readFile('dist/index.html', 'utf8');
  if (!html.includes('<div id="root"></div>')) throw new Error('Missing prerender mount point');
  const markup = render();
  await writeFile('dist/index.html', html.replace('<div id="root"></div>', () => `<div id="root">${markup}</div>`));
} finally {
  await rm('.prerender', { recursive: true, force: true });
}
await import('./compress-assets.mjs');
