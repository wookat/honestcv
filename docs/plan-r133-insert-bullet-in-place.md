# R133 — Enter inserts the draft bullet directly below the current one

## Audit evidence (Rezi Finish Up, live DOM, 2026-08-31)

Rezi's preview renders each experience bullet list inside a single
`contenteditable` `<div>` containing a native `<ul>`; pressing Enter inside a
bullet inserts the new `<li>` immediately below the caret's bullet — standard
contenteditable list behavior. Position matters: bullets are ordered by
impact, and a new line belongs next to its context.

RezUp's R129 draft bullet always opens (and commits) at the **end** of the
entry, regardless of which bullet Enter was pressed in. Adding a bullet after
the first of five means typing at the bottom and reordering via the form.

## Change (ResumePreview experience section only, zero schema, zero deps)

- Draft state gains a position: `{ entryId, at, seq }` where `at` is the
  bullets-array index the committed text is inserted at. `onEnterNext` on
  bullet `i` sets `at = i + 1`.
- The draft row renders inline right below bullet `i` (inside the same `<ul>`,
  via keyed fragments), not at the list end.
- Commit inserts immutably:
  `bullets: [...b.slice(0, at), text, ...b.slice(at)]`, then advances
  `at + 1` so continuous typing keeps inserting below the last committed line
  (R129's rapid-entry flow preserved, now positional).
- `DraftBullet` gets a `position` prop: when the row moves in the DOM after a
  commit (native blur fires on element move), a `justCommitted` ref swallows
  that blur and an effect refocuses the row, so continuous entry keeps focus.
- Escape / empty blur discard as before. Non-experience sections unchanged.
  Share/dashboard have no `onEdit` — untouched.

## Acceptance

- Enter in bullet 1 of 3 → draft appears between bullets 1 and 2; typing +
  Enter commits at index 1 (storage + form textarea order match), draft moves
  below the new line for continuous entry.
- Enter in the last bullet still appends at the end (R129 behavior preserved).
- Escape / empty blur discards without touching data.
- R130 clear-to-delete, R127/R131 inline edits, R125/R126/R128 regressions
  green; 375px works; no overflow.
