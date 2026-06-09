/**
 * Build-time helpers for reading TEXT files inside a project folder.
 *
 * Astro pages render in Node at build time, so direct fs reads are safe here.
 * For BINARY assets (images, video) use lib/projectAssets.ts instead — those
 * have to be discovered via import.meta.glob so Vite hashes/bundles them.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve('./src/content/projects');

/** Absolute path to a project's folder on disk. */
export function projectDir(slug: string): string {
  return join(ROOT, slug);
}

/** Read a file relative to the project folder, or return null if it doesn't exist. */
export function readProjectFile(slug: string, relPath: string): string | null {
  const path = join(projectDir(slug), relPath);
  if (!existsSync(path)) return null;
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    return null;
  }
}

export function projectHasFile(slug: string, relPath: string): boolean {
  return existsSync(join(projectDir(slug), relPath));
}

export function projectHasDir(slug: string, relPath: string): boolean {
  const path = join(projectDir(slug), relPath);
  if (!existsSync(path)) return false;
  try {
    return statSync(path).isDirectory() && readdirSync(path).length > 0;
  } catch {
    return false;
  }
}

/** Stripped, trimmed contents of a single-line .txt file (or null). Useful for /links/*.txt */
export function readLinkFile(slug: string, name: string): string | null {
  const raw = readProjectFile(slug, `links/${name}`);
  if (raw === null) return null;
  const v = raw.trim();
  return v.length ? v : null;
}

/** All links/*.txt resolved as a map: { youtube: 'https://...', 'bts-video': 'https://...' } */
export function readAllLinks(slug: string): Record<string, string> {
  const linksDir = join(projectDir(slug), 'links');
  if (!existsSync(linksDir)) return {};
  const out: Record<string, string> = {};
  for (const file of readdirSync(linksDir)) {
    if (!file.endsWith('.txt')) continue;
    const key = file.replace(/\.txt$/, '');
    const value = readLinkFile(slug, file);
    if (value) out[key] = value;
  }
  return out;
}
