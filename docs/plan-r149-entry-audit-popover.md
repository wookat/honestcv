# R149 — Grouped audit popover on collapsed entry chips

## Evidence (first-hand, 2026-08-31, app.rezi.ai)

Observed directly on the Rezi Experience editor (`/dashboard/resume/<id>/experience`):

- Each entry in the sidebar list carries a named audit checklist, not raw per-line
  messages: “Weak Bullet Points”, “Dates are missing”, “Number of Bullet Points”,
  “Quantified Bullet Points” (plus Pro-gated: Personal Pronoun, Buzzwords, Passive
  Voice, Filler Words, Wordy Content).
- Each checklist item expands (aria-expanded) to a short explanation, e.g.
  “Include 3-6 bullet points for each experience. Only 1 found in this section”.
- Passing checks roll up into a single green expandable “3 best practices applied”.

Not verified: exact expansion behavior on other sections; Pro checks’ full copy.

## Gap in RezUp

R148 shipped the collapsed-entry chip (⚠ N / ✓), but its detail lives in a native
`title` attribute:

- invisible on touch devices (375px users get no detail without expanding);
- not keyboard-accessible (focus does not show `title`);
- a flat unordered list of per-line messages, no named grouping, no rollup.

Rezi’s named grouping communicates *what kind* of problem at a glance; ours makes
users read every line.

## Design

Reuse R148’s data, add structure and a real popover:

1. `bulletFindings` → returns structured `{ category, detail }[]` instead of
   strings. Categories map from existing `checkBullets` issue kinds:
   - weak-opener → “Weak bullet points”
   - first-person → “Personal pronouns”
   - no-metric → “Quantified bullet points”
   - filler → “Filler words”
   - buzzword → “Buzzwords”
   - passive → “Passive voice”
   - punctuation → “Punctuation & capitalization”
   - too-long / too-short → “Bullet length”
   - count note → “Number of bullet points”
   - missing start date → “Dates are missing”
2. `EntryAuditChip` renders a CSS popover (no new deps, no Radix):
   relative wrapper + absolutely positioned panel shown on hover/focus-within
   (`group-hover` / `group-focus-within`), `z-30`, right-aligned, max-w, shadow.
   Panel lists each category once with affected lines (“Weak bullet points —
   lines 1, 3”), amber rows, and a final green row “N best practices applied”
   counting the categories that pass for that section type.
3. Chip count semantics unchanged (total findings, same as R148 QA). Click still
   expands the card (mobile path to detail). Green ✓ chip gets the same popover
   showing the all-green rollup list.
4. Replace the `title` attribute with the popover (keep `aria-label`).

## Non-goals / unchanged

- No new lint rules, no Pro-gated checks, no schema/localStorage changes.
- Expanded-card BulletGuidance display unchanged.
- Export / preview / ATS / share untouched.

## QA scope

- 1440 + 375 production: popover on hover and keyboard focus, grouped categories
  match expanded-card warnings, green rollup counts, click-to-expand regression,
  no overflow/clipping at 375px (popover must stay within viewport), R148
  semantics (counts, empty entries, Hidden badge) regress clean.
