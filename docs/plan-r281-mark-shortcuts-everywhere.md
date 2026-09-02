# R281 — mark shortcuts on every mark-capable Builder field

## Evidence (research first)

- Rezi changelog (Dec 2023, first-party): "Bold, Italics, Underline, Link now possible —
  Style text directly on your resume … This update allows you the ability to highlight text
  with bold, italic, and underline styling" via a Lexical editor that powers *all* of Rezi's
  text areas ("Major Lexical refactor … the complexity and role of text areas in Rezi").
  In Rezi the styling shortcuts work in any resume text field, not just bullets.
- Our state: R272–R279 made inline marks render correctly in preview/PDF/DOCX/TXT/MD for
  every resume body and headline field (roles, companies, companyInfo, degrees, titles,
  orgs, skills lines, custom sections, references, contact name…). But the Ctrl/Cmd+B/I/U/K
  shortcuts only fire in fields wired to `markShortcutKeyDown`: the three `LintedTextarea`
  bullet editors and (since R279) the Summary textarea. Everywhere else the user must type
  `**`/`__`/`[..](url)` by hand even though the field renders them.

## Change (minimal, deterministic, zero AI)

1. `src/lib/markShortcuts.ts`: generalize from `HTMLTextAreaElement` to
   `HTMLTextAreaElement | HTMLInputElement` (native value setter looked up on the concrete
   element's prototype). `wrapSelection`/`wrapLink` already operate on plain strings.
2. `src/pages/Builder.tsx`: add `onKeyDown={(ev) => markShortcutKeyDown(ev)}` to every
   mark-capable resume content field (single-line Inputs and plain Textareas):
   contact full name; experience role/company/companyInfo; education degree/school/details;
   project name/organization + description handled already; involvement role/org;
   coursework name/where/skills + applied textarea; awards name/by + relevance; publications
   title/journal/type + info; references name/title/employer; military rank/branch/stationed
   + bullets; agents name/skills + bullets; skills textareas; certifications name/issuer/
   relevance + simple list; custom section title + content.
   Excluded on purpose (marks would corrupt semantics or are never rendered as marks):
   locations, dates (MonthYearField), GPA/minor?, emails, phones, URLs/links, share slug,
   file/folder/copy names, target-role/company fields, career-doc letter fields.

## Non-goals

- No toolbar UI, no contentEditable migration, no schema/scoring/export/AI changes.

## Verification

- Oracle: `.tmp-smoke/r281_oracle.ts` — `wrapSelection`/`wrapLink` behavior unchanged;
  shortcut handler accepts input-element events (type-level) and mark toggling on a
  simulated single-line value round-trips.
- eslint + tsc + build green; deploy; production QA via testing agent: Ctrl+B/I/U/K in a
  role Input, companyInfo Input, custom-section textarea, and skills textarea produce the
  marks, render in preview, and round-trip in exports; date/location fields keep browser
  default (no marks inserted); bullets/summary regression.
