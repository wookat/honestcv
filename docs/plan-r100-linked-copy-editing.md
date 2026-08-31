# R100 — Linked copy editing (edits save back to the copy you opened)

## First-hand evidence (2026-08-31, logged-in Rezi editor)

- Rezi treats every resume as a live document: the editor top bar shows the current
  resume's name with a dropdown (Settings / History / Duplicate / Review / Move /
  Download / Delete), and edits always persist to that document. Switching resumes
  never loses work. (`~/audit-r1/shots-r100/switcher-open.png`, `finishup.png`)
- HonestCV's copies are one-way snapshots: `openCopy`/`Load` replace the working
  resume, and later edits only touch `honestcv.resume` — the copy goes stale, and the
  dialog itself warns "Loading a copy replaces what's in the editor". Tailoring a copy
  per job (our own pitch) silently forks it from the saved list.

## Design

- New localStorage key `honestcv.activeVersionId` (plain string id; NOT a `Resume`
  schema change). Set when a copy is loaded (Builder Load, Dashboard Open) or created
  from the editor ("Save current as copy"); cleared when starting a new/imported
  resume or when the linked copy is deleted.
- Write-through on the existing 400ms debounced autosave (and its pagehide/visibility
  flush): if an active id exists in `honestcv.resumeVersions`, patch that version's
  `data` (+`updatedAt`). If the id is missing (copy deleted), clear the key — never
  resurrect.
- Builder UI: Copies dialog shows "Editing: <name>" and marks the linked copy in the
  list; the destructive-load warning only shows when current edits are NOT linked to a
  copy. Load sets the link; Save-current-as-copy links to the new copy.

## Non-goals

- No hosted storage, AI, ATS or schema changes; no Rezi Settings/Move menu clone
  (folders already exist on the dashboard); no multi-document tabs.

## Verification

`npm run lint`, `npx tsc -b`, `npm run build`, deploy, then independent production QA:
link on load (builder + dashboard), edit → copy updated after debounce + refresh,
switch copies without losing edits, delete linked copy clears link safely, new/import
clears link, legacy clients (no key) unchanged, 375px, zero AI, byte-level restore.
