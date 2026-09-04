# R392 — career-document saves stop silently claiming success when storage is full

## Evidence (source, first-hand)
- R351 made resume draft saves honest: `saveResume` returns a boolean and the Builder shows
  "Not saved — storage full" instead of a silent "Saved". Career documents never got the same
  treatment: `persistDocs` (`src/lib/documents.ts`) swallows the quota exception
  (`catch { /* storage full / private mode — ignore */ }`) and every mutator returns the
  in-memory array as if it were persisted.
- Concretely, with localStorage full:
  - Builder tool dialog "Save to My resumes" flips to "Saved — update" (`setSavedId(doc.id)`),
    and for a cover letter even links the doc id into the job pipeline
    (`setPipelineCoverDoc(jobId, doc.id)`) — a dangling reference to a document that does not
    exist after reload.
  - The /documents viewer "Save changes" closes the dialog and shows the edited text in the list;
    the edit is gone on reload.
  - Import cover letter / "Use this example" / rename / duplicate / undo-restore all show success
    states for writes that never happened.

## Fix (client-only)
- `documents.ts`: `persistDocs` returns a boolean; `saveCareerDoc` returns `CareerDoc | null`;
  `updateCareerDoc` / `renameCareerDoc` / `duplicateCareerDoc` / `deleteCareerDoc` /
  `restoreCareerDoc` return `CareerDoc[] | null` (`null` = nothing was written; callers keep
  their previous state).
- `Builder.tsx` (tool dialog): on failed save/update, show an inline `role="alert"` "Not saved —
  your browser storage is full…" and do not set `savedId` / do not link the pipeline doc.
- `Dashboard.tsx`: helper `applyDocs(next)` funnels every doc mutation; on `null` it raises a
  dismissible fixed `role="alert"` bar (same shape as the undo bar). The viewer's "Save changes"
  keeps the dialog open on failure so the edited text isn't lost; signature add/remove reuse the
  adjacent `signatureError` line; import reuses `docImportError`.

## Non-goals
- Resume copies/history (`persistVersions`, `persistHistory`) keep their current semantics —
  separate banked item; the user-facing save state for the draft was already fixed in R351.
- No storage-eviction/compression scheme; no worker changes.
