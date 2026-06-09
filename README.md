# CHRONICA3000

Barcelona-based cinematic production collective — custom website.

Built on **Astro 5** (static output, zero JS by default) with **CSS Modules + design tokens**.
Folder-based content — every project lives in its own folder under `src/content/projects/`.
Sections render *only* when their files exist. No empty placeholders, no dead UI.

## Adding a project

**👉 See [HOW-TO-ADD-A-PROJECT.md](./HOW-TO-ADD-A-PROJECT.md)** — plain-language guide.

In short: one folder per project under `src/content/projects/<slug>/`.
Visibility/order managed in three plain-text files at
`src/content/collections/{highlights,works,archive}.txt` — one slug per
line, line order = display order. Copy `src/content/_PROJECT_TEMPLATE/`
to start something new.

## Quick start

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static export to ./dist (deploy anywhere)
npm run preview  # preview the production build locally
```

No backend, no database, no env vars required.

### Maintenance scripts

```bash
npm run sync    # regenerate Astro content collection types + cache
npm run clean   # delete .astro/, dist/, and node_modules/.vite
npm run fresh   # clean + sync + dev — recovers from cache-state errors
```

## Troubleshooting

### "I edited a `project.json` but the change doesn't show up"

Restart the dev server: stop it (Ctrl+C) and run `npm run dev` again.
The `predev` hook in `package.json` runs `astro sync` automatically before
`astro dev`, so a restart is always a clean state.

If a restart isn't enough, the on-disk Astro cache is stale:

```bash
npm run fresh
```

### `Failed to load url /.astro/content-assets.mjs`

Astro's content-collection cache (`.astro/`) is missing — `astro sync`
didn't write the file. Recover with:

```bash
npm run fresh
```

If `npm run sync` itself errors out, that error is the real diagnosis —
copy the message and we can fix it (usually a typo in `src/content.config.ts`
or a schema mismatch in a `project.json`).

### A homepage highlight is "missing"

If a featured project doesn't appear on the homepage even though its
`project.json` has `"featured": true`:

1. `npm run fresh` — wipes the stale cache, re-syncs, re-runs.
2. If still missing: run `npm run sync` alone and read the output for any
   `[content] warn` or `[content] error` line referring to that project.

## Code structure (developer reference)

```
src/
├── content.config.ts                 # Zod schema + custom folder-based loader
├── content/_PROJECT_TEMPLATE/        # template — copy this to start a new project
├── content/collections/*.txt         # visibility + order manifests
├── content/projects/<slug>/          # one folder per project
├── data/archiveExtras.ts             # archive-only mentions (no folder, no page)
├── lib/
│   ├── collections.ts                # reads collections/*.txt
│   ├── projects.ts                   # tier loaders + category grouping
│   ├── projectAssets.ts              # disk-based asset discovery (import.meta.glob)
│   ├── projectFiles.ts               # disk-based text file reading (fs)
│   └── credits.ts                    # credits.md / main-credits.md parser
├── layouts/BaseLayout.astro
├── components/
│   ├── Nav.astro                     # floating / solid; wordmark + back + links
│   ├── ReelHero.astro                # centered tagline, fullscreen reel
│   ├── HighlightedWorks.astro        # full-viewport snap sections
│   ├── WorksGrid.astro               # category-grouped responsive grid
│   ├── ArchiveList.astro             # brutalist list with inversion hover
│   ├── ProjectVideo.astro            # main.mp4 > bunny > youtube > poster
│   ├── Credits.astro                 # main + expandable
│   ├── MediaGrid.astro               # stills/bts gallery
│   ├── LinkButtons.astro             # /links/*.txt → outline buttons
│   └── ContactSection.astro          # centered editorial block
├── pages/
│   ├── index.astro                   # /
│   ├── works.astro                   # /works
│   ├── archive.astro                 # /archive
│   └── [slug].astro                  # /<slug> — conditional renderer
└── styles/
    ├── tokens.css                    # CSS custom properties
    └── global.css

public/
├── video/reel.mp4                    # homepage background reel
└── img/chronica-mark.png             # nav wordmark
```

## Smart back button

Inner pages remember where you came from via `sessionStorage` — clicking a
project tile on `/works` stores `/works`, and the project page's "← back"
returns there. Falls back to `/works` if no source is recorded.

## Video strategy

**Phase 1 (now):** YouTube embeds on project pages, self-hosted MP4 on homepage.
**Phase 2:** swap YouTube URLs for Bunny Stream/CDN URLs — same schema, no code change.
Replace homepage `reel.mp4` with a Bunny-hosted file when ready.

## Design tokens

All colors, type scale, spacing, and motion live in `src/styles/tokens.css` as
CSS custom properties. Components only reference tokens (`var(--c-ink)`,
`var(--fs-body)`, …), never raw values.

Typography: **Roboto Mono** everywhere except the **archive page**, which uses
**Inter 700** for the brutalist typographic list.

## Deployment

`npm run build` outputs a fully static site to `./dist/`. Drop it on Vercel,
Netlify, Cloudflare Pages, S3, or GitHub Pages — no host lock-in
(`astro.config.mjs` sets `output: 'static'`).

---

Made by Chronica. Barcelona, worldwide.
