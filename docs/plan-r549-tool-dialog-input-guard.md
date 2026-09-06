# R549 — Builder tool dialog: guard typed setup inputs before generation

## Production evidence (2026-08-31, cv.zalize.com, CDP)

- 375×812: `/builder?doc=cover` opens the Cover Letter dialog. Typed values into all
  three setup fields (company `R549-0`, hiring manager `R549-1`, details to
  highlight `R549-2`), pressed Escape → dialog closed silently, no confirmation,
  all typed input lost. Reopening shows blank fields.
- Reload after typing: fields also lost with no `beforeunload` prompt (the guard is
  keyed off `unsavedWork`, which is false before generation).
- Root cause (src/pages/Builder.tsx `BundleToolDialog`): `unsavedWork` counts only a
  generated `result` (`resultAtRisk`) — plus `session`/`answer` for interview.
  Pre-generation setup inputs (cover: company/addressee/highlights; resignation:
  currentRole/lastDay/reason; interview: typed custom question) are unguarded, so
  Escape/X/browser Back/SPA links/reload all silently discard them.
- Contrast: the R333/R508/R521/R522/R523 guard chain protects generated results and
  document edits everywhere else; the /documents editor guards `docDirty`.

## Rezi comparison

Rezi's AI writer keeps entered context; its Aug 2026 changelog emphasizes not losing
your place/work across navigation ("refresh the page without losing your place",
"Streamlined Application Management"). Silently dropping typed inputs on a stray
Escape is below that bar.

## Fix (smallest)

In `BundleToolDialog` only:

1. Derive `inputsDirty` per kind:
   - cover: `company !== initialCompany || addressee || highlights` (trimmed)
   - resignation: `currentRole || lastDay || reason` (trimmed)
   - interview: `question` (trimmed; `session`/`answer` already counted)
2. Fold `inputsDirty` into `unsavedWork` — the existing close-confirm dialog,
   `useHistoryGuard`, and `beforeunload` guard all key off it, so every discard
   path is covered with no new wiring.
3. Honest confirm copy: when nothing generated is at risk, say the typed
   details/question will be lost instead of claiming "The generated letter will
   be lost."

## Non-goals

- No persistence of dialog inputs across reload (sessionStorage) — reload is now
  guarded by the browser prompt; persistence is a separate candidate.
- No change to generated-result guards, overwrite warnings, or /documents guards.

## Validation

- tsc, eslint (changed file), build, verify-dist.
- Production QA at 375×812 and 1280×900: typed setup input + Escape → confirm
  dialog with honest copy; Keep working preserves fields; Discard closes; blank
  dialog still closes freely; generated-letter guard copy unchanged.
