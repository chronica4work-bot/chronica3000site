import { defineConfig } from 'astro/config';

// Chronica3000 — static portable export.
// No host lock-in. Deploy the contents of /dist anywhere
// (Vercel, Netlify, Cloudflare Pages, S3, GitHub Pages).
//
// IMPORTANT — build.format: 'directory'
// We want every route to produce `<route>/index.html`, NOT `<route>.html`.
// Reason: Vercel/Netlify/Cloudflare static servers natively serve
// `/works` → `works/index.html` without any rewrite config. With the
// previous `file` format we got `dist/works.html` at the root, which
// Vercel served as `/works.html` only — `/works` returned 404.
//
// 'directory' is Astro's default and the universal-host-safe choice.
// Combined with trailingSlash: 'never', URLs stay clean: `/works` not `/works/`.
export default defineConfig({
  site: 'https://chronica3000.com',
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'directory',
    assets: '_assets',
  },
  compressHTML: true,
});
