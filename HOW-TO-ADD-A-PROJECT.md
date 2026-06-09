# How to add a project to Chronica

This is the plain-language guide. No programming knowledge needed — just folders and text files.

## The two-part idea

Everything works in two parts:

**Part 1 — the project itself.** Every project is one folder. Inside the folder, you drop files (poster, credits, stills, etc.). The folder name is also the URL.

**Part 2 — where it appears.** Three plain text files control visibility. You list slugs in one of them. The line order is the display order.

Once you understand these two parts, the system is just "folder + line."

## Part 1: the project folder

Project folders live in:

    src/content/projects/

Each folder is one project. The folder name is the URL slug. So a folder called `fullmoon` becomes `chronica3000.com/fullmoon`. Keep folder names lowercase, no spaces — use hyphens if you need to separate words (`ice-castle`).

### What goes in a project folder

None of these are required except `project.json`. You only put in what you have. Anything missing → that section just doesn't appear on the site.

**1. `project.json`** — Basic info about the project: title, year, location, category, crew. *Required.* It's a small text file with simple fields.

**2. `poster.jpg`** — One still that represents the project. Used as the tile poster on the homepage, on /works, and as the cover at the top of the project page. `.png` and `.webp` also work.

**3. `highlight.mp4`** *(optional, future)* — A short looping video for the homepage. When this file exists, the homepage section plays it on top of the poster — autoplay, muted, looped. When it doesn't exist, the homepage just shows the poster. `.webm` also works.

**4. `main-credits.md`** — A short list of the key credits (usually 3-5 lines: director, DP, producer). Plain text. Shown at the top of the project page.

**5. `credits.md`** — The full crew list. Plain text, same format as `main-credits.md`. Behind a "+ credits" expandable button.

**6. `stills/` folder** — Drop stills inside: `01.jpg`, `02.jpg`, etc. They appear as a gallery on the project page.

**7. `bts/` folder** — Same as stills but for behind-the-scenes photos.

**8. `links/` folder** — Each `.txt` file inside becomes an outline button on the project page:
- `links/youtube.txt` — the YouTube URL on the first line
- `links/bts-video.txt` — a URL → "+ bts video ↗" button
- Any file like `links/spotify.txt` or `links/instagram.txt` — the filename becomes the button label

## Part 2: where the project appears

There are three plain text files at:

    src/content/collections/

- `highlights.txt` — projects on the homepage
- `works.txt` — projects on /works only (NOT homepage)
- `archive.txt` — projects on /archive only (NOT homepage, NOT /works)

Inside each file: one slug per line. The line order IS the display order.

**Hierarchy is automatic.** If a slug is in `highlights.txt`, it's also on /works and /archive — you don't need to add it to the other files. If a slug is in `works.txt`, it's also on /archive.

To move a project from highlights to "works only": cut the line from `highlights.txt`, paste into `works.txt`. To reorder the homepage: drag lines up/down in `highlights.txt`.

To hide a project temporarily: remove its line from all three files. The folder still exists; it just doesn't surface anywhere.

## A real example

Here's the current `highlights.txt`:

    fullmoon
    tomsorry
    52haunted
    only1heart
    psychodreams2
    pinkblues

That's the homepage, in order, top to bottom.

Each line maps to a folder under `src/content/projects/`. Each folder currently looks like:

    52haunted/
        project.json
        main-credits.md
        credits.md
        poster.jpg

When `highlight.mp4` is added to a folder, the homepage automatically uses it. No code change, no config change — just drop the file.

## What happens if you forget something

The whole site is built around "if the file exists, show the section — otherwise hide it." Nothing breaks. The page just gets shorter.

| If you don't add…           | What happens on the site                                                                |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `poster.jpg`                | Uses the YouTube thumbnail as a fallback. If no YouTube either, shows a striped placeholder block. |
| `highlight.mp4` (future)    | Homepage section shows the poster only — no autoplay video.                             |
| `main-credits.md`           | The compact credits header at the top of the project page doesn't appear.               |
| `credits.md`                | The "+ credits" expandable button doesn't appear.                                       |
| `stills/` folder            | The "stills" gallery section is skipped entirely.                                       |
| `bts/` folder               | The "bts" gallery section is skipped entirely.                                          |
| `links/` folder             | No external link buttons appear.                                                        |
| YouTube URL anywhere        | The video block at the top of the project page is hidden. Only the poster appears.     |
| Slug not in any collection  | Folder exists, but no surface lists it. Useful for drafts.                              |

## Step-by-step: adding a new project

Say you're adding a project called "ice castle".

**1. Copy the template.** Inside `src/content/_PROJECT_TEMPLATE/`, there's a starter folder. Copy the whole folder. Rename your copy to `ice-castle` (lowercase, hyphen, no spaces) and move it into `src/content/projects/`.

