# R773 — Function benchmark refresh + LinkedIn "Save to PDF" import keeps the whole profile

## Benchmark refresh (SOP-10, four dimensions, first-hand)

- Rezi public pages re-fetched: `/`, `/ai-resume-builder`, `/pricing`, `/resume-checker`,
  `/job-search`, `/ai-cover-letter-builder`, `/ai-interview` all HTTP 200 with the titles / headings
  recorded at R768; `/resume-keyword-scanner` still 404 (their side). No new public feature since
  R768.
- Production (`cv.zalize.com`): `/`, `/ats-checker`, `/pricing`, `/jobs`, `/sitemap.xml`,
  `/api/ai/quota` 200. `/api/jobs/search` for `engineer` (150 rows, remotive / jobicy /
  arbeitnow), `nurse` (27), `data analyst London` (70), `barista Chicago` (4, arbeitnow / themuse),
  `product manager` (150): every row carries a feed, posting ages are current, zero residual HTML /
  entities / Arbeitnow footer, zero HTTP errors. Nothing new at P0/P1 on the page / API side.
- Workbench: the R772 queue item (optional-section head-only / tail-only shapes) was probed
  synthetically across preview / TXT / MD / PDF / DOCX — every renderer now goes through
  `entryHeading`; no placeholder or dangling separator found. Not a gap.
- Architecture: the one import path the product advertises by name and had never been replayed
  against a real file is LinkedIn — the dashboard has a "LinkedIn import" entry, `importText.ts`
  has a dedicated `looksLikeLinkedInExport` / `parseLinkedInText` branch, and Rezi's builder sells
  the same import. Every earlier corpus (R746 54 PDFs, R763 10 exports, 114 texts) has zero
  LinkedIn exports; the branch was written against a synthetic sample. That is the P1 for this
  round.

## Evidence (LinkedIn)

Three public LinkedIn "Profile → More → Save to PDF" exports, stored outside the repo at
`/home/ubuntu/qa/r773-linkedin/` (PDF producer `Apache FOP 2.2 / 2.3` — LinkedIn's own generator;
2, 3 and 12 pages), extracted through the production path (pdfjs → `pdfPageText()` →
`parseResumeText()`; harness `qa/r773-li.mts`, not committed). All three pass the LinkedIn
detector. Positions in the source, counted as dated `Mon YYYY - Mon YYYY (N years …)` lines:
5 / 7 / 22 = 34.

Before this change (`e4a7019`):

| file                  | experiences parsed                                            | contact                          |
| --------------------- | ------------------------------------------------------------- | -------------------------------- |
| Bhuvaneshwaran (2 pp) | 3 of 5 — main column after the page-1 sidebar lost            | ok                               |
| Giovanni (3 pp)       | 2 of 7; `Italy` / `Remote` locations dropped, website missing | website ``                       |
| Kenneth (12 pp)       | 2 of 22; certifications as `· (2014` degrees                  | email ``, phone `2020 - 2023 (3` |

Root causes, each read at its source line:

1. **Page-1 sidebar ends the main column.** LinkedIn's layout puts Contact / Top Skills /
   Languages / Certifications / Publications in a left column that pdfjs emits _after_ page 1's main
   text and before `Page 1 of N`. The parser switched `section` to the sidebar section and never
   returned, so page 2+ experience lines were appended to `Languages` / `Publications` bullets.
2. **Phone regex spans lines.** `PHONE_RE` is whitespace-tolerant; matched against the whole text it
   joined `2020 - 2023 (3 years)` and, in the R746 corpus, `2019 - 2022\n123-456-7890` (canva-3).
3. **Contact column wraps.** `kenslinkedin2@kennethadams.com` arrives as two lines in the 35-char
   sidebar; `gionn.net (Blog)` / `KennethAdams.com (Portfolio)` are the export's website shape.
4. **Role headers wrap** (`Engineering Team Leader, Senior Scrum Master, Agile Transformation` /
   `& Coaching`), and the company line sits above the wrapped role, so the header became a bullet.
5. **Location without a comma** (`Italy`, `Remote`) and header location `Las Vegas Metropolitan
Area` failed `LI_LOCATION_RE` (which requires a comma).
6. **Education dates** in the export are `Degree · (2011 - 2015)` or a bare `· (2014)` line;
   the generic date extractor left `· (2014` in the degree field.
7. **Sidebar publications wrap** (`"Managing inbound spam in Lotus` / `Domino 6"`).

## Decision

`src/lib/importText.ts` only, LinkedIn branch + `findPhone`:

- `findPhone` matches line by line and rejects a `YYYY - YYYY` candidate (fixes canva-3 in the
  retained corpus as a side effect — the only non-LinkedIn change).
