# R462 — back up an unreadable saved-copies list instead of silently destroying it

## Evidence (production, CDP, cv.zalize.com)

Baseline audit of 7 routes was clean (titles/h1/overflow/dialogs/alerts). The
verified gap is the R461-adjacent surface: the saved-copies list.

Reproduction (`/home/ubuntu/audit-r1/r462_destroy.py` locally):

1. Plant a truncated list: `localStorage['honestcv.resumeVersions'] =
   '[{"id":"v1","name":"My tailored resume","updatedAt":1'`.
2. Load `/dashboard` → the copies list renders as if empty; zero alerts; the
   corrupt raw value is still intact (reads never write).
3. Load `/builder`, open the **Copies** dialog, click **Save current as copy**
   → `honestcv.resumeVersions` is replaced with a one-element list. Every
   previously saved copy is destroyed with no warning.

Root cause: `listResumeVersions()` returns `[]` for both "no list" and
"unreadable list" (`JSON.parse` failure / non-array), and every mutation
(`saveResumeVersion`, `createResumeVersion`, rename/update/duplicate/delete/
restore, `syncActiveVersion`) rebuilds from that empty read and writes back via
`persistVersions()`, overwriting the raw value.

Note: entry-level corruption (one bad element in a valid array) is already
handled per-entry by R402-style sanitization in `listResumeVersions()` and is
intentional; this round only covers a wholly unreadable value.

## Rejected alternatives

- **JSON auto-repair** — guessing at truncated user data risks fabricating
  content; same rejection as R461.
- **Blocking the UI until resolved** — copies are a secondary surface; the
  app must stay usable.

## Fix (mirrors R461)

`src/lib/resume.ts`:
- `stashUnreadableVersions()`: when `honestcv.resumeVersions` exists but does
  not parse to an array, copy the raw bytes to
  `honestcv.resumeVersions.unreadable` (never overwriting an existing backup)
  and return `true`.
- `persistVersions()` calls the stash first, so *every* write path preserves
  the unreadable value before overwriting — regardless of which surface
  triggered the write.

`src/pages/Dashboard.tsx`:
- State initializer `versionsUnreadable = stashUnreadableVersions()` (runs on
  mount, before any write) drives a dismissible `role="alert"` card under the
  My resumes header: "Your saved copies couldn't be read, so the list started
  fresh. The unreadable copy was kept in your browser storage as a backup."

## QA (production, after deploy)

1. Plant the corrupt list → `/dashboard` shows the alert; backup key holds the
   original raw bytes.
2. Builder "Save current as copy" no longer destroys the raw value silently —
   the backup persists byte-for-byte after the write.
3. Existing backup is never overwritten by a second stash.
4. Readable list / missing list: no alert, no backup.
5. Dismiss hides the card only; backup stays.
6. 375px light/dark, no overflow; no console errors; storage restored
   byte-for-byte afterwards.
