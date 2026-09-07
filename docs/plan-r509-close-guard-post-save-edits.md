# R509 — close guard covers edits made after "Save to My resumes"

## Evidence (production CDP, 2026-08-31)
- /builder?doc=cover → "Start from a template" → "Save to My resumes" (careerDocs doc saved, 619 chars) → edit the textarea (`POST-SAVE EDIT — precious changes`) → Close → dialog closes silently, no confirmation, saved doc still holds the pre-edit text. The post-save edits are destroyed.
- Root cause: `unsavedWork = kind !== null && result !== '' && savedId === null` — once `savedId` is set, any later edits are treated as saved even though the stored doc was never updated. R333's close guard therefore only protects never-saved drafts.
- Honest rejection this round: earlier probe suggested a "career doc saved with empty content" bug — that was a probe artifact (read `d.content` instead of `d.text`); saves store full text correctly.

## Fix (Builder.tsx ToolDialog only)
- Track `savedText`: set to `result` whenever save/update succeeds (both `saveCareerDoc` and `updateCareerDoc` paths); cleared with `savedId` on kind change.
- `unsavedWork` for letter kinds becomes: `result !== '' && (savedId === null || result !== savedText)`.
- Interview branch, overwrite guard (R508), placeholder guard (R507), download paths: unchanged.

## Non-goals
- No autosave, no draft history, no change to the "Saved — update" button behavior.

## Local validation
- `npx tsc -b --noEmit`, `npx eslint src/pages/Builder.tsx`, `npm run build`, `npm run verify-dist`.

## Production QA
- template → save → close: no prompt (nothing unsaved).
- template → save → edit → close: prompt appears; Keep working preserves; Discard closes.
- template → save → edit → "Saved — update" → close: no prompt (edits persisted).
- template (never saved) → close: prompt (R333 regression).
- Kind switch clears state; 375px no overflow; zero console errors; storage cleaned after QA.
