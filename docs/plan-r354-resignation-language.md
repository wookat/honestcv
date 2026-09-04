# R354 — localize the resignation letter to the resume language

## First-hand evidence
- R353 production QA observed the resignation-letter payload carries no `language` key. Source confirms the gap end to end:
  - `aiResignationLetter` (src/lib/api.ts) has no `language` field and the Builder call site never passes `resume.language`.
  - Worker `/api/ai/resignation-letter` parses no `language` from the body and calls `callLlm` with bare `buildResignationLetterMessages(...)` — the only writer endpoint besides interview tools that skips `withOutputLanguage`.
  - Cover letter (same dialog, same resume) passes `language: resume.language` and is wrapped in `withOutputLanguage`.
- Net effect: a Spanish/French/German/Portuguese resume (R167 per-resume language) gets a localized cover letter but an English resignation letter — inconsistent within the same tool dialog. Rezi's AI writers respond in the document language.

## Change (minimal)
- `src/lib/api.ts`: add `language?: string` to `aiResignationLetter` input.
- `src/pages/Builder.tsx`: pass `language: resume.language` at the resignation call site (mirrors cover).
- `worker/index.ts`: parse `language` from the body and wrap `buildResignationLetterMessages(...)` in `withOutputLanguage(..., body.language)`.
- No prompt text changes; `withOutputLanguage` is a no-op for `en`/unknown codes so default resumes are byte-identical.

## Non-goals
- Interview brief/questions/feedback localization (coaching output is intentionally English — unchanged scope decision from R167; log as candidate if desired).
- No new languages; OUTPUT_LANGUAGES stays as-is.

## Verification
- tsc/eslint/build; deploy; live bundle check.
- Production QA (mocked POSTs, zero real AI): Spanish resume → resignation payload contains `language:"es"`; default/en resume payload — key present but worker no-op (assert request body); cover regression; tone still passed; 375/dark spot check; baseline restore.
