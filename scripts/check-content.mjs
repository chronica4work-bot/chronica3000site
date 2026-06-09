#!/usr/bin/env node
/**
 * scripts/check-content.mjs
 *
 * Diagnostic for the Chronica content pipeline. Run via `npm run check:content`.
 *
 * Validates:
 *   1. Every project folder has a project.json that parses + has required fields.
 *   2. Every project folder's name matches its project.json's `slug`.
 *   3. Every slug listed in collections/*.txt has a matching folder + project.json.
 *   4. Every project folder is listed in at least one collection (otherwise invisible).
 *   5. Folder names that look like typos (Stills vs stills, Bts vs bts, Steals, …).
 *   6. Recognized media files (poster, stills/, bts/, highlight) detected per project.
 *   7. Files inside stills/ and bts/ have supported extensions.
 *
 * Exit code: 0 if clean, 1 if any ERROR (warnings don't fail).
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const PROJECTS = join(ROOT, 'src/content/projects');
const COLLECTIONS = join(ROOT, 'src/content/collections');

const SUPPORTED_IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const SUPPORTED_VIDEO_EXT = new Set(['.mp4', '.webm', '.mov']);
const REQUIRED_FIELDS = ['slug', 'title', 'year'];
const KNOWN_CATEGORIES = ['music video', 'commercials', 'narrative', 'fashion', 'personal', 'documentary'];
const EXPECTED_SUBDIRS = ['stills', 'bts', 'links'];

// Common misspellings -> canonical name, used to suggest renames.
const TYPO_SUGGESTIONS = {
  steals: 'stills',
  still: 'stills',
  Stills: 'stills',
  STILLS: 'stills',
  Bts: 'bts',
  BTS: 'bts',
  behind: 'bts',
  backstage: 'bts',
  Links: 'links',
  LINKS: 'links',
};

let errors = [];
let warnings = [];
let info = [];

const err = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);
const log = (msg) => info.push(msg);

function readLines(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf-8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

/* ---------- 1. Scan project folders ---------- */

const projectFolders = readdirSync(PROJECTS, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .filter((d) => !d.name.startsWith('_')) // ignore templates
  .map((d) => d.name);

log(`Found ${projectFolders.length} project folders under src/content/projects/`);

const validProjects = new Map(); // slug -> { folder, data, dir }

for (const folder of projectFolders) {
  const dir = join(PROJECTS, folder);
  const jsonPath = join(dir, 'project.json');

  if (!existsSync(jsonPath)) {
    err(`[${folder}] missing project.json — folder is invisible to the site.`);
    continue;
  }

  let data;
  try {
    data = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  } catch (e) {
    err(`[${folder}] project.json has invalid JSON — ${e.message}`);
    continue;
  }

  for (const f of REQUIRED_FIELDS) {
    if (!data[f]) err(`[${folder}] project.json missing required field "${f}"`);
  }

  if (data.slug && data.slug !== folder) {
    warn(`[${folder}] project.json has slug="${data.slug}" but folder name is "${folder}" — folder name will win at load time. Align them.`);
  }

  if (data.category) {
    if (!Array.isArray(data.category)) {
      err(`[${folder}] project.json "category" must be an array`);
    } else {
      for (const c of data.category) {
        if (!KNOWN_CATEGORIES.includes(c)) {
          warn(`[${folder}] unknown category "${c}" — will appear at the end of /works. Known: ${KNOWN_CATEGORIES.join(', ')}`);
        }
      }
    }
  }

  validProjects.set(folder, { folder, data, dir });
}

/* ---------- 2. Walk each valid project's media + folders ---------- */

for (const { folder, dir } of validProjects.values()) {
  // poster
  const hasJpg = existsSync(join(dir, 'poster.jpg'));
  const hasPng = existsSync(join(dir, 'poster.png'));
  const hasWebp = existsSync(join(dir, 'poster.webp'));
  const hasJpeg = existsSync(join(dir, 'poster.jpeg'));
  const posterCount = [hasJpg, hasPng, hasWebp, hasJpeg].filter(Boolean).length;
  if (posterCount === 0) {
    log(`[${folder}] no poster.{jpg,png,webp,jpeg} — will use YouTube thumb or placeholder fallback`);
  } else if (posterCount > 1) {
    warn(`[${folder}] multiple poster files present — only one is used. Keep only the highest-quality.`);
  }

  // highlight video
  if (existsSync(join(dir, 'highlight.mp4')) || existsSync(join(dir, 'highlight.webm'))) {
    log(`[${folder}] has highlight.{mp4,webm} — homepage will autoplay loop`);
  }

  // Check subfolders + look for typos
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const name = ent.name;
    if (EXPECTED_SUBDIRS.includes(name)) {
      // Validate files inside
      const subdir = join(dir, name);
      const files = readdirSync(subdir).filter((f) => !f.startsWith('.'));
      if (files.length === 0) {
        warn(`[${folder}/${name}] folder is empty — section will be hidden anyway, can be deleted`);
        continue;
      }
      if (name === 'stills' || name === 'bts') {
        for (const f of files) {
          const ext = '.' + f.split('.').pop().toLowerCase();
          if (!SUPPORTED_IMAGE_EXT.has(ext)) {
            warn(`[${folder}/${name}/${f}] unsupported extension. Use one of: ${[...SUPPORTED_IMAGE_EXT].join(', ')}`);
          }
        }
        log(`[${folder}/${name}/] ${files.length} image(s) detected`);
      }
      if (name === 'links') {
        for (const f of files) {
          if (!f.endsWith('.txt')) {
            warn(`[${folder}/links/${f}] must be .txt`);
          }
        }
      }
    } else if (TYPO_SUGGESTIONS[name]) {
      err(`[${folder}/${name}] looks like a typo — did you mean "${TYPO_SUGGESTIONS[name]}"? The system only detects exact folder names: stills, bts, links.`);
    } else {
      warn(`[${folder}/${name}] unrecognized subfolder name — site will ignore it. Expected one of: stills, bts, links.`);
    }
  }

  // Look for stray image files at root of project folder (other than poster.*, highlight.*)
  const rootFiles = entries.filter((e) => e.isFile() && !e.name.startsWith('.')).map((e) => e.name);
  for (const f of rootFiles) {
    const lower = f.toLowerCase();
    const isPoster = /^poster\.(jpg|jpeg|png|webp)$/.test(lower);
    const isHighlight = /^highlight\.(mp4|webm)$/.test(lower);
    const isMainVideo = /^main\.(mp4|webm|mov)$/.test(lower);
    const isMeta = f === 'project.json' || f === 'credits.md' || f === 'main-credits.md';
    if (!isPoster && !isHighlight && !isMainVideo && !isMeta) {
      const ext = '.' + f.split('.').pop().toLowerCase();
      if (SUPPORTED_IMAGE_EXT.has(ext)) {
        warn(`[${folder}/${f}] image at folder root — not detected by the site. Rename to poster.${ext.slice(1)} or move into stills/ or bts/.`);
      } else if (SUPPORTED_VIDEO_EXT.has(ext)) {
        warn(`[${folder}/${f}] video at folder root — only highlight.mp4 / main.mp4 are detected.`);
      }
    }
  }
}

