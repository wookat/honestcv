# R795 — a content-replacing import keeps the editor's design

## Evidence (first-hand, `qa/r795-evidence.mts`)

R793 and R794 production QA both ended with one strict-comparison failure per
round trip: `templateId: modern → classic`. Every other field was identical.
The sample resume every new visitor starts from is `templateId: 'modern'`
(`sampleResume()` — "so the first export matches the styled preview"), so the
very first import a user does knocks the preview from Modern to Classic.

Local replay of the exact path (sample resume with every design setting
changed → TXT export → `parseResumeText` → `keepTargetOnImport`):

| field | before import | after import |
| --- | --- | --- |
| templateId | modern | **classic** |
| accentColor | #0f766e | **""** |
| pageSize | a4 | **letter** |
| fontScale / lineSpacing | s / compact | **m / normal** |
| fontFamily, sectionSpacing, pageMargins, sectionDivider, bulletIndent, contactIcons, groupByCompany, textColor | set | **undefined** |
| sectionHeadings (`Work History`), autoSortByDate | set | **undefined** |
| targetRole / jobDescription / language | kept (R-old `keepTargetOnImport`) | kept |

Root cause: `parseResumeText()` starts from `emptyResume()` (Classic, Letter,
no accent); `keepTargetOnImport()` copies only the targeting fields back.
Three product paths replace the editor's content with a parsed file and all
three drop the design:

1. Builder → Import dialog (paste / upload, plus Resume Center share-ID and
   "Import my primary resume") — `setResume(keepTargetOnImport(resume, parsed))`.
2. /ats-checker → "Open in builder" → "Replace resume" — `saveResume(parsed)`.
3. Dashboard → Import → "Open the imported resume" — `saveResume(r)`.

A plain TXT / MD / PDF / DOCX cannot say which template it came from, so the
information cannot come from the file. It *is* known to the editor: the resume
being replaced.

## Options considered

- **Export marker** (write `templateId` into the TXT/MD/PDF metadata and read it
  back). Rejected: only helps our own exports, does nothing for the user's
  own Word/PDF résumé, adds a marker every ATS would see in the text, and the
  PDF metadata is dropped by most converters.
- **Import always Modern** (match the sample). Rejected: still overwrites a
  user-chosen Bold / Sidebar / A4 / serif setup.
- **Keep the replaced resume's design** (chosen). Template, colours, paper,
  typography, heading renames and auto-sort are editor settings, exactly like
  target role / JD that `keepTargetOnImport` already carries. Content
  (contact, sections, `sectionOrder`, `hiddenContact`) still comes from the file.

## Change

`src/lib/importText.ts` — `keepDesignOnImport(prev, parsed)` copies
`templateId, accentColor, pageSize, fontScale, lineSpacing, fontFamily,
sectionSpacing, pageMargins, sectionDivider, bulletIndent, contactIcons,
groupByCompany, textColor, sectionHeadings, autoSortByDate` from `prev`.

Call sites: Builder Import dialog (text, share-ID, Zalize primary — the two
Resume Center paths also gain `keepTargetOnImport`, they had neither),
AtsChecker `replaceAndOpen`, Dashboard `openImported` (the last two only when a
saved resume exists; a first-time visitor still gets the parser defaults).

Not changed: the parser, exports, `sectionOrder` (the file's order wins),
`hiddenContact` (content visibility of the replaced resume's values), the
"Keep saved resume" path, share-link import on `/s/:id` (that resume carries
its own design).

## Tests

`tests/import/rules.test.ts` +2: full design field set survives
TXT → parse → keepDesign while content / sectionOrder / contact come from the
file; editor-default resume hands defaults, not `undefined`.
