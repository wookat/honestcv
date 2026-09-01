# R162 — Semicircular score gauge on the Resume strength card

## Firsthand Rezi observation (public app, 2026-08-31)

On the Finish Up page and inside the "Rezi Score" modal, the score is presented
as a semicircular gauge: a colored arc from red (left) through amber to green
(right), a needle pointing at the current score position, the large numeric
score with a qualitative verdict ("Needs improvement") centered beneath the
needle, and `0` / `100` labels at the arc ends. This is the single most
recognizable element of Rezi's scoring UX — the score reads as a position on a
quality dial rather than a bare number.

RezUp today shows Resume strength as a thin horizontal progress bar plus
`{score}% — {verdict}` text (R159). Functional, but far less salient than the
dial and visibly behind the benchmark on the most-viewed scoring surface.

## Change

Add a small self-contained `ScoreGauge` SVG component (Builder-local, no deps):

- Semicircular track split into three fixed color segments matching the
  existing band thresholds: red 0–49, amber 50–79, emerald 80–100 (same
  thresholds as the R152 chip and R159 verdicts — no new semantics).
- Needle rotated to `score * 1.8deg` from the left end.
- Large numeric score + existing `scoreVerdict()` label centered beneath.
- `0` and `100` labels at the arc ends.
- Accessible: root `role="img"` with `aria-label` carrying score + verdict;
  visual-only internals are `aria-hidden`.

Use it on the Resume strength card in the Builder edit column, replacing the
horizontal bar. The "Next: …" hints, the Score breakdown button, and all
scoring logic are unchanged. Zero schema, zero storage, no algorithm changes.

## Out of scope

- "How You Compare" percentile histogram (deliberately deferred — no real data).
- Any change to health/ATS scoring, thresholds, verdict wording, R152 chip.

## QA

- 1440: gauge renders on the strength card, needle/number/verdict consistent
  across low/mid/high scores (band colors match the old bar's for the same
  score); Score breakdown still opens; R159 verdicts unchanged elsewhere.
- 375: card has no horizontal overflow; gauge scales within the card.
- Regressions: R152 sticky chip, R153 guide links, R157 entity jumps.
