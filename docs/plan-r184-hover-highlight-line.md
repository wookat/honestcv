# R184 — Hover a bullet suggestion to highlight the offending line

## Evidence (verified public Rezi surface)
Rezi public changelog, Updates January 2025, "Content Analysis and Entry Experience":
"Now recommended content fixes are highlighted when you hover over the suggestion.
This will make it a little bit easier to know what to fix."
(https://www.rezi.ai/rezi-changelog, fetched 2026-09-01. Protected app remains
inaccessible — OTP 403 — so the exact in-app rendering is inference; we only take
the public statement: hovering a suggestion highlights the content it refers to.)

## Current gap
BulletGuidance lists per-line warnings ("⚠ Line 2: …") under the Experience /
Projects / Involvement editors, and R168 draws a wavy amber underline on flagged
lines — but there is no linkage: hovering a specific warning does not indicate
WHICH line in the textarea it refers to. With several flagged lines, users must
count lines by hand.

## Design (local-only, zero schema, zero scoring/export change)
- `LintedTextarea` gains optional `highlightLine?: number | null`. The existing
  pointer-transparent backdrop renders that line's span with a translucent amber
  background (`bg-amber-200/60 rounded-sm`) in addition to the existing wavy
  underline logic.
- `BulletGuidance` gains optional `onHoverLine?: (line: number | null) => void`.
  Each per-line warning `<li>` calls it on mouseenter/mouseleave, and the
  "Fix line N with AI" button also on focus/blur so keyboard users get the same
  affordance.
- `Builder` keeps one piece of state `hlLine: { key: string; line: number } | null`
  (key = `exp-<id>` / `proj-<id>` / `inv-<id>`) and wires the three
  LintedTextarea+BulletGuidance pairs together.

## Acceptance
1. Experience entry with 2+ flagged lines: hovering "Line 1" warning highlights
   only line 1 in the textarea; moving to "Line 3" moves the highlight; leaving
   clears it.
2. Focusing the "Fix line N with AI" button by keyboard highlights line N.
3. Projects and Involvement behave the same.
4. Highlight does not block typing/selection (backdrop stays pointer-transparent),
   does not shift wrapping, and coexists with the R168 wavy underline.
5. 1440 + 375 no overflow; R168/R169 guidance behavior unchanged.