**2. Edit `project.json`** inside the new folder:
- `"slug"` to `"ice-castle"` (must match the folder name).
- `"title"`, `"artist"`, `"track"`, `"year"`, `"location"` to the real values.
- `"video.youtube"` to the YouTube URL if there is one (or leave `""`).

**3. Drop in a `poster.jpg`.**

**4. Edit `main-credits.md`** with the 3-5 headline credits.

**5. Edit `credits.md`** with the full crew list. (If you don't have it yet, delete the file — the "+ credits" button just won't appear.)

**6. (Optional) Add stills, BTS, links.** Make `stills/`, `bts/`, `links/` folders and drop files inside as needed.

**7. Decide where it appears.** Open `src/content/collections/highlights.txt` (or `works.txt` / `archive.txt`). Add `ice-castle` on a new line, at the position you want it to appear in the list. Save the file.

**8. Check it locally.** Run `npm run dev` in Terminal from the project root, then open `http://localhost:4321/ice-castle` and `http://localhost:4321/` to see both the project page and the homepage.

## The credits file format

Both `main-credits.md` and `credits.md` use the same simple format. One credit per line:

    role — names

Examples:

    directed by — Kira Uteshkaliev & Gosha Mirchuk
    produced by — Ivan Sokolovskiy
    director of photography — Gosha Mirchuk
    art assistant — Maria Vicent
    art assistant — Martha Cervera

    special thanks — Arkadiy Doroshenko, Aleksandra Maliugina

Rules:
- The dash is an **em-dash** (`—`), not a regular hyphen. On Mac: `Option + Shift + -`.
- Roles go first. They'll be shown in lowercase automatically — don't worry about case.
- Names go after the em-dash. Capitalize them normally.
- Multiple separate names for the same role: separate with commas.
- Co-credited names that should be displayed as one slot ("directed by Kira & Gosha"): join with `&`.
- `special thanks` is recognized as a special role. Whatever's on the right of it gets pulled out and shown at the bottom.
- Empty lines and lines starting with `#` are ignored.

## The `project.json` fields

These are the only fields you ever need:

- **slug** — must exactly match the folder name. URL-safe (lowercase, no spaces).
- **title** — the headline on the project page. Usually `"ARTIST — TRACK"` in uppercase.
- **artist** — the performer, e.g. `"KIZARU"`.
- **track** — the song title, e.g. `"FULL MOON"`.
- **year** — release year as text in quotes: `"2025"`.
- **location** — where it was shot, e.g. `"Barcelona"`.
- **category** — type of work. Always in square brackets: `["music video"]`. Options: `"music video"`, `"narrative"`, `"commercials"`, `"fashion"`, `"personal"`.
- **roles** — what Chronica did. Array: `["directed", "produced", "cinematography"]`.
- **team** — who did what. Used for filtering on /works (when we add filtering later). Fill in honestly.
- **video.youtube** — the YouTube URL, or empty `""`.
- **video.bunny** — leave empty for now. (For future Bunny CDN videos.)

Visibility (featured / works / archive) and order are NOT in `project.json` anymore — they're controlled by the collection files described in Part 2.

## Common mistakes

**Missing comma in `project.json`.** JSON is fussy. Every line except the last in a block needs a comma at the end. If something breaks, this is the most likely cause.

**Smart quotes.** Don't paste from a document app — it can replace `"` (straight quotes) with `"` (curly quotes). JSON needs straight quotes.

**Spaces in the folder name.** Use `ice-castle`, not `ice castle`. URLs can't have spaces.

**Wrong filename.** It's `poster.jpg`, not `Poster.jpg` or `cover.jpg`. The site looks for exact filenames: `poster`, `highlight`, `main-credits.md`, `credits.md`.

**Slug in two collections.** Each slug should appear in AT MOST one collection file. If it's in `highlights.txt`, you don't also add it to `works.txt` — the hierarchy already includes it.

**Slug doesn't match folder name.** If your folder is `ice-castle` but `project.json` says `"slug": "icecastle"`, the loader will quietly override JSON with the folder name. Easier: just keep them the same.

## If something doesn't appear

1. From the project root, run `npm run sync`. If there's a problem with a file, you'll see a red error message. Fix what it tells you.
2. If `sync` finishes cleanly but the project still doesn't appear, run `npm run fresh`. This clears all caches and rebuilds.
3. Still not appearing? Check:
   - Is the folder inside `src/content/projects/`?
   - Is the slug listed in one of the `src/content/collections/*.txt` files?
   - Does `project.json` parse cleanly (try opening it in a code editor — red squiggles = bug)?

## Future: spreadsheet upload (planned, not built yet)

The `project.json` shape and the collections `.txt` files are designed so we can eventually generate them from a CSV or Excel master sheet. When that importer is built, you'll be able to manage everything from one spreadsheet — slug, title, year, roles, credits, YouTube URLs, which collection — and the importer will write the JSONs and update the .txt files for you.

Until then, edit files directly.
