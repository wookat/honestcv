# R126 — Collapsible entry cards with identity headers

## Evidence (Rezi re-audit, 2026-08-31, logged-in editor)

- Rezi's Experience editor renders each entry as a collapsible card: the
  header shows the entry's identity ("Software Engineer / Acme Corp") and
  toggles the whole form body via `aria-expanded`
  (`/tmp/page_html_1788198661976.html`, screenshot
  `~/screenshots/ss_f7cc4ca8.png`). Every section behaves this way, so a
  filled resume reads as a compact list of titled cards.
- Same audit round also captured the Rezi Score panel
  (`~/screenshots/ss_3744c34e.png`): its Content/Format/Best-Practices checks
  (weak verbs, pronouns, 3–6 bullets, quantified, dates missing, word count
  400–800, skills categories) are all already covered by RezUp's
  `guidance.ts`, `scoreResume` (R62 dates, word count) and the R? skills
  category tip — no round needed there. "How You Compare" percentile stays
  deliberately skipped (no real data).

## Gap in RezUp

RezUp entries are always fully expanded and headed by anonymous labels
("Role 1", "Education 2"). A resume with 4–5 roles makes the Experience card
a wall of inputs: you can't scan which role is which, and reordering or
spotting an entry means scrolling through every field of every entry.

## Design (UI state only, no schema change)

- Each Experience / Education / Project entry header gains the entry's
  identity next to the existing index label: `Role 1 — Software Engineer,
  Acme Corp` (skipping empty parts), and a chevron toggle button
  (`aria-expanded`) at the far right of the control row.
- Collapsing hides the entry's field body; the header row with drag handle,
  move/duplicate/save/delete controls stays. State is a Builder-local
  `Set<string>` of collapsed entry ids — not persisted, new entries start
  expanded.
- Sections covered this round: Experience, Education, Projects (the
  longest forms). Involvement/military/awards etc. are shorter cards;
  extend later only if QA shows the same pain.

## Acceptance

- Lint/build green locally.
- Collapse hides fields, keeps header + controls; expand restores; state
  survives reorder (keyed by id, not index).
- Header shows live identity as the user types role/company.
- 1440 + 375: toggle ≥40px touch target, no overflow.
- Regressions: drag reorder, move up/down, duplicate, library save, R124
  date picker inside expanded entries, R125 preview jump.
