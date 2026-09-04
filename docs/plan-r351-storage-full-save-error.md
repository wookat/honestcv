# R351 — surface failed local saves instead of silently claiming "Saved"

## Evidence (first-hand, 2026-08-31)
- `saveResume()` in `src/lib/resume.ts` wraps `localStorage.setItem` in try/catch and ignores
  failures ("storage full / private mode — ignore"). `useDebouncedSave` in `src/pages/Builder.tsx`
  unconditionally sets state `'saved'` after calling it, and the toolbar renders "Saved".
- Consequence: with the ~5MB origin quota exhausted (large photos, many copies, career docs),
  every edit appears saved but is silently dropped — reload loses all changes with zero warning.
  R348 audit logged this as an untested informational ("硬配额满时简历自身写入失败未强制触发").
- Rezi benchmark: cloud persistence surfaces save failures; a local-first product must at least
  tell the user persistence is broken (same principle as R314 "surface failed share-link revokes").

## Change (minimal)
1. `saveResume(): boolean` — return `true` on success, `false` when `setItem` throws.
   All other call sites ignore the return value (no behavior change).
2. `useDebouncedSave` returns `'saving' | 'saved' | 'error'`: after the debounce fires,
   state is `'saved'` only when `saveResume` returned true, else `'error'`. A later
   successful save clears the error automatically.
3. Toolbar indicator: the `error` state renders a visible (all widths, not `hidden xl:inline`)
   destructive `role="alert"` label "Not saved — storage full" with a title explaining how to
   recover (delete old copies / large photos). `saving/saved` rendering unchanged.

## Non-goals
- No storage eviction/compression logic, no worker changes, no dialogs.
- `syncActiveVersion` / `recordResumeSnapshot` keep their own silent-catch semantics
  (secondary stores; the primary draft indicator is the user-facing signal).

## Verification
- tsc/eslint/build; production QA: fill localStorage near quota (seed a huge dummy key),
  edit in Builder → indicator flips to "Not saved — storage full" and reload proves the edit
  was not persisted; free space → next edit shows Saving…/Saved again and persists; 375px +
  dark mode; baseline restore.
