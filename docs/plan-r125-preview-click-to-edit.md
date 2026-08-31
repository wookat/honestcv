# R125 — Click a preview section to jump to its editor

## Evidence (Rezi re-audit, 2026-08-31, logged-in editor)

- Rezi's Finish up & Preview page renders the resume preview as *directly
  editable* content: section titles, role/company lines and bullet lists are
  `contenteditable="true"` in the DOM (`/tmp/page_html_1788197152759.html`,
  screenshot `~/screenshots/ss_a457fac3.png`). Users can act on what they see.
- Also audited this round: Skills "AI Skills Explorer" (category select +
  suggestions, `ss_ff4b52ee.png`) — RezUp already ships role-based skill chips
  and AI skill rewrite; Summary "AI Summary Writer" — RezUp already ships
  `aiSummaryDraft`; Experience "Sort by date" — already shipped in R86. No
  round needed for those.

## Gap in RezUp

RezUp's live preview is completely inert: spotting a typo or a section you
want to change in the preview gives you nothing to click — you must find the
matching editor card yourself in a long form. The Builder already has a
jump-to-section mechanism (`JUMP_EVENT` + `Section` flash/scroll/expand) used
by ATS "Fix" links, but the preview is not wired to it.

## Design (small, no schema change)

Full inline editing (Rezi's model) would duplicate every field's edit logic
inside the preview — out of scope. Instead: **click any section in the
preview to scroll to, expand, and flash its editor card.**

- `ResumePreview` gains an optional `onSectionJump?: (key: string) => void`
  prop. When set, the header/contact block and each section block become
  clickable (`cursor-pointer`, hover tint, `title="Edit <section> …"`), calling
  the handler with the resume section key. Read-only usages (share page etc.)
  pass nothing and render exactly as before.
- `Section`'s `anchor` prop widens from `SectionAnchor` to `string`; the
  remaining editor sections get anchors (`projects`, `involvement`,
  `coursework`, `awards`, `publications`, `references`, `military`, `agents`,
  `custom`).
- Builder maps preview keys → editor anchors: `certifications` → `skills`
  (shared editor card), `custom:<id>` → `custom`, everything else 1:1.

## Acceptance

- Lint/build green locally.
- Clicking Experience in the preview scrolls to + flashes the Experience
  editor card (collapsed cards expand); same for header → Contact and a
  custom section → Custom sections card.
- Share/read-only preview unaffected (no pointer cursor, no handler).
- 1440 + 375 viewports; ATS "Fix" links still jump correctly.
