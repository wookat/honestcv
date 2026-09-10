# R771 — exports and read-only previews stop printing editor placeholders

## Evidence

- R770 production QA (PR #988) recorded that the Oxford Careers Service DOCX imports
  `St Mary's High School` as a school-first education entry with an empty degree, and that the
  editable preview shows the click-to-type placeholder `Degree` in that slot. That is fine in the
  editor; it is not fine on the user's document.
- `qa/r771-placeholders.mts` (not committed) runs the real DOCX through
  `extractResumeFile → parseResumeText → buildResumePdf` and reads the PDF back with `pdftotext`:
  line 56 of the exported PDF is literally `Degree · St Mary’s High School`. The TXT export of the
  same resume contains no `Degree` — `resumeToPlainText` already joins the fields it has.
- Code walk of every renderer that draws an entry heading:
  - `src/lib/pdf.ts`: experience `${e.role || 'Role'}  ·  ${e.company}…` (two shapes), education
    `${e.degree || 'Degree'}  ·  ${e.school}…`. Also prints `Engineer  ·  , London` when the
    company is blank but the location is not. Every other section already uses a
    `*HeadingLine` helper that filters blanks.
  - `src/lib/docx.ts`: `headRuns(x || 'Role'|'Degree'|'Course'|'Award'|'Publication'|'Rank')` in
    seven places, followed by a separator run that assumes the head was printed.
  - `src/lib/resume.ts`: plain-text / Markdown grouped-experience rows use `e.role || 'Role'`.
  - `src/components/ResumePreview.tsx`: `InlineText fallback="Role"|"Degree"|"Course"|
    "Certificate"|"Award"|"Publication"|"Rank"` renders the fallback in read-only previews too —
    the shared page (`/s/:id`), dashboard thumbnails, the template compare grid and the landing
    hero all render `<ResumePreview>` without `onEdit`.
- Which entries reach these paths with an empty head: every section filter admits an entry when
  *either* field is set (`education.filter(e => e.school)`, `involvementEntries`,
  `courseworkEntries`, `awardEntries`, `publicationEntries`, `militaryEntries`,
  `experience.some(e => e.company || e.role)`), so a school-only, organisation-only or
  venue-only row is exported with a placeholder head. Retained-corpus frequency after R770 is
  low (the only school-without-degree rows in the 114-text replay are the unreliable canva-3
  file), but the Oxford file is a real CV and UK school-leaver CVs list secondary schools without
  a degree as a rule; a user typing only a company or an organisation in the builder hits the
  same path.

## Decision

One rule, applied to every renderer: a blank head never prints a placeholder; the tail
(school / company / organisation / venue / branch) takes the head position and the separator
is dropped. The editable preview keeps its placeholders — they are click-to-type affordances,
not document text.

- `resume.ts`: `entryHeading(head, tail, sep)` → `{ head, tail }` with the tail promoted when the
  head is blank; `experienceHeadingParts(e, grouped)` and `educationHeadingParts(e)` build the
  tail (`company, location` / `school, location`) so PDF and DOCX agree byte-for-byte on the text.
  Grouped plain-text / Markdown rows drop the `'Role'` fallback.
- `pdf.ts` / `docx.ts`: use the parts (`headRuns(head)` + plain `tail` run); the other DOCX
  sections apply `entryHeading` with their own separator (`  ·  ` / ` — `).
- `ResumePreview.tsx`: `InlineText` gains `placeholder` (shown only when editable); the tail
  span drops its separator and `font-normal` when the head is blank in a read-only preview.

## Rejected

- Filling the degree from import heuristics (e.g. inventing `Secondary education`): the resume
  would state something the source never said.
- Filtering school-only rows out of exports: loses real content (the school, its dates, A-level
  details).

## Verification

- Local replay, `qa/r771-placeholders.mts` on the R770 base worktree vs this branch, 116 cases
  (114 retained texts + the Oxford DOCX + a synthetic empty-head resume), each written as
  PDF (`pdftotext -layout`), DOCX (`word/document.xml` text) and TXT:
  - TXT: 116/116 identical.
  - PDF text: 113/116 identical; the 3 diffs are `Degree · University/College/High School` →
    `University/College/High School` (canva-3 ×2), `Degree · St Mary’s High School` →
    `St Mary’s High School` (Oxford), and the synthetic `Role · Acme Corp, Leeds` →
    `Acme Corp, Leeds`, `Engineer · , Leeds` → `Engineer · Leeds`, `Degree · St Mary’s…` →
    `St Mary’s…`. 3 CJK files skip PDF in node (webfont fetch) on both sides.
  - DOCX text: 112/116 identical; the same three plus gdocs-cloudcolleague
    `SheetsResume.com  ·  ` → `SheetsResume.com` (blank company after a role — DOCX printed the
    separator unconditionally, PDF did not).
- `qa/r771-preview.tsx` renders `<ResumePreview>` with and without `onEdit`: read-only heads
  `Acme Corp, Leeds` / `Engineer · Globex` / `Engineer · Leeds`, zero `Role`/`Degree`; editable
  heads keep `Role · Acme Corp, Leeds` and the `Degree` placeholder.
- Gates: tsc (app + worker), eslint on changed files, build, verify-dist — green.
- Production (testing agent, first deploy `index-Cp1Y3v1K.js`): Oxford import state identical to
  R770; editable preview keeps `Degree`; read-only `/s/:id` heading `St Mary’s High School` bold
  with no placeholder; PDF / DOCX / TXT / MD exports contain `St Mary’s High School`, no
  `Degree` / `Role`, Oxford entry intact. Two findings: the read-only preview still printed
  `Engineer  ·  , Leeds` for a UI-edited empty company (the preview joined `, location`
  unconditionally — fixed, PDF/DOCX already used the shared parts), and `/s/:id` at 375×667 had
  scrollWidth 495 vs 360 because the header's three buttons did not wrap (fixed with
  `flex-wrap`). Redeployed as `index-B01OD2cj.js`; see handoff for the re-verification.
