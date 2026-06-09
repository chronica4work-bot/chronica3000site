# Template — copy this folder to start a new project

This folder is ignored by the site (any folder starting with `_` is skipped).
Copy it, rename the copy to your new project's slug, and edit the files inside.

## What to do

1. Copy this entire `_PROJECT_TEMPLATE` folder into `src/content/projects/`.
2. Rename the copy to your project slug — lowercase, no spaces (e.g. `ice-castle`).
3. Open `project.json` and fill in the fields:
   - `slug` to match the new folder name
   - `title`, `artist`, `track`, `year`, `location`
   - `category`, `roles`, `team`
   - `video.youtube` URL (if there is one)
4. Open `main-credits.md` and write the 3-5 key credits shown above the video.
5. Open `credits.md` and write the full crew list (optional).
6. Drop a `poster.jpg` (or `.png` / `.webp`) into the folder.
7. (Optional, future) Drop a `highlight.mp4` or `highlight.webm` for an autoplay loop on the homepage.
8. (Optional) Add `stills/01.jpg`, `02.jpg`, … for a stills gallery.
9. (Optional) Add `bts/01.jpg`, `02.jpg`, … for a behind-the-scenes gallery.
10. (Optional) Add `links/youtube.txt`, `links/bts-video.txt`, etc — each becomes an outline button.

## Choose where it appears

After your project folder exists, decide what surfaces show it. Open one of:

- `src/content/collections/highlights.txt` — homepage + works + archive
- `src/content/collections/works.txt` — works + archive only (not homepage)
- `src/content/collections/archive.txt` — archive only

Add your slug on a new line. Line order in the file is the display order.

When you're done editing, run `npm run dev` and visit the project's URL
(e.g. `http://localhost:4321/ice-castle`).

See **HOW-TO-ADD-A-PROJECT.md** at the project root for the full plain-language guide.
