# R363: rename career documents

## Evidence (firsthand)
- Production dashboard "Career documents" rows offer Open / PDF / DOCX / TXT /
  Delete only. Titles are auto-generated at save time in the Builder tool
  dialog (`"<company> — Cover letter"`, `"<role> — Interview prep"`); when the
  company field is blank the stored title is `"Untitled — Cover letter"` with
  no way to fix it afterwards. `updateCareerDoc` already accepts a `title`
  patch but no UI exposes it.
- Resume copies (same page) and folders both have rename; documents are the
  only named object on the dashboard without one. Rezi's dashboard lets users
  rename AI-written documents.
- The title is user-visible beyond the list: interview-prep PDF/DOCX/TXT
  exports render it as the heading (R353/R362), and the viewer dialog title
  shows it.

## Change (smallest evidence-backed)
- `documents.ts`: add `renameCareerDoc(id, title)` — patches the title
  WITHOUT bumping `updatedAt` (organizational action, same rule as resume
  copies since R197; `updateCareerDoc` keeps its timestamp bump for real text
  edits).
- `Dashboard.tsx`: pencil rename button on each document row (mirrors the
  folder-rename affordance, sr-only label `Rename <title>`), opening a small
  dialog with a prefilled input; Enter or Save applies, trimmed-empty input
  disables Save; Cancel/Esc discards.
- Viewer dialog and Builder tool dialog unchanged.

## Non-goals
- No inline title editing in the viewer.
- No dedup/numbering of duplicate titles.
- No change to auto-generated titles at save time.

## Validation
- tsc / eslint (touched files) / build; oracle for renameCareerDoc
  (title changes, updatedAt byte-identical, other fields/order preserved,
  unknown id no-op).
- Production QA: rename each kind, list + viewer + interview TXT/PDF heading
  reflect the new title, updatedAt label unchanged, empty-input guard, Esc,
  delete/undo regression, 375px light/dark.
