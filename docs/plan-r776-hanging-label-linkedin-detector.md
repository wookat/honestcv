# R776 — PDF import: hanging section labels + LinkedIn detector false positive

## Evidence (first-hand, generic parser on the deployed R775 corpus state)

`chrome-print-ronstr8.pdf` (Chrome "Save as PDF" of a JSON-Resume-style page, 3
pages, real CV — not a template) parses to **1 empty experience, 1 empty
education, no projects**, although the extracted text is coherent (R763 recorded
this file as a known boundary: "13 custom sections, 0 experiences before R763").
Two independent causes, both measured:

1. **Misrouted to the LinkedIn parser.** The contact block prints
   `ronstr8 (LinkedIn)` / `ronstr8 (GitHub)` (username + network, the JSON Resume
   theme convention). `looksLikeLinkedInExport` accepts a single
   `^\S+ (LinkedIn)$` line, so the whole file goes to `parseLinkedInText`, which
   expects `Experience` / `Education` / `Contact` / `Top Skills` / `Page N of M`
   and finds none → empty résumé. The three real LinkedIn exports (R773) carry
   **all** of: `www.linkedin.com/in/…`, `<user> (LinkedIn)`, `Top Skills`,
   `Page 1 of N`. No other retained file has any of them.
2. **Hanging section labels glued to the first content line.** The theme puts the
   section word in a left gutter, right-aligned to x=161.6 (20.5pt), while every
   body line starts at x≥182.6 (16.4pt heads, 10.5pt body). The gap 161.6→182.6
   is 21pt = 1.28em of the smaller font, under the 2.5em layout-gap split, so
   pdf.js text arrives as `Work Senior Software Engineer`,
   `Projects Logodal`, `Skills Programming Languages Technologies`,
   `Interests Personal Interests`. Document-wide line starts:
   193×33, 183×31, 189×11, 199×6, then singletons (111, 87, 115, 81 = the four
   labels). A bullet glyph / date column never sits left of the margin the
   way these do, because such a column *is* the line start on its rows and so
   defines the margin.

After a manual split of the four labels the generic parser still loses the
Work section: `Work` alone is not a section heading (`work experience` /
`work history` are), so the five experiences stay in the header.

Under Projects, a date range on its own line (`Jan 2026 – Present`) opens a
project named by the date; `ProjectItem` has `startDate`/`endDate`.

## Rejected

- Mapping `(LinkedIn)` only when the file also has `Page N of M`: the dashboard
  LinkedIn dialog accepts pasted text with no page markers (R773 tested it).
- Recognising `Work` by font size in the extractor: the extractor emits text
  only; the split rule is layout-only and the word is the parser's business.
- Splitting at any first item smaller than the page's left margin: a lone `•`
  or `1.` would be split onto its own line; require ≥2 letters.

## Change

`src/lib/extractFile.ts`
- `extractPdf` gathers every page's items first, computes the document left
  margin (smallest rounded line-start x shared by ≥3 lines and ≥5% of lines)
  and passes it to `pdfPageText(items, { margin })`.
- `lineSegments`: on a line whose first item(s) end left of the margin (≥2
  letters, gap to the next item ≥0.75em, next item starts within 3pt of the
  margin) the label becomes its own segment.
- `isTagRow` / `segmentOf`: three or more items on one line spaced by the same
  1.5–2.5em gap (`Kubernetes  Helm  Rust` in the Projects tag rows) are joined
  with `, ` instead of a space, so the parser sees a list rather than a phrase.

`src/lib/importText.ts`
- `looksLikeLinkedInExport` needs two of the four markers.
- `Work` alone → experience heading (`work experience`/`work history` already).
- Projects: a date-only line under the current project fills its dates.

## Validation

- 72-PDF extractor replay vs R775 baseline; 114-text parser replay vs
  `/home/ubuntu/qa/r775-text-replay.json`; the three LinkedIn exports must stay
  identical (34/9 + contact); Oxford PDF/DOCX identical.
- tsc app+worker, eslint, build, verify-dist; deploy; production QA at
  1280/375 with ronstr8 + Kenneth/Bhu regression + Oxford.

