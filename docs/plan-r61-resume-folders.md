# R61 — Organize saved resume copies into folders

## First-hand evidence (2026-08-29, ~/audit-r1/shots-r61/)

Authenticated Rezi workspace (app.rezi.ai/dashboard/resumes, 1440px):

- The resumes workspace has a first-class **"ADD SECTION"** button under the card
  grid; clicking it opens a "Create a resume section" dialog (SECTION NAME +
  Save). Sections are named groups that resumes can be filed into.
- Every resume card's kebab menu is: Settings / History / Duplicate / Review /
  **Move ▸** / Download ▸ / Delete. "Move" files the resume into a section.
- Rezi's model: users tailoring one resume per application quickly accumulate
  many copies; sections keep the workspace navigable (e.g. one section per
  company or job hunt).

RezUp production (cv.zalize.com/dashboard):

- My resumes has R37 sort (Last edited / Name) and grid/list views, but all
  saved copies live in one flat collection. There is no way to group copies;
  with a dozen tailored copies the grid is already hard to scan.
- Card actions today: Open / Duplicate / PDF / DOCX / Settings (R36: name +
  target role + JD) / Delete. No Move/folder concept anywhere.

Gap classification: 操作台/功能 P2 — same job-hunt workflow (one copy per
application) with no organization primitive that the competitor treats as
first-class.

## Round scope

Add a lightweight folder attribute to saved copies, surfaced through the
existing Settings dialog and a filter row — matching our established dashboard
design language (R23 type-filter pills) rather than cloning Rezi's drag/move
submenu.

1. `src/lib/resume.ts`: `ResumeVersion.folder?: string`; `sanitizeResume` is
   untouched (folder lives on the version envelope, not the Resume);
   `listResumeVersions` keeps unknown-envelope tolerance and coerces a
   non-string folder to undefined.
2. Dashboard:
   - "Folder" input in the R36 Resume settings dialog, with a `<datalist>` of
     existing folder names so filing into an existing folder is one click and
     creating a new one is just typing it (covers Rezi's ADD SECTION + Move
     with one honest control).
   - When at least one copy has a folder, show a filter row above the grid/list:
     All (n) / each folder (n) / No folder (n). Deleting/renaming the last copy
     of a folder makes the pill disappear (R23 fallback behavior: selection
     falls back to All).
3. Grid and list views both respect the active folder filter; sort applies
   within the filtered set.

## Explicitly out of scope

- Drag-and-drop moving, card-level Move submenu (Settings dialog covers it).
- Persisted empty folders (a folder exists iff a copy references it — no new
  storage key).
- Folders for career documents (R23 type filter already covers those).
- Rezi card-level History (builder-level R28 history exists; per-copy history
  would need per-version snapshots — separate round if evidence demands).

## Acceptance

- Local: `npm run lint`, `npx tsc -b`, `npm run build` green.
- Production 1440px + 375px: assign folders to two copies via Settings, filter
  pills appear with correct counts, filtering works in grid and list views,
  clearing folder removes pill, no overflow, console clean, R36/R37 regressions
  pass, localStorage restored byte-identical after QA.
