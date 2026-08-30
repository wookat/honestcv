# R66: organization + dates on project entries

## Evidence (first-hand)
- `~/audit-r1/shots-r66/rezi-projects-tab.png`: Rezi's Projects editor is fully
  structured — title, "IN WHICH ORGANIZATION DID YOU DO YOUR PROJECT?", a WHEN
  date range, project URL and a description; projects render with the same
  right-aligned date treatment as experience entries.
- Our `ProjectItem` has only `name`/`link`/`description` — no organization and
  no dates, so student/career-changer resumes (the main users of a Projects
  section) can't show when a project happened or who it was for, and
  `resumeCenter` imports have nowhere to put a project's date range.
- `~/audit-r1/shots-r66/rezi-finishup.png` + `rezi-experience-tab.png`: fresh
  logged-in audit of the finish-up toolbar and experience editor confirms no
  other small structural gap ranks higher this cycle (numeric font-size /
  line-height granularity is a deliberate preset-based design difference;
  dashboard drag-drop import and share already exist).

## Scope
- `ProjectItem` gains optional `org?: string`, `startDate?: string`,
  `endDate?: string` (legacy stored resumes stay valid; sanitize with `asStr`).
- New helpers in `src/lib/resume.ts` as single source of truth:
  - `projectHeadingLine(p)` → `name · org — link` (skipping empties)
  - `projectDates(p)` → `start – end` when either is present, else ''.
- All five render paths (ResumePreview, pdf.ts, docx.ts, resumeToPlainText,
  resumeToMarkdown) use the helpers; dates render right-aligned in preview/PDF
  (same treatment as experience/education) and appended in TXT/MD/DOCX.
- Builder Project entry adds Organization + Start/End inputs.

## Non-goals
- No importText / resumeCenter parsing changes (imports keep current mapping).
- No new storage key, API, or dependency.
- No reusable "save to project list" (Rezi's cross-resume entry store is a
  different architecture; our per-resume copies + folders cover it).

## Acceptance
- Production builder (1440px + 375px): enter name/org/link/dates → preview
  shows `name · org — link` with right-aligned dates; clearing org/dates leaves
  no dangling separators; values persist in `honestcv.resume` across reload;
  no overflow, no console/page errors; lint + tsc + build green.
