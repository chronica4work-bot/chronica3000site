import { defineConfig } from 'astro/config';

// Chronica3000 — static portable export.
// No host lock-in. Deploy the contents of /dist anywhere
// (Vercel, Netlify, Cloudflare Pages, S3, GitHub Pages).
export default defineConfig({
  site: 'https://chronica3000.com',
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'file',
    assets: '_assets',
  },
  compressHTML: true,
});
