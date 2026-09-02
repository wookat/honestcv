# R292 — Resume language in the new-resume setup dialog

## Evidence (Rezi first-party)

rezi.ai/rezi-docs/create-resume (updated 2026-07-16), "Create a resume from scratch":

> You'll be prompted to complete a short setup form before entering the resume builder. …
> You'll also select your experience level so Rezi can tailor the resume-building experience
> to your background. **You can also select the language of your resume if you're applying
> for an international company.**

Rezi's setup form = name / experience level / **language** / optional Target Your Resume
(job title, company, job description).

## Our gap

Dashboard "Start a new resume" dialog (Dashboard.tsx, `newOpen`) already covers target
role, company, experience level, and job description — but not language. Per-resume
language exists since R167 (`Resume.language`, localizes default section headings +
AI writer output) yet is only discoverable deep in the Builder's design panel
(`#resume-language`), after the resume was already created with English headings.
An international user starting fresh has no path to begin in their language.

## Fix (minimal)

Dashboard.tsx only:
- New state `newLanguage: ResumeLanguage` (default `'en'`), reset in `closeNewDialog`.
- New `Language` select in the dialog next to Experience level (same `sm:grid-cols-2`
  row pattern), options from `RESUME_LANGUAGES` (native names, same as Builder).
- `startNewResume` passes `language: newLanguage === 'en' ? undefined : newLanguage`
  (English stays the implicit default — serialized resume unchanged for the common path).

Zero worker/schema/AI/scoring/export changes; `RESUME_LANGUAGES`/`ResumeLanguage`
already exported by resume.ts.

## QA matrix

- Dialog shows Language select, default English, options exactly the 5 native names.
- Create with Español → Builder headings localized (Resumen/Experiencia…), design-panel
  `#resume-language` shows Español, localStorage `honestcv.resume` has `"language":"es"`.
- Create with English → serialized resume has no `language` key (byte parity with R291).
- Cancel resets to English.
- Keep-a-copy path unaffected.
- 375px dialog no overflow; light/dark contrast on the new label/select.
- Zero /api/ai/* calls; restore localStorage + theme baseline.