- Sidebar parking: when `Contact` / `Top Skills` appears after a page mark (or, for pasted text
  without page marks, while a main section is open), the experience / education state is parked
  (`enterSidebar`); the next main heading or page break restores it (`leaveSidebar`). Pasted text
  without page breaks additionally hands back up to three short header lines the sidebar swallowed
  when a dated header line arrives (`reclaimSidebarTail`).
- Contact column: wrapped e-mail rejoined; `site (Blog|Portfolio|Personal|Company|Other)` →
  website; `(Mobile)` etc. stripped from phones.
- Header: the last header line that ends in `Area` / `Region` / `Metropolitan` is the location.
- Experience: a role wrapped over two lines is recognised by `& , lowercase` continuation
  (`isLiHeaderWrap`), the company is the header-like line above it; `LI_PLACE_LINE_RE` accepts a
  capitalised no-comma place under the dates.
- Education: `LI_EDU_DATES_RE` reads `· (YYYY)` / `· (Mon YYYY - Mon YYYY)`; a bare dates line
  closes the entry above.
- Custom sections: an open quote, a trailing `/` or `-`, or `continuesPrevious` joins the wrapped
  line.

Not done, on purpose: Kenneth's `About Recommendations @ Recommendations 2001 – Present`,
`Highlights / Key Skills - Part 1 / 2 @ Career Highlights` are real LinkedIn positions the profile
owner created (source lines 30–32, 129–132, 168–169, 200–201) — the parser is faithful to the
export; his certifications sit in LinkedIn's _Education_ section in the source (lines 420–432) and
are kept as school-only education rows (R771/R772 render them without a placeholder). No
heuristic that would drop them was added.

## Local validation

- Three exports after: 34 / 34 positions with company, role, dates; locations `Italy`, `Remote`,
  `Las Vegas Metropolitan Area`, `San Jose, CA`; Bhuvaneshwaran education 3 rows with dates;
  Kenneth contact e-mail / website / location filled, phone empty (the export has none);
  Giovanni website `gionn.net`; publications consolidated to one bullet per title.
- Pasted variant (page marks and blank lines removed, `qa/r773-li-paste.mts`): Bhuvaneshwaran
  identical to the PDF result; Giovanni and Kenneth identical positions, with the bullets between
  the sidebar end and the next dated header staying in the sidebar section (`Remote` + 1 bullet;
  Kenneth's recommendation paragraphs) — a pasted stream has no page boundary to tell them apart.
- Retained corpus (`qa/r768-replay.mts`, 114 texts): 113 byte-identical; canva-3 phone
  `2019 - 2022\n123-456-7890` → `123-456-7890`. Oxford DOCX via `extractResumeFile`: 7 / 7
  experiences, 2 schools unchanged.
- Gates: `tsc` app + worker, `eslint`, `build`, `verify-dist`.

## Deployment and production QA

- Deployed `index-DSPXrNRv.js` + `importText-U1NInBjH.js` (SHA-256 `7e390132…5e65f`, identical
  to dist); Wrangler Routes listing `code 10000` as always (upload succeeded).
- Testing agent, production, 1280×800 + 375×667, cache disabled: three PDFs via `/ats-checker` →
  Fix in builder — Bhuvaneshwaran 5 / 3, Giovanni 7 / 1, Kenneth 22 / 5; all 34 experience and
  9 education tuples, every contact field and the custom sections (Giovanni Languages +
  Publications; Kenneth's six publications, `Special Edition: Using Lotus Domino/Notes R5` as
  the source wraps it) equal the local oracle; Kenneth phone empty; AT&T / Boeing wrapped roles
  whole. Dashboard LinkedIn dialog → recognised as LinkedIn → "Open and replace draft" gives the
  same objects as the ATS path (ids aside). Bhuvaneshwaran text with page marks and blank lines
  removed pasted into the builder import: same contact / 5 / 3 / custom sections. Regressions:
  Oxford DOCX 7 / 2 with `A*` literal and 0 `<em>`, Alex DOCX unchanged vs R772. 375: builder
  cards and preview `scrollWidth = clientWidth` on the long Kenneth roles. 0 AI POSTs, 0 paid
  operations, 0 downloads / shares / saved copies, 0 HTTP ≥ 400; console only the 14 blocked
  `GET /api/ai/quota` reads (builder quota probe, intercepted before the network); storage
  restored byte-for-byte. Untested: exports / shares of these fixtures, mobile-initiated upload.

## Boundaries

- English LinkedIn export vocabulary (`Top Skills`, `Page N of M`, `(Blog)`, `Present`); other
  locales fall through to the generic parser as before.
- A pasted export without page marks keeps some cross-page bullets in the sidebar section.
- Positions the profile owner invented (`Career Highlights`) are imported as written.
- Three files; the R746 `multiColumn` geometry is not involved (LinkedIn's sidebar is handled by
  its own detector).
