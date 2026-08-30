# R32 — Real "start a new resume" flow on the dashboard

Date: 2026-08-29 · Round: R32 · Status: planned

## First-hand evidence

Rezi (app.rezi.ai, audited 2026-08-29, `shots-r32/`):

- "CREATE NEW RESUME" opens a **Create a resume** modal: RESUME NAME (required),
  EXPERIENCE level select, IMPORT YOUR EXISTING RESUME (PDF/DOCX upload),
  LANGUAGE, **"Target your resume"** (tailor to a specific job opening at
  creation time), a free formatting-review opt-in, and CREATE RESUME /
  USE AI RESUME AGENT actions (`r32-create-step1`).
- The resumes workspace also has a "Click to create new resume / or drop a
  resume here" card (already matched by R24's import tile).

RezUp production (cv.zalize.com, code + behavior):

- WorkspaceNav's "Create new resume" button is `<Link to="/builder">` — it
  opens **the existing draft**, not a new resume. There is no way to start a
  fresh resume anywhere in the product except manually deleting field contents
  (or importing over the draft). Starting a second resume risks silently
  losing the current draft's work.
- `saveResumeVersion(name, data)` and the versions grid already exist, so
  "keep a copy first" is one call.

## Gap (P1, operating console / core workflow)

A resume builder that cannot start a new resume is missing a golden-path
workflow. Rezi treats creation as a first-class guided step that seeds job
targeting up front; we only support "continue editing whatever is there".

## Batch scope

1. `src/pages/Dashboard.tsx` — new `NewResumeDialog`:
   - When the current draft has any content: a checked-by-default
     "Keep a copy of my current draft in My resumes" checkbox
     (`saveResumeVersion` named from the draft's name — target role, fallback
     "Untitled resume").
   - Optional **Target role** input and **Job description** textarea — seed
     `targetRole` / `jobDescription` so ATS keyword targeting works from the
     first keystroke (matches Rezi's "Target your resume" step honestly).
   - Create → `saveResume({ ...emptyResume(), targetRole, jobDescription })`
     → navigate `/builder`.
   - Entry points: dashed "Start a new resume" tile in the My resumes grid
     (next to R24's Import tile — also covers <md where WorkspaceNav is
     hidden), and WorkspaceNav's button on /dashboard.
2. `src/components/WorkspaceNav.tsx` — accept optional `onCreate`; when
   provided (Dashboard) the button opens the dialog instead of linking to
   /builder; /jobs keeps the link behavior (unchanged there → navigates to
   the builder as before).

Deliberately not copied: required resume name (versions get names when
saved), experience-level and language selects (no behavior behind them we
can honestly implement), formatting-review opt-in (human-review business
model), AI Resume Agent path.

## Acceptance / QA

- Dashboard with existing draft: Start a new resume → dialog shows keep-a-copy
  checkbox; create with role+JD → /builder opens an empty resume with Target
  job pre-filled; the old draft appears in My resumes as a version.
- Unchecking keep-a-copy skips the version save (draft is replaced).
- Empty draft: checkbox hidden, create goes straight to a fresh builder.
- /jobs WorkspaceNav button unchanged (links to /builder).
- 375px: new tile + dialog controls ≥40px, no horizontal overflow.
- Console clean; localStorage restored byte-for-byte after QA.
