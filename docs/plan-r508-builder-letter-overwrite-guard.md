# R508 — confirm before replacing an edited letter draft in the Builder tool dialog

## Evidence (production CDP, 2026-08-31)
- SOP-10 sweep clean: 7 routes × 2 viewports zero overflow, zero console errors; Rezi changelog no new actionable gap.
- `/builder?doc=cover` → "Start from a template" → edit the result textarea (`MY CAREFULLY EDITED DRAFT — hours of work`) → click "Start from a template" again → the edited draft is silently replaced by the template, no confirmation, no undo. `generate()` has the same unconditional `setResult(text)` — and additionally spends an AI request.
- Dialog *close* is already guarded (R333 `confirmingClose`), but in-dialog overwrite is not: the two most destructive buttons inside the dialog bypass the protection the dialog's close button has.

## Fix (Builder.tsx ToolDialog only)
- Track the last programmatic output: `autoResult` set wherever `generate`/`insertTemplate` set `result`; cleared on kind change.
- `resultEdited = result.trim() !== '' && result !== autoResult`.
- Generate / Start from a template buttons route through a guard: if `resultEdited`, open a styled "Replace your edited draft?" dialog; otherwise act directly.
- Dialog: destructive "Replace draft" proceeds with the pending action; "Keep my draft" (default) closes.

## Non-goals
- No draft history/undo stack; no changes to generate/template content, AI paths, R507 placeholder guard, or Dashboard.

## Validation
- Local: `npx tsc -b --noEmit`, `npx eslint src/pages/Builder.tsx`, `npm run build`, `npm run verify-dist`.
- Production QA (desktop + 375px): template → edit → template/Generate shows confirm; Keep my draft preserves edits; Replace draft replaces (template path); unedited result regenerates with no dialog; kind switch resets; zero overflow/console errors; storage cleaned.
