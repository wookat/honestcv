# R171 — Rezi-style folder sections on the dashboard

## First-hand Rezi evidence (2026-08-31, app.rezi.ai free account)

- Dashboard has an "ADD SECTION" button → "Create a resume section" modal with a
  required section name (empty name rejected with a toast).
- Created sections render as collapsible header rows in the resume list
  (`▸ TARGET: FRONTEND`), with a `+` (create resume inside) and a `⋮` menu
  offering **Edit** (rename) and **Delete**.
- Deleting a section asks "Are you sure you want to delete this section? This
  will delete the section and all resumes inside will be not categorized
  anymore" — resumes are uncategorized, not deleted.
- Each resume row's `…` menu has **Move →** listing "My Dashboard" (root),
  every section, and "Add Section...". Moving re-groups the row under the
  section header; uncategorized resumes stay at the top level.

## Current RezUp state

Saved copies already have an optional `folder` field (edited only inside the
"Edit name & target job" dialog) and flat filter chips (All / folder / No
folder). There is no grouped display and no quick move action — parity with
Rezi's section mental model is missing.

## Scope

1. **Grouped display** — when folders exist and the "All" filter is active,
   saved copies render as: ungrouped copies first, then one collapsible group
   per folder (header row with name, count, expand/collapse; collapsed set
   persisted in `localStorage['honestcv.dashboardFoldersCollapsed']` — pure UI
   state, zero schema). Works in both grid and list view; sort order applies
   within each group.
2. **Quick move** — a folder button on every saved copy opens a small
   "Move to folder" dialog: existing folders, "New folder…" name input, and
   "Remove from folder". Reuses `updateResumeVersion(id, { folder })`.
3. **Folder header actions** — Rename (updates the folder on all its copies)
   and Remove folder (confirm dialog, Rezi-style wording: copies are kept and
   just uncategorized).

## Non-goals

No schema change (reuses the existing `folder` field), no storage migration,
no changes to exports/sharing/ATS/AI, no drag-and-drop.

## Acceptance

- Grouping, collapse persistence, move, rename, remove verified on production
  at 1440 and 375 px; filter chips and sort keep working; single-folder-focus
  view unchanged; R138 created-sort regression green.
