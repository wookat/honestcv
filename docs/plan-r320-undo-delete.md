# R320 — Undo after deleting a resume copy or career document

## Evidence (first-party)
- Rezi User Docs "Delete Resume" (updated 2026-08-19): deletion is **permanent**; the guide spends two of three steps telling users to double-check the file and copy out any content first ("save you from accidentally deleting the wrong file"). Rezi offers no recovery — the entire mitigation is a confirm popup plus user caution.
- HonestCV production today: `/dashboard` and `/documents` delete flows confirm via dialog, then remove the copy/doc from localStorage immediately and irreversibly (`deleteResumeVersion` / `deleteCareerDoc` filter + persist). A mis-click through the confirm loses a tailored copy or letter with no recourse.

## Gap and goal
Confirm dialogs do not prevent wrong-file deletions (Rezi's own doc admits this by pushing manual double-checking). Being browser-local-first, HonestCV can do strictly better than Rezi: keep the deleted item in memory and offer a time-limited **Undo** immediately after deletion.

## Design
- `src/lib/resume.ts`: `restoreResumeVersion(version: ResumeVersion): ResumeVersion[]` — reinsert the exact object (id, name, folder, createdAt/updatedAt, data untouched) at the front unless the id already exists; persist and return the list.
- `src/lib/documents.ts`: `restoreCareerDoc(doc: CareerDoc): CareerDoc[]` — same pattern.
- `src/pages/Dashboard.tsx`: one `undoDelete` state `{ kind: 'copy' | 'doc'; version?: ResumeVersion; doc?: CareerDoc; name: string }` set by both delete confirm handlers; rendered as a fixed bottom `role="status"` bar: `Deleted "<name>"` + `Undo` button + dismiss (X). Auto-clears after 10 s (timer in a `useEffect`, cleared on unmount/replacement). Undo calls the restore helper, refreshes the relevant list state, and clears the bar. A new deletion replaces any pending bar (previous item is simply gone — same as today).
- No worker/schema/storage-shape changes; restored objects are byte-identical to what was stored before deletion (timestamps NOT refreshed, so sort order is preserved).

## Out of scope
- A persistent trash can / multi-item undo history.
- Undo for folder removal (folders are labels; removing one leaves copies intact already).
- Builder edit-history (already has checkpoints/restore).

## Validation
- Oracle (tsx): restore round-trip — delete then restore yields a list deep-equal to the original (order, ids, timestamps, folder); restore with existing id is a no-op; doc restore keeps signature key behavior.
- `npx tsc -b`, eslint on changed files, `npm run build`.
- Production QA (testing agent, zero AI): delete a copy → status bar appears with exact name; Undo → copy back at same position with identical JSON in localStorage (byte compare `honestcv.resumeVersions`); bar auto-dismisses after ~10 s (item stays deleted); same for a career document on /documents (signature preserved); X dismisses; 375px strict scrollWidth=375 with bar visible; dark mode; localStorage/theme restore.
