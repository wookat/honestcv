# R285 — JD-tailored "Suggest a bullet" (all sections)

## First-party Rezi evidence

- https://www.rezi.ai/rezi-docs/ai-bullet-points (updated 2026-07-16), step 1:
  "If you're applying for a specific role, check **Target your resume** and add
  the job title, company name, and job description. With that information, the
  AI can tailor bullet-point suggestions to the role you want, rather than
  generating generic content." The same guide's intro: suggestions are
  "aligned with your target job".

## Current HonestCV behavior (verified in source + production payloads)

- `buildSuggestBulletMessages` (worker/prompts.ts) grounds only in the entry's
  role/company(+companyInfo), existing bullets and the resume text. It never
  sees the target role or the loaded job description.
- Every other writer path is already JD-aware: `buildRewriteMessages` takes
  `context.jobDescription`, `buildSummaryDraftMessages` and
  `buildKeywordBulletMessages` embed the JD, interview tools embed the JD.
- The Builder has `resume.targetRole` / `resume.jobDescription` in scope at
  `runSuggestBullet` (they drive ATS scoring and rewrite calls).

Gap: with a target job loaded, "Suggest a bullet" (Experience/Projects/
Involvement, R284) still produces untargeted bullets — exactly the "generic
content" Rezi's step 1 warns about.

## Design

- `buildSuggestBulletMessages(..., targetRole = '', jobDescription = '')`:
  when present, the user prompt gains (before the resume block)
  `Target role: <role>` and
  `Tailor wording toward this job description (mirror its keywords only where
  the resume truthfully supports them):\n"""\n<jd.slice(0,4000)>\n"""` —
  the same truthful-mirroring clause as the summary drafts. Both omitted →
  prompt byte-identical to R284.
- Worker `/api/ai/suggest-bullet`: accept optional `targetRole`/`jobDescription`
  strings, pass through. No change to quota, validation or errors.
- `aiSuggestBullet`: optional `targetRole?` / `jobDescription?` fields.
- Builder `runSuggestBullet`: pass `resume.targetRole` / `resume.jobDescription`
  only when non-blank (`|| undefined`), so payloads without a target job stay
  byte-identical to R284.

## Explicitly out of scope

No schema, scoring, export, persistence, rewrite-path or UI changes.

## QA (production, zero AI quota)

- With a target job set: suggest payloads (exp/proj/inv, plain + key-numbers)
  include `targetRole` + `jobDescription` (intercepted pre-network).
- Without a target job: payload keys byte-identical to R284 (no new keys).
- R284 regression: section keys, disabled reasons, dialog apply path.
