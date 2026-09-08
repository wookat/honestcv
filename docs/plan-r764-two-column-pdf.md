# R764 — two-column PDF import: split real columns by geometry, keep the layout disclosure

Queue item from R763: "use the `multiColumn` signal `pdfPageText()` already reports to split columns, or disclose
in the UI". Evidence first, then the smallest change the evidence supports.

## Evidence (first-hand, browser-equivalent path: `pdfjs-dist` → `getTextContent()` → `pdfPageText()` → `parseResumeText()`)

Harnesses (not committed): `qa/r764-columns.mts` (per-page geometry + detector verdict), `qa/r764-ab.mts` (HEAD
extractor + parser vs working tree, same pdf.js items), `qa/r746-extract.mts` (54-PDF R746 corpus replay with the
R746 expectations).

### The shipped detector (`detectColumnSplit`) — what it actually did

Rule: ≥ 40 segments, largest gap between distinct segment x-starts ≥ 80 pt, ≥ 8 segments and ≥ 4 "long" (> 30 chars)
segments on each side; then emit the longer side, then the shorter side, page-wide.

| sample | layout | shipped verdict | effect |
|---|---|---|---|
| `pages-mac-sumit.pdf` (real résumé, Apple Pages, 2 pages) | header band + **two-column skills grid** + single-column experience | `multiColumn=true` | page-wide split at the grid gutter — every right-aligned date / location of the single-column experience below the grid was torn off its row and appended at the end: 15 EXP entries (`Mumbai|India`, `TypeScript|consistently raising…`, `Cloud & Infrastructure|Azure…`), 12 skills, custom `CSS(6)` |
| `word-mac-quartz-stonybrook.pdf` (Word template, right-aligned dates + callout boxes) | single column | `multiColumn=true` | **false positive**: all `Town, State` / `Start Month Year - End Month Year` cells moved to the page end |
| `synth-sidebar.pdf` (synthetic: 200 pt sidebar with CONTACT / SKILLS / LANGUAGES, main column beside it) | page-high sidebar | `multiColumn=false` | **false negative**: interleaved stream — `name: "CONTACT"`, EXP `["|Senior Product Designer · Northbank", "Toronto|ON"]`, skills `1` |
| `synth-skills-grid.pdf` (synthetic: single column with a 2×3 label/items skills grid) | local grid | `multiColumn=false` | rows interleave: `Languages` + `Backend` … → `custom: Languages(11)`, skills `0` |
| `canva-3.pdf` (Canva template: date column · body · sidebar, sample text) | 3 regions | `multiColumn=false` | garbage either way (template) |
| 54 R746 PDFs (26 templates × 2 samples, Word plain / long-title / table) | single column (Sidebar template = single text column) | `false` on all | as R746 recorded |

So the shipped signal was wrong in both directions on the only two-column files we have, and its one `true` on a real
résumé made that résumé *worse* than a plain top-to-bottom read. Disclosure alone ("multi-column detected") would have
fired on a single-column Word template and stayed silent on a real sidebar.

### What separates a column from a right-aligned date (measured, not assumed)

Per candidate x (`qa/r764-columns.mts` prints `gap … L=… R=… cross …` per page):

- A true second column is an x where **several rows start a segment** and which **almost no left segment crosses**
  (`cross ≤ 5 % of rows`). Right-aligned dates fail this: the bullets under them run past the date's x
  (page-wide: stonybrook p1 20 of 66 left segments cross the widest gap; sumit p1 30 of 37 — the experience bullets
  under the grid — which is why the test is applied per band, not per page).
- A date column beside the entries (canva-3 left rail) passes the crossing test but is **date-heavy** (≥ half its
  segments contain a year / "Present"), so it is not a text column either.
- The two columns must both carry **worded** segments (≥ 3 letters) on most rows of the band: bullet glyphs, section
  labels (`EDUCATION` in the R746 Sidebar template) and date fragments do not count. Without this filter the R746
  Sidebar template (label column + content column, glued by a 40 pt fixed gap) was split — the first draft broke
  `northstar-sidebar` / `sample-sidebar` (`exp 2 → 5`).
