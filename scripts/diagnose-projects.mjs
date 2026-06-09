#!/usr/bin/env node
/**
 * scripts/diagnose-projects.mjs
 *
 * Per-project render diagnostic. Simulates the ProjectVideo decision logic
 * exactly: walks each project folder + project.json, applies the same
 * priority chain ProjectVideo.astro uses at render time, and prints which
 * branch will fire — so you can verify what the DOM should contain WITHOUT
 * needing to inspect the rendered page.
 *
 * Priority chain (matches src/components/ProjectVideo.astro):
 *   1. main.mp4 / main.webm / main.mov on disk  →  <video> with that source
 *   2. project.json video.bunny                  →  <video> with bunny URL
 *   3. project.json video.youtube (or links/youtube.txt)  →  <iframe>
 *   4. poster on disk (or YouTube thumbnail fallback)     →  <img>
 *   5. nothing
 *
 * Also reports BTS YouTube presence and predicted section render order.
 *
 * Run via `npm run diagnose`.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const PROJECTS = join(ROOT, 'src/content/projects');

const VIDEO_EXTS = ['mp4', 'webm', 'mov'];
const POSTER_EXTS = ['jpg', 'jpeg', 'png', 'webp'];

function firstExisting(dir, basename, exts) {
  for (const ext of exts) {
    const p = join(dir, `${basename}.${ext}`);
    if (existsSync(p)) return `${basename}.${ext}`;
  }
  return null;
}

function readLinkFile(dir, name) {
  const p = join(dir, 'links', name);
  if (!existsSync(p)) return '';
  return readFileSync(p, 'utf-8').trim();
}

function youtubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
  return m ? m[1] : (/^[\w-]{11}$/.test(url) ? url : null);
}

function gallerySize(dir, subdir) {
  const p = join(dir, subdir);
  if (!existsSync(p) || !statSync(p).isDirectory()) return 0;
  return readdirSync(p).filter(f => !f.startsWith('.') && POSTER_EXTS.some(e => f.toLowerCase().endsWith('.' + e))).length;
}

const RESET = '\x1b[0m', BOLD = '\x1b[1m', DIM = '\x1b[2m';
const RED = '\x1b[31m', GREEN = '\x1b[32m', YELLOW = '\x1b[33m', CYAN = '\x1b[36m', MAGENTA = '\x1b[35m';
const tty = process.stdout.isTTY;
const c = (color, s) => tty ? color + s + RESET : s;

console.log(c(BOLD, '\nChronica per-project video resolution diagnostic'));
console.log('═'.repeat(78));

const slugs = readdirSync(PROJECTS, { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith('_'))
  .map(d => d.name)
  .sort();

const rows = [];
let errorCount = 0;

for (const slug of slugs) {
  const dir = join(PROJECTS, slug);
  const jsonPath = join(dir, 'project.json');

  if (!existsSync(jsonPath)) {
    console.log(c(RED, `\n  [${slug}] missing project.json — folder is invisible.`));
    errorCount++;
    continue;
  }

  let data;
  try { data = JSON.parse(readFileSync(jsonPath, 'utf-8')); }
  catch (e) { console.log(c(RED, `\n  [${slug}] project.json invalid: ${e.message}`)); errorCount++; continue; }

  // Simulate ProjectVideo source resolution
  const mainVideoFile = firstExisting(dir, 'main', VIDEO_EXTS);
  const bunnyUrl = data?.video?.bunny || '';
  const ytJson = data?.video?.youtube || '';
  const ytLink = readLinkFile(dir, 'youtube.txt');
  const ytUrl = ytJson || ytLink || '';
  const ytId = youtubeId(ytUrl);
  const ytEmbed = ytId ? `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1` : '';

  const btsYtJson = data?.video?.btsYoutube || '';
  const btsYtLink = readLinkFile(dir, 'bts-youtube.txt');
  const btsYtUrl = btsYtJson || btsYtLink || '';
  const btsYtId = youtubeId(btsYtUrl);

  const posterFile = firstExisting(dir, 'poster', POSTER_EXTS);
  const posterFallback = posterFile ? `disk:${posterFile}` : (ytId ? `youtube-thumb:${ytId}` : null);

  // Decide branch
  let branch, source;
  if (mainVideoFile) { branch = 'VIDEO_FILE';   source = `disk:${mainVideoFile}`; }
  else if (bunnyUrl) { branch = 'VIDEO_BUNNY';  source = bunnyUrl; }
  else if (ytEmbed)  { branch = 'IFRAME_YT';    source = ytEmbed; }
  else if (posterFallback) { branch = 'POSTER'; source = posterFallback; }
  else               { branch = 'NONE';         source = '—'; }

  const stillsCount = gallerySize(dir, 'stills');
  const btsCount = gallerySize(dir, 'bts');
  const hasMainCredits = existsSync(join(dir, 'main-credits.md'));
  const hasFullCredits = existsSync(join(dir, 'credits.md'));

  // Predicted section render order
  const sections = ['title'];
  if (hasMainCredits) sections.push('subtitle');
  if (branch !== 'NONE') sections.push('video[' + branch + ']');
  sections.push('meta');
  if (hasFullCredits) sections.push('+credits');
  if (btsYtId) sections.push('[BTS-video]');
  if (stillsCount) sections.push(`[stills:${stillsCount}]`);
  if (btsCount) sections.push(`[BTS:${btsCount}]`);
  sections.push('contact');

  rows.push({ slug, branch, source, ytUrl, btsYtUrl, sections, mainVideoFile, bunnyUrl, posterFile, ytId, btsYtId, ytLink, btsYtLink });
}

// Print compact diagnostic table
console.log('\n' + c(BOLD, '  Per-project video source resolution'));
console.log('  ' + '─'.repeat(76));
for (const r of rows) {
  const branchColor =
    r.branch === 'VIDEO_FILE' ? GREEN :
    r.branch === 'VIDEO_BUNNY' ? GREEN :
    r.branch === 'IFRAME_YT' ? CYAN :
    r.branch === 'POSTER' ? YELLOW :
    RED;
  console.log(`  ${c(BOLD, r.slug.padEnd(24))} → ${c(branchColor, r.branch.padEnd(12))} ${c(DIM, r.source)}`);
}

// Per-project detail block
for (const r of rows) {
  console.log('\n' + '─'.repeat(78));
  console.log(c(BOLD, `  /${r.slug}`));
  console.log(`    main video source : ${c(CYAN, r.branch)}`);
  console.log(`      main.{mp4,webm,mov} on disk : ${r.mainVideoFile ?? c(DIM, 'no')}`);
  console.log(`      video.bunny                 : ${r.bunnyUrl || c(DIM, '""')}`);
  console.log(`      video.youtube               : ${r.ytUrl ? c(GREEN, r.ytUrl) : c(DIM, '""')}`);
  console.log(`        → youtube id              : ${r.ytId ? c(GREEN, r.ytId) : c(DIM, 'none')}`);
  console.log(`        → links/youtube.txt       : ${r.ytLink || c(DIM, '—')}`);
  console.log(`      poster on disk              : ${r.posterFile ?? c(DIM, 'no')}`);
  console.log(`    BTS video :`);
  console.log(`      video.btsYoutube            : ${r.btsYtUrl ? c(GREEN, r.btsYtUrl) : c(DIM, '""')}`);
  console.log(`        → bts youtube id          : ${r.btsYtId ? c(GREEN, r.btsYtId) : c(DIM, 'none')}`);
  console.log(`        → links/bts-youtube.txt   : ${r.btsYtLink || c(DIM, '—')}`);
  console.log(`      BTS video section will render : ${r.btsYtId ? c(GREEN, 'YES') : c(DIM, 'no')}`);
  console.log(`    Render order : ${r.sections.join(' → ')}`);
}

console.log('\n' + '═'.repeat(78));
if (errorCount) console.log(c(RED, `  ${errorCount} project(s) failed to load.\n`));
else            console.log(c(GREEN, `  All ${rows.length} projects resolved cleanly.\n`));

process.exit(errorCount ? 1 : 0);
