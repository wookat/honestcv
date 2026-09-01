# R144 — On-demand optional section cards in the Builder

## Audit evidence (Rezi, live DOM, 2026-08-31)

Rezi's editor nav shows only the core sections (Contact / Experience / Education /
Skills / Summary) plus a `…` "Add or remove section" menu that adds Project,
Certifications, Coursework, Involvement, and Academic/Other submenus on demand.
Optional sections are not rendered as editors until the user adds them.

RezUp today renders all 13 section cards unconditionally — a new user opening the
Builder scrolls past seven empty niche cards (Involvement, Coursework, Awards,
Publications, References, Military, Agents) before reaching Skills. That is an
input wall Rezi deliberately avoids.

## Scope

Builder-only editor UX. Seven optional sections gated: **involvement, coursework,
awards, publications, references, military, agents**. Core cards (Target job,
Contact, Summary, Experience, Education, Skills & certifications, Projects,
Custom sections) stay always-on.

## Design

- A section card renders when it **has content** (any entries, including hidden
  ones) or the user added it this visit (`addedSections: Set<key>` local state —
  same pattern as R126 collapse state; sections with content always reappear
  after reload, an added-but-still-empty card resets like Rezi's unsaved editor).
- Where the gated cards used to be, one "Add a section" card lists the missing
  sections as outline chip buttons (icon + label, ≥40px touch targets). Clicking
  adds the card, scrolls to it, and focuses nothing (no data change — zero
  schema, zero storage, undo history untouched).
- Preview/exports unchanged: they already skip empty sections; hidden-entry
  sections keep their card visible (entries exist).
- Jump targets (R125 preview click, ATS "Fix", custom-section nav): the
  JUMP_EVENT handler adds the key to `addedSections` before scrolling so a jump
  to a gated card always lands.
- Emptying a section (deleting its last entry) keeps the card mounted for the
  visit (it is in `addedSections` implicitly via a content→added migration on
  first render? No —) — simpler rule: card shows if `hasContent || added`;
  deleting the last entry keeps it visible only if the user added it this visit;
  otherwise it disappears with the deletion. Deleting is explicit, so this
  matches "remove section" semantics without a separate remove control.

## Non-goals

- No schema/storage change; no per-section persistence of "added but empty".
- No change to section order controls, preview, exports, or share.
- No removal UI beyond the existing delete-last-entry behavior.

## Verification

Local lint/build green; deploy; production 1440+375: fresh QA profile shows the
"Add a section" card and no empty niche cards; adding Involvement mounts the
card and chip disappears; entering data then reloading keeps the card; ATS
Fix/preview-click jump to a gated section mounts it; R141/R142 hidden entries
keep cards visible; 375px chips reachable, no overflow; R143 contact toggles
regression.
