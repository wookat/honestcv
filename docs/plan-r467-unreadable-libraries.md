# R467 — back up unreadable content libraries instead of silently destroying them

## Production evidence (CDP, cv.zalize.com, pre-fix)

`honestcv.experienceLibrary` seeded with a truncated JSON value (a saved
"Original Co / Staff Eng" role cut mid-bullet):

- Mounting `/builder` alone preserves the bytes (read-only path) but shows the
  library as empty, with **zero alerts**.
- One click on the toolbar "Save role to library" button rewrites the whole
  key with the rebuilt one-entry list — the original bytes are destroyed with
  no warning and no backup (`honestcv.experienceLibrary.unreadable` = None).

Probe: `/home/ubuntu/audit-r1/r467_library2.py` → `destroyed? True`,
`backup: None`. Baseline restored byte-for-byte.

The same `list → persist` pattern (no stash) exists for all eleven library
keys: `experienceLibrary`, `educationLibrary`, `projectLibrary`,
`involvementLibrary`, `courseworkLibrary`, `awardLibrary`,
`referenceLibrary`, `certLibrary`, `publicationLibrary`, `skillsLibrary`,
`summaryLibrary`. These hold up to 30 polished entries each — content users
deliberately curated for reuse across resume copies.

This is the seventh face of the R461–R466 unreadable-storage family. Unlike
R465/R466 there is no mount-time write; destruction requires one library
save/delete click, so severity is a notch lower but the data is high-value
and the destruction is equally silent.

## Design

Reuse the established write-once exact-bytes backup pattern, generalized:

- `stashUnreadableList(key)` (module-local): raw missing → false; parses to an
  array → false (per-entry sanitize keeps filtering bad entries); otherwise
  write the exact raw bytes once to `${key}.unreadable` (never overwrite an
  existing backup) and return true.
- Every `persistXLibrary()` calls `stashUnreadableList(X_KEY)` before
  `setItem` — protecting all save/delete funnels for all eleven libraries.
- Exported `stashUnreadableLibraries(): boolean` runs the stash across all
  eleven keys (so one corrupted library doesn't leave another unprotected
  behind an early return) and reports whether any was unreadable.
- Builder: `librariesUnreadable` state initializer runs
  `stashUnreadableLibraries()` at mount; dismissible `role="alert"` bar in the
  R427 stacked container: "Some of your saved library items couldn't be read,
  so they're not shown here. The unreadable copies were kept in your browser
  storage as backups."

Rejected: attempting JSON repair (same reasoning as R461–R466 — honest backup
beats guessy reconstruction); a per-library alert (11 near-identical bars
would be noise; the backup keys identify the affected library).

## QA matrix

1. Corrupt experienceLibrary + save-role click → backup bytes equal, new list
   valid, bar with exact copy.
2. Pre-existing backup sentinel not overwritten.
3. Valid list / missing key → no bar, no backup.
4. Non-array JSON treated as unreadable.
5. Two libraries corrupted at once → both backed up, one bar.
6. Dismiss clears only the bar; reload re-shows while corrupt.
7. Coexistence with R461/R466 bars.
8. R461–R466 regressions, 375px light/dark, zero console errors, zero unsafe
   traffic, byte-exact storage restore.