## Additional parser rules (each traced to a ronstr8 line after the label split)

- `Software Engineer III, Team Leader` — a comma-separated header whose parts
  are all job titles is one role, not role + employer (`leader` joins the
  title-noun list). Before: role `Software Engineer III`, company `Team Leader`.
- `Buffalo, NY` on its own line under role / company / dates → location
  (`isExpPlaceLine`: ≤40 chars, every part capitalised, no title noun, no
  company suffix, never when the entry already has bullets or a location).
- `Williamsville, United States` as a header line → contact location, and the
  header runs to the first heading (≤20 lines) instead of a fixed six lines, so
  `github.com/ronstr8` under a five-line unheaded summary is still the website.
- `ronstr8 (LinkedIn)` → `linkedin.com/in/ronstr8` when no URL is printed.
- The paragraph directly under the professional title, with no heading, is the
  summary (`headerProse`: stops at the first contact-ish row `| • URL phone`).
- Projects: `Kubernetes, Minikube, Helm, Rust` under a described project is a
  tag row of that project (≥3 comma parts of ≤3 words, no sentence end), not a
  new project.

Tried and reverted: `INLINE_HEADING_RE` accepting three-plus spaces as the
separator (changed R746 synthetic sidebar controls); a summary fallback that
collected body lines before any heading regardless of a title (pulled synthetic
sidebar lines into the summary); dropping the column-band floor from 6 to 5
segments a side so the Skills grid splits into columns — on the 72 PDFs only
ronstr8 changed, but a document-wide layout threshold is not generalised from
one sample while the Skills labels are still not attributed (below).

## Results

- **ronstr8** (generic path `extractResumeFile → parseResumeText`): before
  0 experience / 0 projects / 1 empty education; after contact `Ronald E.
  Straight`, title `Senior Software Engineer`, `Williamsville, United States`,
  `github.com/ronstr8`, `linkedin.com/in/ronstr8`, summary (3 sentences),
  4 experiences with company / `Buffalo, NY` / dates / 3+3+3+1 bullets,
  2 projects with descriptions and `Jan 2026 – Present`, 1 education,
  `Interests` custom section. Skills arrive as text with every item kept but
  the two-column grid's hanging labels (`Programming Languages` /
  `Technologies` / `Databases` / `Frameworks` / `Coding Agents`) are not
  attributed to their columns — recorded as the R777 candidate.
- 72-PDF end-to-end replay vs R775: 68 / 72 byte-identical. `ronstr8` as
  above; `pages-mac-sumit` and `word365-ufl` lose a contact-row "title"
  (`| linkedin.com/in/sumityadav-dev | github.com/`, `City, State | Phone
  Number | Email Address | LinkedIn`) — corrections; `canva-3` (R746
  known-unreliable interleaved sidebar) keeps its wrong title fragment and now
  files the two body lines under it as summary instead of dropping them —
  neutral, experience / education unchanged. The three LinkedIn exports,
  Oxford PDF, Alex and every R746 control are identical.
- 114-text parser replay vs R775: the same three non-ronstr8 files and no
  other; pasted LinkedIn variants (`qa/r773-li-paste.mts`) identical; Oxford
  DOCX identical.
- Gates: tsc app + worker, eslint, build, verify-dist green.
- Deployed `index-C_2DHwNh.js` + `importText-Chi_K70E.js` (SHA-256 identical
  to dist); Routes `code 10000` as always.
- Production QA (`/home/ubuntu/qa/r776-qa.cjs`, cache disabled, 1280 + 375):
  seven `/ats-checker` → "Fix it in the builder" journeys — ronstr8, Kenneth,
  Giovanni, Alex, Oxford PDF, Sumit, UFL — every section object equal to the
  local oracle; Kenneth / Giovanni / Alex / Oxford equal to R775; ronstr8 at
  375 top / Experience / Projects scrollWidth = clientWidth, storage unchanged
  by the reload; 0 console errors, 0 HTTP ≥ 400, 0 failed requests, 0 AI
  POSTs, 0 leads / downloads / shares / copies, storage restored to the
  captured baseline. Untested: mobile-initiated upload, exports of ronstr8,
  BhuResume in the browser (identical locally).
