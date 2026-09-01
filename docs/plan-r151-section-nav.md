# R151 — Sticky section navigator for the Builder edit column

## First-hand Rezi evidence (2026-08-31, app.rezi.ai, public editor pages)

- Every Rezi editor page keeps a persistent section navigation bar at the top:
  `Contact · Experience · Education · Skills · Summary · … · Finish Up & Preview · AI Cover Letter`.
  The current section is highlighted; clicking a tab switches to that section instantly.
- Section editor pages (e.g. Skills) additionally show a left outline rail listing the
  section's entries ("Skills 1 — Details") with an add button — the resume is always
  navigable without scrolling hunting.

## Gap in RezUp

The Builder edit column is one long scroll form (Contact → … → Custom). Navigation
exists only indirectly: preview-click jump (R125), ATS "Fix →" links, and the
"Add a section" card. There is no always-visible way to see which sections exist and
jump between them while editing — on a filled resume this means lots of scrolling.

## Design

Add a sticky, horizontally scrollable section chip bar at the top of the edit column
(`Builder.tsx` only, pure UI — zero schema, zero storage, zero deps):

- Chips for each visible section in form order: Contact, Summary, Experience,
  Education, Projects, each optional section that currently has content or was added
  this session (same visibility rule the form already uses), Skills, Custom.
- Click → existing `jumpToSection(anchor)` (smooth scroll + ring flash, opens a
  collapsed section — all existing behavior).
- Current section highlighted via a single `IntersectionObserver` over the section
  cards (top-most intersecting anchor wins); highlight uses the standard
  secondary/active chip styles.
- Sticky below the Builder toolbar (`sticky top-*` with backdrop blur), one row,
  `overflow-x-auto` with hidden scrollbar so 375px scrolls horizontally; touch
  targets ≥40px on mobile (min-h-10), compact at `sm:`.
- Mobile: bar only shown in the Edit tab (it lives inside the edit column).

Out of scope: per-entry outline (entry names inside sections), reordering from the
bar, mini score in the bar (score panel already exists), any AI/export/ATS change.

## QA (production, 1440 + 375)

1. Bar lists exactly the visible sections; optional sections appear/disappear as
   content is added/removed (matching the form).
2. Click each chip → scrolls to and flashes the right card; collapsed section opens.
3. Scrolling the form updates the highlighted chip.
4. 375px: bar sticky under the toolbar, horizontally scrollable, no vertical overflow,
   no overlap with the Edit/Preview bottom tab bar; chips tappable.
5. Regressions: R125 preview jump, ATS Fix →, R144 Add-a-section card, R150 audit
   popover unaffected.
