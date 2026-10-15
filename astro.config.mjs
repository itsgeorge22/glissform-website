import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Production is the canonical homepage; local servers stay excluded below.
export default defineConfig({
  site: 'https://glissform.app',
  base: '/',
  trailingSlash: 'always',
  outDir: './dist',
  output: 'static',
  integrations: [react()],
  devToolbar: { enabled: false },
  build: { assets: 'assets' },
  vite: {
    server: { strictPort: true, headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    preview: { strictPort: true, headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
  },
});
