/**
 * Build-time discovery of BINARY assets inside project folders.
 *
 * We use Vite's `import.meta.glob` with `eager: true` and `query: '?url'` so each
 * asset is bundled with a hashed URL — and so missing assets simply don't appear
 * in the map (which is what enables conditional rendering downstream).
 *
 * Supported per project:
 *   src/content/projects/<slug>/poster.{jpg,jpeg,png,webp}
 *   src/content/projects/<slug>/main.{mp4,webm,mov}
 *   src/content/projects/<slug>/stills/*.{jpg,jpeg,png,webp}
 *   src/content/projects/<slug>/bts/*.{jpg,jpeg,png,webp}
 *
 * Add another asset type? Add a new glob below + a new field on ProjectMedia.
 */

const posterModules = import.meta.glob(
  '/src/content/projects/*/poster.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}',
  { eager: true, query: '?url', import: 'default' }
) as Record<string, string>;

const mainVideoModules = import.meta.glob(
  '/src/content/projects/*/main.{mp4,webm,mov}',
  { eager: true, query: '?url', import: 'default' }
) as Record<string, string>;

/**
 * Homepage highlight loop. Optional — when present, the homepage highlight
 * section plays this on top of the poster (muted, autoplay, loop). When
 * absent, the section is just the poster. See HighlightedWorks.astro.
 */
const highlightVideoModules = import.meta.glob(
  '/src/content/projects/*/highlight.{mp4,webm}',
  { eager: true, query: '?url', import: 'default' }
) as Record<string, string>;

/**
 * Works-page hover preview. Optional — when present, the Works grid tile
 * plays this on pointer hover (muted, looped). When absent, the tile is
 * just the poster. See WorksGrid.astro.
 */
const hoverVideoModules = import.meta.glob(
  '/src/content/projects/*/hover.{mp4,webm}',
  { eager: true, query: '?url', import: 'default' }
) as Record<string, string>;

const stillsModules = import.meta.glob(
  '/src/content/projects/*/stills/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}',
  { eager: true, query: '?url', import: 'default' }
) as Record<string, string>;

const btsModules = import.meta.glob(
  '/src/content/projects/*/bts/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}',
  { eager: true, query: '?url', import: 'default' }
) as Record<string, string>;

function pickFirst(modules: Record<string, string>, slug: string): string | undefined {
  const prefix = `/src/content/projects/${slug}/`;
  for (const key of Object.keys(modules)) {
    if (key.startsWith(prefix)) return modules[key];
  }
  return undefined;
}

function pickAll(modules: Record<string, string>, slug: string): string[] {
  const prefix = `/src/content/projects/${slug}/`;
  return Object.keys(modules)
    .filter((k) => k.startsWith(prefix))
    .sort()
    .map((k) => modules[k]);
}

export interface ProjectMedia {
  poster?: string;
  mainVideo?: string;
  /** highlight.mp4/webm — autoplay loop on the homepage, layered over the poster. */
  highlightVideo?: string;
  /** hover.mp4/webm — plays on Works grid tile hover (desktop only). */
  hoverVideo?: string;
  stills: string[];
  bts: string[];
}

/** All discoverable media for a given project, with conditional fields. */
export function getProjectMedia(slug: string): ProjectMedia {
  return {
    poster: pickFirst(posterModules, slug),
    mainVideo: pickFirst(mainVideoModules, slug),
    highlightVideo: pickFirst(highlightVideoModules, slug),
    hoverVideo: pickFirst(hoverVideoModules, slug),
    stills: pickAll(stillsModules, slug),
    bts: pickAll(btsModules, slug),
  };
}

/**
 * Extract the YouTube video id from a URL (or bare 11-char id).
 * Returns null if it doesn't look like one.
 */
export function youtubeId(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
  if (m) return m[1];
  return /^[\w-]{11}$/.test(url) ? url : null;
}

/** YouTube thumbnail URL — useful as a poster fallback when no poster.jpg exists. */
export function youtubePoster(url?: string | null): string | null {
  const id = youtubeId(url);
  // `hqdefault` always exists (maxres only for HD uploads). Trade quality for reliability.
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

/**
 * Best available poster for a project:
 *   1. on-disk poster.jpg
 *   2. YouTube thumbnail (if a youtube URL is configured)
 *   3. undefined → caller renders a placeholder
 */
export function bestPoster(slug: string, youtubeUrl?: string | null): string | undefined {
  const media = getProjectMedia(slug);
  return media.poster ?? youtubePoster(youtubeUrl) ?? undefined;
}
