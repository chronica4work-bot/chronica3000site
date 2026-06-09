import { defineCollection, z } from 'astro:content';
import type { Loader } from 'astro/loaders';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * CHRONICA3000 — folder-based projects collection.
 *
 *   src/content/projects/<slug>/
 *     project.json     ← required: this file's existence is what defines a project
 *     credits.md       ← optional: full credits, parsed at render time
 *     poster.jpg       ← optional: tile/page poster
 *     main.mp4         ← optional: phase-2 self-hosted main reel
 *     stills/*.jpg     ← optional: stills gallery
 *     bts/*.jpg        ← optional: behind-the-scenes gallery
 *     links/*.txt      ← optional: external link buttons
 *
 * Everything but project.json is discovered conditionally at render time
 * via lib/projectAssets.ts and lib/projectFiles.ts. Project pages only
 * render sections they have data for. No dead UI.
 *
 * Visibility + ordering are managed in src/content/collections/*.txt:
 *   highlights.txt → homepage + /works + /archive
 *   works.txt      →            /works + /archive
 *   archive.txt    →                     /archive
 * project.json no longer carries `featured` / `works` / `archive` / `order`
 * — line position in the manifest files is the source of truth.
 *
 * NOTE on live editing: this loader does NOT register a chokidar watcher
 * (an earlier attempt to do so destabilised `astro sync`). Astro auto-
 * re-syncs collections via its own watcher when files inside `src/content/`
 * change. If a JSON edit doesn't show up in dev, restart the dev server
 * — `npm run dev` now runs `astro sync` first via the `predev` hook in
 * package.json, so a restart is always a clean state.
 */

const PROJECTS_ROOT = resolve('./src/content/projects');

const projectsLoader = {
  name: 'chronica-projects-loader',

  load: async ({ store, parseData, logger }) => {
    store.clear();

    let slugs: string[] = [];
    try {
      const dirents = await readdir(PROJECTS_ROOT, { withFileTypes: true });
      slugs = dirents
        .filter((d) => d.isDirectory())
        // Folders starting with "_" are templates / drafts — never published.
        .filter((d) => !d.name.startsWith('_'))
        .map((d) => d.name);
    } catch (err) {
      logger.warn(`projects root not found at ${PROJECTS_ROOT}; collection will be empty`);
      return;
    }

    for (const slug of slugs) {
      const jsonPath = join(PROJECTS_ROOT, slug, 'project.json');
      if (!existsSync(jsonPath)) {
        logger.warn(`skipping "${slug}" — no project.json`);
        continue;
      }
      try {
        const raw = await readFile(jsonPath, 'utf-8');
        const data = JSON.parse(raw);
        // Folder name wins over any slug stored in the JSON — single source of truth.
        data.slug = slug;
        const parsed = await parseData({ id: slug, data });
        store.set({ id: slug, data: parsed });
      } catch (err) {
        logger.error(`failed to load "${slug}": ${(err as Error).message}`);
      }
    }
  },
} satisfies Loader;

const projects = defineCollection({
  loader: projectsLoader,
  schema: z.object({
    // Identity
    slug: z.string(),
    title: z.string(),
    artist: z.string().optional(),
    track: z.string().optional(),

    // Metadata
    year: z.string(),
    location: z.string().optional(),

    // Taxonomy
    category: z.array(z.string()).default([]),
    roles: z.array(z.string()).default([]),

    // Crew — enables team/role filtering on /works.
    team: z.object({
      director:           z.array(z.string()).default([]),
      dp:                 z.array(z.string()).default([]),
      producer:           z.array(z.string()).default([]),
      productionDesigner: z.array(z.string()).default([]),
      stylist:            z.array(z.string()).default([]),
      editor:             z.array(z.string()).default([]),
      colorist:           z.array(z.string()).default([]),
    }).default({}),

    // Page-level flags (NOT visibility — visibility comes from collections/*.txt).
    hasPage: z.boolean().default(true),
    draft:   z.boolean().default(false),

    // Video URLs (in JSON). On-disk main.mp4 is discovered separately at render time.
    video: z.object({
      youtube:    z.string().default(''),
      bunny:      z.string().default(''),
      btsYoutube: z.string().default(''),  // optional BTS YouTube companion video
    }).default({}),
  }),
});

export const collections = { projects };