- Where the two columns coexist is a **band** (rows where a segment starts at the gutter, clustered within 4 line
  pitches). Bands covering ≥ half the page = sidebar (emit main column then sidebar, as before); otherwise a local
  grid (emit the rows above, then the band's left cells, then its right cells, then continue) — the experience section
  under a skills grid keeps its dates on its own rows.
- Segments are re-cut at the gutter: a left cell whose text runs up to the gutter (`Node.js, TypeScript, React,
  Next.js, GraphQL, Tailwind` + `LLMs, RAG Pipelines, …` on one visual row, 1.3 em apart) is otherwise glued to the
  cell beside it by the 2.5 em word-gap rule.

## Fix

### `src/lib/extractFile.ts`

`detectColumnSplit(segments)` → `columnLayout(lines, segments)` returning `{ gutter, bands, sidebar } | null` with the
tests above; `lineSegments(lines, gutter)` re-cuts rows at the gutter when a layout is found. `multiColumn` is now
`true` exactly when a split was applied (sidebar or local grid), so the existing "Single-column layout" ATS check and
the builder's import hint fire on the files whose order the extractor had to repair, and no longer on right-aligned
dates.

### `src/lib/importText.ts` — each rule traced to a line the reordered stream now produces

| observed line(s) | before | rule |
|---|---|---|
| `Lead Software Engineer · Accenture Solutions Private Limited` → `Mumbai, India \| Dec 2021 – Present` | second line became an EXP entry `Mumbai \| India` | under a `Role · Company` header with no dates yet, a **place + date range** line sets location / dates (`PLACE_RE`: 1–3 comma-separated word groups, nothing else) |
| `B.Tech … · Manipal University Jaipur` → `Jaipur, India \| 2014 – 2018 \| CGPA: 8.03 / 10` | second line became an EDU entry | same for education; `\|`-parts after the place go to details |
| `…security best practices, and` → `TypeScript — consistently raising team technical standards` | second line became an EXP entry | a marker-less line after a line ending in a comma or a function word (`and / or / with / of / the …`) continues it (`OPEN_PHRASE_END_RE`); the lowercase / digit rule stays |
| `Languages` → `Python, TypeScript, SQL` → `Frontend` → `React, Next.js, Tailwind` … (grid emitted as label / items pairs) | `Languages` matched `CUSTOM_HEADING_RE` → a Languages custom section swallowed the rest of Skills | inside Skills, a short Title-Case label directly above a comma line is a grid label, not a heading; `foldSkillGrid()` folds ≥ 2 such pairs into `Label: items` lines (the format R714 already keeps) |
| `…GraphQL, Tailwind` → `CSS` (wrapped skill) | `CSS` matched the generic ALL-CAPS heading rule → custom `CSS(6)` | a lone ALL-CAPS token shorter than 6 characters (CSS / AWS / SQL) is not a generic heading |
| `Leadership & Engineering Practices` (34 chars) → `Technical Leadership, …` | first deploy: label cap 32 chars → line stayed a wrap of the Architecture items (5 labelled lines, caught by production QA) | grid label cap 40 chars, the same as the existing `Label:` rule |

## Validation (local, browser-equivalent path)

`qa/r764-ab.mts` — HEAD vs working tree on the same pdf.js items:

- **R746 corpus (54 PDFs)**: 53 byte-identical text *and* identical parse. `word-table.pdf` (R746 "table layout —
  unreliable, unfixed"): text identical, parse changes only via the parser rules — lost bullet recovered, bogus role
  `Storybook and documented keyboard` gone (still not a correct parse; still disclosed as unreliable).
- **R763 external exports (13)**: 8 byte-identical (all single-column Canva / Chrome / Google Docs / Word files);
  `pages-mac-sumit`: `multiColumn` true → true, **4 EXP entries with company, location and dates, 46 skills in 6 labelled
  lines, EDU with location and dates** (was 15 EXP / 12 skills / custom CSS; the `Portfolio: … | Blog: …` footer line
  still becomes a second EDU entry and the contact line still lands in the title — both pre-existing, unchanged); `stonybrook`: true → **false**
  (false positive removed; template text otherwise as before); `canva-3`: false → true, template garbage either way
  (name now `City, ST` because the name sits inside the sidebar — recorded as a boundary, see below);
  `synth-sidebar`: false → true, name / 2 EXP with location + dates / 8 skills / 1 EDU (was `CONTACT` / 2 broken EXP /
  1 skill); `synth-skills-grid`: 2 EXP with location + dates, 6 labelled skill lines, no bogus custom section.
- `npx tsc -p tsconfig.app.json` / `-p worker/tsconfig.json`, `eslint` on the two files, `npm run build`,
  `npm run verify-dist`: green.

## Boundaries (as honest as the evidence)

- Two real two-column files (Pages, Word-on-Mac template) plus two synthetic controls; no LinkedIn PDF export, no
  Canva sidebar résumé with real text. The synthetic files were drawn to the sidebar / grid shapes seen in the
  product's own templates and Rezi's; they are controls, not users.
- A name that sits *inside* the sidebar (canva-3) is emitted after the main column, so name detection (first 5 lines)
  misses it. Header bands spanning both columns (synth-sidebar, sumit) are fine.
- Three-region layouts (date rail + body + sidebar) are still not modelled; `multiColumn=true` is reported and the
  ATS check says so.
- Tables (`word-table.pdf`) remain unreliable and disclosed.
- `PLACE_RE` / `OPEN_PHRASE_END_RE` are Latin-script heuristics.
