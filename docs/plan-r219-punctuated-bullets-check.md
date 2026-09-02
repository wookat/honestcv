# R219 — "Punctuated bullet points" ATS structure check (Builder + /ats-checker)

## Rezi first-hand evidence

Rezi's "Using the Rezi Score" user guide (intercom.help/rezihelp, article
8383527) lists **"Punctuated bullet points"** among the 23 audited details
(Content category): "Properly punctuate to give clarity, readability, and
professionalism, making it easier for employers to understand your
qualifications and achievements."

## Gap in HonestCV

Since R168 the per-bullet guidance flags `punctuation` when a bullet fails
`/^[A-Z0-9]/` (capitalized/digit start) or `/[.!?]$/` (terminal punctuation),
but the ATS structure score in both paths never checks it — a resume whose
bullets are all lowercase fragments without periods scores identically to a
professionally punctuated one, and the gap never reaches the deep-linked
Priority fixes.

## Design

New structure check `Punctuated bullet points` in `src/lib/ats.ts`.

- `punctuatedBulletsCheck(lines)`: reuse the R168 guidance rule verbatim —
  first line (after trim) failing `/^[A-Z0-9]/` or `/[.!?]$/` fails the
  check; hint quotes the offending line (60-char truncation, same as R216)
  and states the fix ("start with a capital letter and end with a period").
  Blank lines skipped; zero lines → guard pass.
- Builder feed: identical to R216/R218 — visible experience bullets +
  project/involvement descriptions + custom-section bullets.
- Checker feed: reuse `textBulletLines` (bullet-marker lines only, markers
  stripped; zero marker lines → guard pass — prose/headers never trigger).
- Anchor `experience` → Priority fixes + "Fix in builder →" deep link.
- Denominators shift by design: checker 18 → 19 checks, Builder 19 → 20
  rows; formula unchanged (each fix ≈ +5.3 = 100/19).
- No AI, API, schema, or persistence changes; only `src/lib/ats.ts`.

## Acceptance

- Builder: bullet "shipped the api" (lowercase, no period) → fail quoting
  the line; "Shipped the API." → pass; "Cut costs by 30%" (no period) →
  fail; digit-start "24/7 on-call rotation." → pass. Hidden entries
  excluded; deep link lands Experience; fix ≈ +5.3.
- Checker: bullet-marker line without terminal punctuation fails; text with
  no bullet markers passes (guard); date headers/prose never trigger.
- Arithmetic: checker 19 rows / Builder 20 rows; no-JD score =
  round(passed/19·100).
- Negatives: R168 per-bullet punctuation underline and R218/R217/R216
  checks unchanged and independent.
- 375px, dark mode, regressions unchanged.
