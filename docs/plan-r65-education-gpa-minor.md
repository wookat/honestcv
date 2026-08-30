# R65: structured GPA / Minor fields on Education entries

## Evidence (first-hand)
- `~/audit-r1/shots-r64/rezi-editor-education.png`: Rezi's Education editor has
  dedicated inputs for GPA and Minor alongside degree/school/dates — they render
  as a consistent detail line on the resume, and Rezi's importer maps parsed GPA
  into the structured field.
- `~/audit-r1/shots-r65/`: fresh logged-in audit (contact/coursework/involvement/
  dashboard) confirms Rezi keeps every education sub-fact structured; our single
  free-text "Details (GPA, honors — optional)" input mixes GPA/minor/honors into
  one string, so imports (resumeCenter already parses `e.gpa`) flatten it to text
  and users get no formatting consistency across preview/PDF/DOCX/TXT/MD.

## Scope
- `EducationItem` gains optional `gpa?: string` and `minor?: string` (legacy
  stored resumes stay valid; sanitize with `asStr`).
- New helper `educationDetailLine(e)` in `src/lib/resume.ts` composes
  `details · Minor in X · GPA: Y` (skipping empties) — single source of truth.
- All five render paths (ResumePreview, pdf.ts, docx.ts, resumeToPlainText,
  resumeToMarkdown) switch from `e.details` to the helper.
- Builder Education entry adds two small inputs (GPA, Minor) next to Details.
- `resumeCenter.ts` import maps parsed `gpa` into the structured field instead
  of stuffing `details`.

## Non-goals
- No parsing changes in importText (LinkedIn/PDF import keeps writing details).
- No new storage key, API, or dependency.
- No coursework/involvement section types (custom sections already cover them).

## Acceptance
- lint + tsc + build green; GPA/Minor entered in Builder appear identically in
  preview, PDF, DOCX, TXT, MD; empty fields render nothing; legacy resumes with
  GPA text in details unchanged; production QA at 1440px and 375px, console
  clean, localStorage restored.
