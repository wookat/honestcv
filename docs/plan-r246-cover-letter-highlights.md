# R246 — "Details to highlight" field on the Cover Letter tool

## Rezi first-party evidence

AI Cover Letter Generator guide (rezi.ai/rezi-docs/ai-cover-letter-generator-explained,
updated 2026-08-07), step 4 "Start from scratch with our AI Cover Letter Writer":

> "Simply enter the company name, position title, and **any specific past positions,
> education, or skills you'd like to highlight.**"

and the overview:

> "If you're starting from scratch, enter the company name, target job position, and
> **details you want to highlight**, then let our AI Cover Letter Writer create a
> professional draft."

## Current HonestCV state

The Cover Letter dialog (`BundleToolDialog`, kind='cover') has exactly two inputs:
Company name (R183/R238) and Hiring manager (R238). The AI request carries
resumeText/jobDescription/company/role/addressee/language; the user has no way to
steer which achievements/skills the letter emphasizes — Rezi exposes this as a
first-class input.

## Design

One optional field, both generation paths, session-scoped like company/addressee:

- Dialog: "Details to highlight (optional)" textarea (id `cover-highlights`,
  placeholder e.g. "e.g. led the 2024 checkout redesign; fluent in Spanish") under
  the company/addressee row, only for kind='cover'; reset on tool-kind switch.
- Offline template ("Start from a template"): when non-empty, the third paragraph
  becomes `I'd particularly like to highlight: <highlights trimmed>.` inserted before
  the closing paragraph; when empty the output stays byte-identical to R238.
- AI path: payload gains optional `highlights` (trimmed, only when non-empty);
  worker endpoint accepts the field and `buildCoverLetterMessages` appends
  `Details the candidate specifically wants highlighted: <highlights>` with an
  instruction to weave them in naturally. Empty/absent → prompt unchanged.
- Zero schema/scoring/persistence changes; quota flow untouched.

## Validation

1. Field renders only in the cover dialog; resignation/interview unchanged.
2. Empty field → offline template byte-identical to R238 output.
3. Non-empty → template includes the highlight paragraph with trimmed text.
4. AI payload (fetch capture) includes `highlights` only when non-empty; trimmed.
5. Deep-link `?doc=cover&company=` seeding unchanged.
6. Tool-kind switch resets the field.
7. R238 addressee behavior, R239 filenames regression.
8. 375px layout, dark-mode contrast.
9. Zero AI quota consumed in QA (payload capture; quota gate expected).
