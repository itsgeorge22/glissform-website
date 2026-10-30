import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Production is the canonical homepage; local servers stay excluded below.
export default defineConfig({
  site: 'https://glissform.itsgeorge.pro',
  base: '/',
  trailingSlash: 'always',
  outDir: './dist',
  output: 'static',
  integrations: [react()],
  devToolbar: { enabled: false },
  // Deliver the shared styles with the small static pages instead of making
  // first paint wait for two more requests. Fonts remain independently cached.
  build: { assets: 'assets', inlineStylesheets: 'always' },
  vite: {
    server: { strictPort: true, headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    preview: { strictPort: true, headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
  },
});
