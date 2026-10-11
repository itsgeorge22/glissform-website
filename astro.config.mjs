import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// This is a local candidate. Publishing and indexing are separate decisions.
export default defineConfig({
  site: 'https://glissform.app',
  output: 'static',
  integrations: [react()],
  devToolbar: { enabled: false },
  build: { assets: 'assets' },
  vite: {
    server: { strictPort: true, headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    preview: { strictPort: true, headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
  },
});
