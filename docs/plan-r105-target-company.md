# R105 — Target company on the target job (grounds AI drafts)

## First-hand evidence (2026-08-29)

- Rezi resume Settings dialog (`~/audit-r1/shots-r105/settings-top.png`, `settings-scrolled.txt`)
  has a "Target your resume" block with three per-resume fields: **JOB TITLE**,
  **COMPANY NAME** and **JOB DESCRIPTION**. Rezi feeds these into its AI generation
  (cover letter, keyword targeting) so drafts can reference the company by name.
- Same audit confirmed no other new editor gaps: the "Break" toolbar item is a
  page-boundary indicator label (`break-after-drag.png`), which our paginated preview
  already covers; the Settings LANGUAGE field is out of scope (English-only product);
  in-settings resume upload duplicates our existing PDF/DOCX/TXT import.

## Gap

HonestCV stores `targetRole` + `jobDescription` per resume but has no persistent
company field. Consequences:

1. AI context (`aiTargetRole()`, 10 call sites since R104) never names the company —
   tailoring, summaries and interview questions read "Target role: Frontend Engineer
   (Senior)" with no employer grounding.
2. The cover-letter dialog's Company input starts empty unless the user deep-links
   from /jobs (`?company=`); typing it again per document is friction Rezi avoids.
3. "Target my job" from /jobs copies title + JD but silently drops the company.

## Design

Minimal, mirrors R104's pattern exactly — one optional string, one shared helper, no
Worker/prompt/quota/ATS/export changes.

1. `Resume.targetCompany?: string` (optional; sanitizer `asStr(...) || undefined` so
   legacy resumes and empty values keep the property absent — stored bytes unchanged).
2. `aiTargetRole()` appends ` at <Company>` when set:
   - role + level + company → `Frontend Engineer (Senior) at Acme`
   - role + company → `Frontend Engineer at Acme`
   - level + company only → `Entry level position at Acme`
   - company only → `Position at Acme`
   All 10 existing AI call sites (Builder ×9, Assistant ×1) inherit this for free.
3. Builder "Target job" section: a third field `Company` (Input, id `targetCompany`,
   placeholder "e.g. Acme Corp") in the existing `sm:grid-cols-2` grid next to
   Target role / Experience level; stacks full-width on mobile like its siblings.
4. Cover-letter dialog prefill: when opened as `cover` without a /jobs deep-link
   company, `initialCompany` falls back to `resume.targetCompany`.
5. /jobs "Target my job" / "Cover letter" actions also copy `job.company` into
   `targetCompany`.

## Non-goals

- No change to ATS scoring, `resumeToPlainText`, exports, preview, or quota.
- No Worker/prompt changes (company rides the existing `role` argument).
- No company field on the resignation-letter path (that is the company you're
  *leaving*, not the target company).
- No new storage key or migration; typing in the field alone makes no network call.
