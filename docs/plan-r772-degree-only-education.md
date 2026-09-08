# R772 — a degree with no school is an education entry everywhere the builder already says it is

## Evidence

- R771 left one case untested on purpose: an education row with a degree but an empty school. Every
  renderer gated the section and the loop on `school`:
  - `src/components/ResumePreview.tsx`: `resume.education.some((e) => e.school)` /
    `.filter((e) => e.school)` (editable and read-only — `/s/:id`, dashboard thumbnails, template
    grid).
  - `src/lib/pdf.ts`, `src/lib/docx.ts`, `src/lib/resume.ts` (`resumeToPlainText`,
    `resumeToMarkdown`): `some((e) => e.school)` + `if (!e.school) continue`.
  - `src/lib/ats.ts`: check "Education listed" = `resume.education.some((e) => e.school.trim())`;
    `entryLocationsCheck` only listed rows with a school.
- The builder itself does not agree with its renderers. `src/pages/Builder.tsx` treats
  `degree || school` as a filled entry in three places: `resumeHasContent` (line 2251), the entry
  card header (`— {degree, school}` at 4087) and the `EntryAuditChip` `filled` flag (4103). Every
  other entry section filters semantically on either field (`involvementEntries`
  `role || organization`, `courseworkEntries` `name || institution`, `awardEntries`,
  `publicationEntries`, `militaryEntries`). Education was the one section whose second field was
  mandatory.
- Effect measured with `qa/r772-degree-only.mts` (not committed) on the R771 code — a control
  resume with one education row `degree = "BSc Computer Science"`, `school = ""`, dates, details
  `First-class honours`, against a job ad that asks for exactly that:
  - TXT: no EDUCATION heading, no `BSc` — `false / false`; Markdown the same.
  - ATS "Education listed": `false`.
  - ATS keywords `bsc`, `computer`, `honours`: all reported **missing** although the user typed
    them — the ATS scores `resumeToPlainText`, which dropped the row.
  So the builder card says the entry is filled while the preview, every export, the shared page and
  the ATS say the resume has no education. That is a silent inconsistency, not a fail-closed guard.
- Corpus (`qa/r772-eduonly.mts`, not committed): 114 retained texts → 136 education rows, 15 with no
  school, 11 of those with other content. Read row by row, all 11 are template / layout residue in
  four files that earlier rounds already record as unreliable or instructional: canva-3 (R746
  interleaved multi-column: `Conduct ad hoc analysis…`, `2008`, `Hanover and Tyke`,
  `Project Management Assistant`), word-mac-quartz-stonybrook (career-centre template: `Title of
  Diploma`, `Honors/Awards: Related to academics in high school`, instruction bullets),
  word-table (R746 unreliable: `public transport journey planner.`), word365-ufl (`applicants`).
  No real CV in the corpus produces a degree-only row. The real path to this state is the builder:
  typing a degree first, a self-described qualification with no institution, or deleting a school.

## Decision

Education uses the same semantic filter as every other section: an entry prints when it has a
degree **or** a school. One helper, `educationEntries(r)` in `src/lib/resume.ts`
(`degree.trim() || school.trim()`), replaces the six `school`-only gates (preview, PDF, DOCX, TXT,
Markdown, ATS check + entry-locations list). The R771 heading rule already handles the shape:
`educationHeadingParts` prints the degree alone when the school and location are blank — no
separator, no placeholder.

The parser is not touched. The four unreliable / template files now print their residue rows in the
Education section (they already print the same residue in the builder card list, and their
experience sections already carry it), which is the faithful rendering: what the builder lists is
what the document shows, and the user can delete it. Hiding it produced a document the builder did
not describe.

Rejected:
- Keeping the `school` gate and only fixing the ATS check — leaves the preview / exports
  contradicting the builder card and the ATS text.
- Heuristically dropping "junk-looking" degree-only rows at render time — the renderer has no
  evidence the parser lacks; classification belongs in `importText.ts` (R746 / R764 boundaries),
  and this round is about the renderers agreeing with the model.

## Second finding (production QA on the first deploy)

With the row now rendered, the read-only preview printed `BSc Computer Science  ·  ` — the `Tail`
helper (R771) showed the separator whenever the head was non-blank, regardless of whether the tail
had anything. PDF / DOCX were already right (`entryHeading` drops the separator on a blank tail).
The same shape existed before R772 for a role with no company and no location. Fix: `Tail` takes
the tail text and, read-only, prints the separator only when both head and tail are non-blank;
editable mode still always shows it (the empty span is the click target). Applied to all eight
call sites (experience ×2, involvement, education, coursework, certifications, awards,
publications, military).

## Verification

- `qa/r772-degree-only.mts` on this branch: TXT `true / true`, MD `true / true`, "Education
  listed" `true`, `bsc` / `computer` / `honours` matched.
- Base (R771 `68fe60c`) vs branch replay of the R771 116-case harness (`qa/r771-placeholders.mts`)
  as PDF / DOCX / TXT: TXT 112/116 identical, PDF text 113/116, DOCX 112/116 — the differing files
  are exactly canva-3, word-mac-quartz-stonybrook, word-table, word365-ufl (the rows listed above).
  Oxford DOCX, Alex control, every other retained text byte-identical.
- SSR preview (`qa/r771-preview.tsx` extended): read-only heads `Engineer` (role only),
  `MSc Data Science` (degree only), `St Mary’s High School` (school only), `BSc Computer Science  ·
  University of Bristol, Bristol, UK` (complete); a row with both fields blank is not printed;
  editable heads keep `Degree` / `Role` and the ` · ` click target.
- Gates: `tsc -p tsconfig.app.json`, `tsc -p worker/tsconfig.json`, eslint on the five changed
  files, `npm run build`, `npm run verify-dist` — green.
- Deployed `index-CSif6uRI.js`, then `index-D4zz3PYg.js` + `ResumePreview-B7D5qjkI.js` with the
  `Tail` fix. Production QA (testing agent) 1280 + 375 — see the PR / handoff entry for the report.

## Boundaries

- Rendering only: what is parsed and stored is unchanged; template residue that reaches the
  education list is shown, not classified.
- The editable preview shows ` · ` after a degree with no school (click target, by design), as it
  already did after a role with no company.
- English vocabulary is not involved; the rule is field-emptiness only.
