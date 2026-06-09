import { getCollection, type CollectionEntry } from 'astro:content';
import { archiveExtras, type ArchiveExtra } from '../data/archiveExtras';
import * as col from './collections';

export type Project = CollectionEntry<'projects'>;

/**
 * Visibility + ordering come from the plain-text manifests in
 * src/content/collections/. The .txt files are the source of truth —
 * project.json holds only the project's own metadata (title, year, crew, etc.).
 *
 * Hierarchy is automatic:
 *   slug listed in highlights.txt → shows on homepage + /works + /archive
 *   slug listed in works.txt      →                  /works + /archive
 *   slug listed in archive.txt    →                           /archive
 *
 * Within each surface, the order matches the line order across the
 * relevant manifest(s). See lib/collections.ts.
 */

/** All non-draft projects, mapped slug → entry. */
async function loadMap(): Promise<Map<string, Project>> {
  const all = await getCollection('projects', ({ data }) => data.draft !== true);
  return new Map(all.map((p) => [p.data.slug, p]));
}

/** Resolve a list of slugs to Project entries, dropping any that don't exist. */
function resolveSlugs(slugs: string[], map: Map<string, Project>): Project[] {
  const out: Project[] = [];
  for (const slug of slugs) {
    const p = map.get(slug);
    if (p) out.push(p);
  }
  return out;
}

/** Every project that lives in a collection file (any tier), in priority order. */
export async function loadProjects(): Promise<Project[]> {
  const map = await loadMap();
  return resolveSlugs(col.archiveSlugs(), map);
}

/** Featured projects → homepage highlights. Order = line order in highlights.txt. */
export async function loadFeatured(): Promise<Project[]> {
  const map = await loadMap();
  return resolveSlugs(col.highlights, map);
}

/** Featured + works → /works grid. Drops entries that don't have a project page. */
export async function loadForWorks(): Promise<Project[]> {
  const map = await loadMap();
  return resolveSlugs(col.worksSlugs(), map).filter((p) => p.data.hasPage !== false);
}

/**
 * Featured + works + archive → /archive list (union).
 * Also appends archive-only mentions from src/data/archiveExtras.ts —
 * those are titles that have no folder/page.
 */
export async function loadForArchive(): Promise<Array<
  { kind: 'project'; entry: Project } | { kind: 'extra'; entry: ArchiveExtra }
>> {
  const map = await loadMap();
  const projects = resolveSlugs(col.archiveSlugs(), map)
    .map((entry) => ({ kind: 'project' as const, entry }));
  const extras = archiveExtras.map((entry) => ({ kind: 'extra' as const, entry }));
  return [...projects, ...extras];
}

/* ---------- category grouping (used by /works editorial sections) ---------- */

/**
 * Categories are rendered in this curated order on /works.
 * Anything not in this list falls to the end, sorted alphabetically.
 */
const CATEGORY_ORDER = [
  'narrative',
  'commercials',
  'fashion',
  'music video',
  'personal',
];

export interface CategoryGroup {
  /** Lowercase category name; used in the [bracket] label. */
  name: string;
  projects: Project[];
}

/**
 * Group projects by their **primary** (first) category.
 * Projects without any category fall under "uncategorized".
 *
 * Sort order on /works:
 *   1. by number of projects (most → fewest)
 *   2. tiebreaker: CATEGORY_ORDER index (narrative → commercials → … → personal)
 *   3. final tiebreaker: alphabetical
 *
 * Within a category, project order is preserved from the input array.
 */
export function groupByCategory(projects: Project[]): CategoryGroup[] {
  const groups = new Map<string, Project[]>();
  for (const p of projects) {
    const cat = (p.data.category[0] ?? 'uncategorized').toLowerCase();
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(p);
  }
  const sorted = Array.from(groups.keys()).sort((a, b) => {
    // 1. count desc
    const countDiff = groups.get(b)!.length - groups.get(a)!.length;
    if (countDiff !== 0) return countDiff;
    // 2. CATEGORY_ORDER tiebreaker
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  return sorted.map((name) => ({ name, projects: groups.get(name)! }));
}

/* ---------- taxonomy helpers (still available if filter UI returns later) ---------- */

export async function collectCategories(): Promise<string[]> {
  const all = await loadProjects();
  return Array.from(new Set(all.flatMap((p) => p.data.category))).sort();
}

export async function collectRoles(): Promise<string[]> {
  const all = await loadProjects();
  return Array.from(new Set(all.flatMap((p) => p.data.roles))).sort();
}

export async function collectCrew(): Promise<string[]> {
  const all = await loadProjects();
  const names = new Set<string>();
  for (const p of all) {
    for (const list of Object.values(p.data.team)) {
      (list ?? []).forEach((n) => names.add(n));
    }
  }
  return Array.from(names).sort();
}
