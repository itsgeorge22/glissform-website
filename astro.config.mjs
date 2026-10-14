import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

const deployV2 = process.env.DEPLOY_V2 === '1';

// V2 remains a noindex test candidate, including built output.
export default defineConfig({
  site: 'https://glissform.app',
  base: deployV2 ? '/v2/' : '/',
  trailingSlash: 'always',
  outDir: deployV2 ? './dist-v2' : './dist',
  output: 'static',
  integrations: [react()],
  devToolbar: { enabled: false },
  build: { assets: 'assets' },
  vite: {
    server: { strictPort: true, headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    preview: { strictPort: true, headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
  },
});
