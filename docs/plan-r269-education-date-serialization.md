# R269: fix dangling dash in TXT/Markdown education date serialization

## First-hand evidence (R269 production QA, 2026-09-02)

While verifying R268 on production (cv.zalize.com, bundle index-jQ5I_nHr.js), the QA pass
found a pre-existing P3 in the export chain:

- An education entry with only an end date ("2014", blank start) renders in the TXT
  download as `BSc, State U ( – 2014)` — a dangling leading dash.
- An entry with only a start date renders `( 2017 – )` — dangling trailing dash.
- Preview, PDF and DOCX render the same entry correctly (`2014`), because those three
  renderers already use `[e.startDate, e.endDate].filter(Boolean).join(' – ')`.

## Verified facts vs inference

- Verified: TXT and Markdown education branches interpolate `${e.startDate} – ${e.endDate}`
  unconditionally when either is set (src/lib/resume.ts, education branches of
  resumeToPlainText / resumeToMarkdown). Preview/PDF/DOCX use filter+join.
- Verified: all other TXT/MD date sites (experience via experienceDateRange since R268,
  projects/involvement/military via their own helpers, single-date sections) do not have
  this defect.
- Inference: end-only education dates are rare but legal input (users often only record a
  graduation year), so the dangling dash is user-visible in a shipped artifact (TXT export
  is pitched as the ATS-safest format).

## Target behavior

TXT and Markdown education dates use the same semantics as preview/PDF/DOCX:
`[start, end].filter(Boolean).join(' – ')` — end-only → `2014`, start-only → `2017`,
both → `2017 – 2021`, neither → no parenthetical. No `– Present` semantics for education
(unchanged; only experience gets Present per R268).

## Scope

- src/lib/resume.ts: the two education serializer branches only.
- No Worker/API/schema/AI/persistence/scoring/payment changes. No other section touched.

## Validation

- Extend .tmp-smoke/r268_oracle.ts expectations (education end-only/start-only/both forms
  in TXT and MD).
- npx tsc -b, npm run lint, npm run build.
- Deploy; production QA: real TXT download byte-check for end-only education, MD via
  copy path if reachable, regression on experience Present forms (R268), preview/PDF/DOCX
  unchanged.
