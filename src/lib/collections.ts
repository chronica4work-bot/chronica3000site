/**
 * Visibility collections — plain-text manifest files.
 *
 *   src/content/collections/highlights.txt
 *   src/content/collections/works.txt
 *   src/content/collections/archive.txt
 *
 * Each file lists project SLUGS, one per line. Line ORDER is the canonical
 * sort order for that tier. Lines starting with `#` are comments. Blank lines
 * are ignored.
 *
 * Hierarchy:
 *   highlights → also auto-visible on /works and /archive
 *   works      → also auto-visible on /archive
 *   archive    → archive only
 *
 * A slug should appear in at most ONE file (the highest tier it belongs to).
 * The loaders in lib/projects.ts use this module as the source of truth for
 * visibility and ordering.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve('./src/content/collections');

function readSlugs(name: string): string[] {
  const path = resolve(ROOT, name);
  if (!existsSync(path)) return [];
  const text = readFileSync(path, 'utf-8');
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

/** Slugs on the homepage, in homepage order. */
export const highlights: string[] = readSlugs('highlights.txt');

/** Slugs that appear on /works but NOT the homepage, in display order. */
export const works: string[] = readSlugs('works.txt');

/** Slugs that appear ONLY on /archive, in display order. */
export const archive: string[] = readSlugs('archive.txt');

/* ---------- helpers used by lib/projects.ts ---------- */

/** Ordered list of every slug visible on /works (highlights first, then works). Deduped. */
export function worksSlugs(): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of [...highlights, ...works]) {
    if (!seen.has(s)) { seen.add(s); out.push(s); }
  }
  return out;
}

/** Ordered list of every slug visible on /archive (highlights → works → archive). Deduped. */
export function archiveSlugs(): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of [...highlights, ...works, ...archive]) {
    if (!seen.has(s)) { seen.add(s); out.push(s); }
  }
  return out;
}

/** Is this slug in highlights? */
export function isHighlight(slug: string): boolean {
  return highlights.includes(slug);
}
