/**
 * Archive-only entries — projects that should appear in the historical archive
 * but don't (yet) have full project pages or content. These are intentionally
 * not in the content collection because they don't have a body / credits yet.
 *
 * When one of these gets a real project page, move it into src/content/projects/.
 */

export interface ArchiveExtra {
  title: string;
  year?: string;
  category?: string[];
  // No slug — these are not clickable until a real entry is created.
}

export const archiveExtras: ArchiveExtra[] = [
  { title: 'BLUE BANANA' },
  { title: 'TOURIST GO HOME' },
];
