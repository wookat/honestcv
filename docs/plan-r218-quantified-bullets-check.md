# R218 — "Quantified bullet points" ATS structure check (Builder + /ats-checker)

## Rezi first-hand evidence

Rezi's "Using the Rezi Score" user guide (intercom.help/rezihelp) lists
**"Quantified bullet points"** among the 23 audited details (Content
category) — bullets should carry real numbers so achievements are concrete
and comparable.

## Gap in HonestCV

Quantification exists in two non-scored places: the R169 per-entry
key-number mix chip (guidance `bulletMix`, balanced = quantified ≥
max(1, ceil(total/3))) and the R203 writing-quality "Quantified impact"
dimension (explicitly not part of the ATS score). The ATS structure score in
both paths never checks it — a resume with zero numbers in any bullet scores
identically to a fully quantified one, and the gap never reaches the
deep-linked Priority fixes.

## Design

New structure check `Quantified bullet points` in `src/lib/ats.ts`.

- `quantifiedBulletsCheck(lines)`: reuse the R169 balance rule verbatim —
  pass when lines with a digit (`/\d/`) ≥ max(1, ceil(total/3)). Zero lines →
  guard pass (never punish an empty/unparseable feed). Fail hint reports the
  exact ratio ("only 1 of 9 bullets carries a number — quantify at least a
  third…"), anchor `experience`.
- Builder feed: identical to R216's active-voice feed — visible experience
  bullets + project/involvement descriptions + custom-section bullets.
- Checker feed: reuse `textBulletLines` (bullet-marker lines, markers
  stripped; zero marker lines → guard pass, same rationale as R216).
- Denominators shift by design: checker 17 → 18 checks, Builder 18 → 19
  rows; formula unchanged (each fix ≈ +5.6 = 100/18).
- No AI, API, schema, or persistence changes; only `src/lib/ats.ts`.

## Acceptance

- Builder: 3 visible bullets none with a digit → fail "0 of 3"; adding a
  number to one → pass (1 ≥ ceil(3/3)); 9 bullets with 2 numbered → fail
  (needs 3); hidden entries excluded; deep link lands Experience.
- Checker: pasted bullets without digits fail with exact ratio; text with no
  bullet markers passes (guard); digits in prose (e.g. dates in headers)
  don't count — only bullet-marker lines are scanned.
- Arithmetic: checker 18 rows / Builder 19 rows; no-JD score =
  round(passed/18·100); priority fix +5.6.
- Negatives: R169 chip and R203 dimension behavior unchanged.
- 375px, dark mode, and R217/R216/R211 regressions unchanged.
