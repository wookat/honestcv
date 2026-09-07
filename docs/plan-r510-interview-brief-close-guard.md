# R510 — close guard covers the interview prep brief

## Evidence (production CDP, 2026-08-31)
- /builder?doc=interview → "Start from a template" fills the brief textarea (906 chars) → edit it → Close → dialog closes silently, no confirmation, brief destroyed. Never-saved and saved-then-edited briefs alike.
- Root cause: the interview branch of `unsavedWork` only checks `session !== null || answer.trim() !== ''` — the brief (`result`) is only guarded on the cover/resignation branch. Yet the interview dialog has the same Generate / template / Save-to-My-resumes result flow (R333/R509 protect it for letters only).

## Fix (Builder.tsx ToolDialog only)
- Extract the letter condition: `resultAtRisk = result !== '' && (savedId === null || result !== savedText)`.
- Interview branch becomes: `session !== null || answer.trim() !== '' || resultAtRisk`.
- Confirm-dialog description for interview mentions the brief when it is at risk.

## Non-goals
- No autosave; no change to session/answer semantics, letter branches, R507/R508 guards.

## Validation
- `npx tsc -b --noEmit`, `npx eslint src/pages/Builder.tsx`, `npm run build`, `npm run verify-dist`.
- Production QA: interview template → close warns; discard closes; save → close clean; save → edit → close warns; letter regression; 375px overflow; console clean; storage cleanup.
