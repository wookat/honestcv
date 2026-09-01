# R141 — Hide from resume (per-entry visibility toggle)

## Audit evidence (Rezi, live DOM, 2026-08-31)

On Rezi's editor pages, every entry in the section sidebar has a `…` menu with two
actions: **Hide from resume** (a toggle) and **Delete**. Hiding keeps the entry's
data in the list but removes it from the rendered resume — the standard tailoring
workflow: temporarily drop an old role or side project for one application without
losing the content.

RezUp has no equivalent. Removing an entry from the output means deleting it
(recoverable only via undo or the section library). Users tailoring one copy per
job have to delete/re-add entries or duplicate whole copies.

## Change

- `ExperienceItem`, `EducationItem`, `ProjectItem` grow `hidden?: boolean`
  (optional field, same pattern as `gpa?`/`minor?`/`kind?`; sanitizer keeps it
  only when `true`).
- New helper `visibleResume(r)` in resume.ts returns a copy with hidden
  experience/education/project entries filtered out.
- Builder computes `shown = useMemo(() => visibleResume(resume), [resume])` and
  feeds it to every output boundary:
  - live preview (`<ResumePreview resume={shown}>`) — hidden entries vanish from
    the render (and thus inline editing / click-to-edit)
  - PDF / DOCX / TXT / MD downloads and page counting (auto-fit)
  - ATS scoring + assistant/AI plaintext contexts
  - share-link payload (viewers never see hidden entries)
- Entry card headers (Experience / Education / Projects) get an Eye/EyeOff ghost
  toggle next to Duplicate. Hidden cards render with reduced opacity and a
  "Hidden" badge in the header so the state is obvious while editing.
- Editing forms keep working on hidden entries — only outputs filter.

## Not in scope

- Other sections (certifications, involvement, …): their entries are lighter;
  extend later if the pattern earns it.
- No new localStorage keys, no dependencies, no dashboard/share page code changes
  (share pages simply receive the filtered snapshot).

## Verification

- lint + build green locally.
- Production, 1440px: toggle hides entry from preview instantly; PDF/TXT export
  and ATS text exclude it; card shows Hidden badge + dimmed; toggle back restores;
  state survives reload (persisted in `honestcv.resume`); undo/redo treat the
  toggle as a normal edit.
- 375px: toggle reachable in card header, no overflow.
- Regression: R140 undo/redo, R126 collapse, duplicate/delete intact.
