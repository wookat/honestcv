# R461 — unreadable stored draft: stop silent data destruction

## Audit (first-hand production evidence)

Baseline route health (r458_audit.py, 2026-08-31): all 7 sampled routes clean —
zero console errors, one `main` each, no overflow.

CDP reproduction on https://cv.zalize.com (r461_corrupt.py / r461_corrupt2.py):

1. Plant a truncated draft: `localStorage['honestcv.resume'] = '{"contact":{"fullName":"Ada Lovelace"'`.
2. Load `/builder`. `loadResume()` catches the parse failure and returns null,
   so the builder silently starts from `emptyResume()` and even re-opens the
   first-run wizard ("What job are you targeting?"). Zero alerts.
3. Type one character in any field → debounced autosave writes the empty
   resume over the stored draft. The user's (possibly fully recoverable)
   data is destroyed with no warning:
   `key after edit: {"contact":{"fullName":"","title":"", ...}` — `still corrupt? False`.
4. Worse: a `?template=` deep link calls `saveResume()` in the mount
   initializer itself, destroying the draft before any user action.

Verified defect: an unreadable draft is silently and irreversibly replaced.
Rezi-grade trustworthiness requires never destroying user data silently
(same honesty family as R351/R392–R397 storage-full rounds).

## Rejected alternatives

- Auto-repairing the JSON: unbounded complexity, risks fabricating content.
- Blocking the builder until the user decides: heavy UX for a rare state;
  starting fresh is fine as long as nothing is destroyed and the user is told.

## Fix (smallest idiomatic change)

- `src/lib/resume.ts`: `stashUnreadableDraft()` — if `honestcv.resume` exists
  but `loadResume()` returns null, copy the raw value to
  `honestcv.resume.unreadable` (never overwriting an existing backup) and
  return true.
- `src/pages/Builder.tsx`: state initializer `draftUnreadable` runs **before**
  the resume state initializer (so the backup exists before the `?template=`
  save path), and renders a dismissible `role=alert` bar in the R427 stacked
  status container: "Your saved draft couldn't be read, so the builder started
  fresh. The unreadable copy was kept in your browser storage as a backup."

Readable drafts, missing drafts, and all other flows are byte-identical.

## Validation

- Local: `npx tsc -b`, `npx eslint`, `npm run build` (+ verify-dist via deploy).
- Production QA: plant corrupted draft → alert bar with exact copy, backup key
  holds the original bytes, keystroke overwrite no longer loses data (backup
  persists), Dismiss clears the bar only; normal load (readable draft / no
  draft) shows no bar and writes no backup; 375px light/dark; byte-exact
  storage restore.
