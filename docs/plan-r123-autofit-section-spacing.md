# R123 — Auto-fit tunes section spacing too (Rezi Auto-adjust parity)

## First-hand evidence (captured this round, 2026-08-31)

Live probe of Rezi's Finish Up & Preview toolbar on a fresh account
(`~/audit-r1/shots-r123/finishup-toolbar.png`, `autoadjust-after.png`,
`lineheight-slider.png`, `spacing-slider.png`):

- **Auto-adjust** is a one-click action that recomputes *three* typographic
  knobs together: font size (11), line height (1.85em slider, 1.5–1.85 range)
  and **section spacing** (1.95em slider, 1–2 range). While it runs, all three
  controls are disabled; when it finishes they show the chosen values.
- The rest of the toolbar (font family, icons, profile picture, paper size,
  divider, indent, text color, view-as-pages) is already replicated in RezUp
  from earlier rounds; section/tab coverage was re-verified as complete
  (Contact/Experience/Education/Skills/Summary/Project/Certifications/
  Coursework/Involvement/Academic▸/Other▸References/Military/Agents).

## Gap in RezUp

RezUp's Auto-fit (Builder preview toolbar) searches only
`fontScale × lineSpacing` (15 combos, roomiest→tightest, stops at 1 page).
`sectionSpacing` exists as a manual knob and is honoured by preview, PDF and
DOCX — but Auto-fit never touches it. A resume that would fit one page by
tightening section gaps alone is instead given smaller text.

## R123 scope

Extend the Auto-fit search space with `sectionSpacing` as a third dimension,
staged so the cost stays bounded:

1. Try the existing 15 `fontScale × lineSpacing` combos at the user's current
   section spacing (unchanged behaviour when that already fits).
2. If nothing fits 1 page, retry the tighter half of the combo list at
   `tight`, then `xtight` section spacing.
3. Keep the "roomiest combo that reaches the minimum page count wins" rule and
   report the chosen spacing in the result message.

Out of scope: continuous sliders (our stepped enums stay), Rezi's Save to
Drive, paid Expert Review ("Review my resume", per-word human review — business
model, deliberately not copied), AI Interview video, Job Search.

## Acceptance

- Local lint/build green; deployed to production.
- A long resume that only fits one page with tighter section gaps gets
  `sectionSpacing` tightened by Auto-fit instead of dropping to `xs` text.
- A short resume keeps today's behaviour (fills the page, spacing untouched).
- 1440px and 375px production verification.
