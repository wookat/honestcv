# R48 — Mobile download menu in the builder header

## First-hand evidence (2026-08-29, ~/audit-r1/shots-r48/)

Rezi, logged in, 375×812, `/dashboard/resume/<id>/finish-up`:

- The fixed bottom toolbar's **Download** action opens a bottom sheet with
  `Download PDF`, `Download .DOCX`, `Save to Drive` and a `Downloads left: 2`
  counter (`r48-rezi-download.png`). Both PDF and DOCX are one tap away on
  mobile.
- `Adjustments` and `Template` bottom sheets were also captured
  (`r48-rezi-adjustments.png`, `r48-rezi-template.png`) — our mobile
  "Preview & score" pane already exposes the equivalent controls (templates,
  font family, text size, spacing, sections, divider, Auto-fit), so those are
  not gaps.

RezUp production, 375×812, `/builder`:

- The header shows only the **PDF** button. `DOCX` and `TXT` are
  `hidden sm:inline-flex`, `MD` is `hidden md:inline-flex`
  (`Builder.tsx` header actions). At 375px there is **no way to download
  DOCX/TXT/MD at all**, while our own onboarding checklist says
  "Download your resume as PDF or DOCX".

## Gap

P1 (mobile acceptance is a hard criterion): DOCX export — a headline,
already-paid-for feature — is unreachable on phones. Rezi offers PDF + DOCX
from its mobile download sheet.

## Design

Minimal, no new deps, follows the existing `ResourcesDropdown` pattern in
`Layout.tsx` (useState + absolute-positioned menu):

- Keep the PDF button unchanged (primary action stays one tap).
- Add a mobile-only (`sm:hidden`) chevron button right after the PDF button
  that toggles a small dropdown with `DOCX`, `TXT`, `MD` items, each calling
  the existing `download(fmt)` and closing the menu.
- Items are ≥40px tall; menu is anchored below the header, right-aligned.
- Desktop (sm+) keeps the existing separate DOCX/TXT/MD buttons — the new
  button is hidden there, so no duplicate controls.

Not copied: Rezi's `Save to Drive` (no Drive integration — adding the button
without the capability would be fake) and the `Downloads left` counter (we do
not meter downloads).

## QA plan

- 375px: menu opens/closes, DOCX item triggers a real download (unlocked or
  free-mode gate behaves as on desktop), items ≥40px, no horizontal overflow,
  console clean.
- 1440px: new button hidden; existing PDF/DOCX/TXT/MD buttons unchanged.
- localStorage byte-identical after QA.