/* ---------- 3. Validate collections (slugs must point to folders) ---------- */

const highlights = readLines(join(COLLECTIONS, 'highlights.txt'));
const works = readLines(join(COLLECTIONS, 'works.txt'));
const archive = readLines(join(COLLECTIONS, 'archive.txt'));
const allCollectionSlugs = new Set([...highlights, ...works, ...archive]);

log(`Collections: highlights=${highlights.length}, works=${works.length}, archive=${archive.length}`);

for (const [tier, list] of [['highlights', highlights], ['works', works], ['archive', archive]]) {
  for (const slug of list) {
    if (!validProjects.has(slug)) {
      err(`collections/${tier}.txt references "${slug}" but src/content/projects/${slug}/ doesn't exist (or has no valid project.json).`);
    }
  }
}

// Same slug in multiple tiers?
const seenTiers = new Map();
for (const [tier, list] of [['highlights', highlights], ['works', works], ['archive', archive]]) {
  for (const slug of list) {
    if (seenTiers.has(slug)) {
      warn(`"${slug}" is listed in both ${seenTiers.get(slug)}.txt and ${tier}.txt — only set the highest tier (hierarchy is automatic).`);
    } else {
      seenTiers.set(slug, tier);
    }
  }
}

/* ---------- 4. Folders not in any collection ---------- */

for (const slug of validProjects.keys()) {
  if (!allCollectionSlugs.has(slug)) {
    warn(`[${slug}] folder exists but isn't listed in any collections/*.txt — invisible to the site. Add it to highlights.txt, works.txt, or archive.txt.`);
  }
}

/* ---------- 5. Print report ---------- */

const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const DIM = '\x1b[2m';

const useColor = process.stdout.isTTY;
const c = (color, s) => (useColor ? color + s + RESET : s);

console.log('\nChronica content check');
console.log('─'.repeat(70));

if (info.length) {
  for (const m of info) console.log(c(DIM, '  ' + m));
}
if (warnings.length) {
  console.log('');
  for (const m of warnings) console.log(c(YELLOW, '  warn  ') + m);
}
if (errors.length) {
  console.log('');
  for (const m of errors) console.log(c(RED, '  ERROR ') + m);
}

console.log('─'.repeat(70));
console.log(
  `  ${c(errors.length ? RED : GREEN, errors.length + ' error(s)')}  ${c(warnings.length ? YELLOW : DIM, warnings.length + ' warning(s)')}  ${c(DIM, info.length + ' info')}`
);

if (errors.length === 0 && warnings.length === 0) {
  console.log(c(GREEN, '\n  Everything looks clean. If a change still isn\'t showing in the browser, run: npm run fresh\n'));
} else if (errors.length === 0) {
  console.log(c(DIM, '\n  No errors. Warnings above are advisory.\n'));
} else {
  console.log(c(RED, '\n  Fix the errors above and re-run.\n'));
}

process.exit(errors.length > 0 ? 1 : 0);
