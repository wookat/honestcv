# R129 — Add new bullets from the preview (Enter chains a new bullet)

## Audit evidence (Rezi, public logged-in surfaces, 2026-08-31)

On Rezi's Finish Up preview each experience entry's bullet list is a single
`contenteditable` `<ul>` (first-hand DOM: `<div contenteditable="true"><ul><li>…`),
so pressing Enter inside a bullet creates a new `<li>` — you can extend an
entry without leaving the preview. In RezUp (R127) each bullet is its own
plain-text span: Enter commits and blurs; adding a bullet still requires the
form. This round closes that gap for experience bullets.

## Why it matters

R127/R128 made the preview the fastest place to fix text, but the most common
edit while polishing — "add one more achievement line" — still forces a context
switch to the form. Enter-to-add matches both Rezi and universal list-editing
muscle memory.

## Design

Scope: **experience bullets only** (the primary content list, `string[]` per
entry with stable `id`s). Deliberately excluded: involvement/awards/coursework/
publications bullets (derived by splitting a single `description` field —
committing a new line there belongs to that field's own editor), projects
(single `description` paragraph), skills (parsed `label: text` groups).

Behavior (Builder preview only, i.e. when `onEdit` is set):

- Pressing Enter in an existing experience bullet commits that bullet (R127
  semantics unchanged) and then opens a **draft bullet** at the end of that
  entry's list, focused and ready to type.
- The draft is local component state (`{entryId, seq}`), not resume data — the
  resume is only touched when the draft commits non-empty text.
- Draft keys: Enter with text = append bullet via
  `experience.map(x => x.id===id ? {...x, bullets:[...x.bullets, text]} : x)`,
  clear the draft's DOM text and keep typing (chained entry: Enter, Enter, …).
  Blur with text = append and close. Blur empty or Escape = discard, nothing
  written.
- Plain-text only, paste intercepted as `insertText` — same rules as R127.
- No layout impact outside active editing: the draft row exists only while
  open, and share page/dashboard (`onEdit` absent) render exactly as before.

Implementation: `InlineText` gains an optional `onEnterNext?: () => void`
(called after an Enter-commit); new small `DraftBullet` leaf component in
`ResumePreview.tsx` for the uncommitted row. No schema change, no dependency.

## Acceptance

- Local lint + build green.
- Enter in an experience bullet opens a focused draft row; typing + Enter
  appends the bullet (persisted to localStorage, ATS recomputes) and keeps a
  fresh draft; blur commits; Escape/blur-empty discards without touching data.
- R127 non-bullet fields keep Enter=commit+blur (no draft).
- Share page/dashboard unchanged (zero contenteditable).
- 1440 + 375 viewports, no overflow; R125/R126/R127/R128 regressions green.
