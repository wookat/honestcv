# R777 — PDF import: a skills grid whose columns share the tag pitch

## Evidence (first-hand, `chrome-print-ronstr8.pdf` page 3, pdf.js geometry)

R776 left ronstr8's Skills as one flat text with every item but no category
attribution. The section is a two-column grid: labels at 16.4pt, tags at
10.5pt spaced 16.8pt (1.6em) apart, the right column 194.3pt to the right.

```
822  Skills(115–162)  Programming Languages(182.6–362.6)   Technologies(376.9–472.1)
803  Bash Java Perl Golang C (188.9–357.7)                 Kubernetes Git HTML CSS (383.2–549.3)
779  Python Rust Javascript (188.9–323.4)                  REST API OCI AWS Helm (383.2–543.5)
755                                                        Docker Node.js LLM (383.2–505.4)
720  Databases(182.6–259.4)                                Frameworks(376.9–468.4)
700  Oracle MySQL PostgreSQL (188.9–342.7)                 Mason DBIx::Class Netty (383.2–527.4)
675  MariaDB Redis MongoDB (188.9–337)                     Dropwizard React Spring Boot (383.2–551.8)
641  Coding Agents(182.6)
621  Claude Codex OpenClaw (188.9–333)
597  Aider Antigravity (188.9–282.6)
```

Why `columnLayout` (R764) does not see it:

- Candidate gutters are x values where ≥4 *segments* start. On row 803 the
  gap `C`(357.7) → `Kubernetes`(383.2) is 25.5pt = 2.43em of 10.5pt — under
  the 2.5em segment split and inside the 1.5–2.5em tag-row window, so the row
  is one segment `Bash, Java, …, HTML, CSS`. Segment starts on the right are
  376.9 ×2 (labels) and 383.2 ×1 (row 755): no x reaches 4.
- Even if 383.2 were a candidate, the labels start 6.3pt left of it (the same
  6.3pt the left column indents its tags under `Programming Languages` at
  182.6 → 188.9). With `|x − gutter| ≤ 3` the label rows are not anchors and
  `Technologies` counts as a left segment crossing the gutter, so the band is
  rejected.

Sumit's grid (R764) was found because its cells are separated by > 2.5em and
its labels and items share one x.

## Rejected

- Lowering the band floor `min(left, right) < 6` to 5 (R776 experiment): does
  not address either cause; it only changed ronstr8 by accident.
- Splitting a tag row at its widest gap: the row-803 gap is 1.5× the tag pitch
  here, but a single row's uneven spacing is not a column; the column has to be
  confirmed by several rows, which is what `columnLayout` does.
- Parser-side recovery from `Programming Languages Technologies` / `Bash, …,
  CSS`: the text no longer carries the column boundary.
- (Tried, reverted) Parser `foldSkillGrid` absorbing every comma row under a
  label until the next label: Sumit's wrapped cells (`… Prompt Engineering,
  Google` / `Gemini, Vercel AI SDK …`) became `Google, Gemini`, `Architecture,
  Reviews`, `Performance, Optimisation` — in text a wrapped comma list and a
  wrapped tag flow are the same shape; only the geometry knows that ronstr8's
  rows are tags (1.6 em pitch) and Sumit's are prose.
- (Tried, reverted) `isTagRow` accepting two items globally so `Aider
  Antigravity` is joined: correct here, but a two-item row alone is also the
  shape of `Role   Company` / `Location   Date` headers — the first deploy
  of this round wrote ronstr8's Interests `Hacking (in the ESR sense)
  Tinkering with gadgets` as a comma list (caught in the parser replay), so
  two-item rows are only counted, never comma-joined on their own.

## Change

`src/lib/extractFile.ts` `columnLayout`
- Candidate x values also come from items that follow a ≥1.5em gap on their
  line (a tag row's cells), not only from segment starts.
- Starts within 8pt of each other form one candidate: gutter = leftmost x,
  tolerance = spread. A row anchors the band when a segment starts within
  `[gutter − 3, gutter + spread + 3]`. `atGutter` in `lineSegments`, `isLeft`
  and the crossing test keep the leftmost x, as before.

`src/lib/extractFile.ts` `segmentOf` / `pdfPageText.inOrder`
- A segment records its tag count (`tags`, 0 when not a tag row) and its
  comma-joined text (`tagText`); only rows of ≥ 3 tags are comma-joined in
  `text`, a two-item row keeps its spaces unless a flow adopts it below.
- Reading order joins a tag flow that wraps: a row of ≥ 3 tags followed by a
  row of ≥ 2 tags at the same x (± 2 pt), same size (± 0.25 pt), at most
  2.5 em below, is one list (`Bash, …, C, Python, Rust, Javascript`). A
  two-item row never starts a flow. Applies to the main column and grid cells
  (`inOrder`), not to `unwrapSidebar`.

`src/lib/importText.ts`: unchanged — the existing `foldSkillGrid` pairs each
label with its (now single) comma row.

## Validation

- 72-PDF end-to-end replay vs R776 (expect only ronstr8), 114-text replay vs
  R776, LinkedIn ×3 / Oxford PDF+DOCX / Alex / R746 controls identical.
- tsc app+worker, eslint, build, verify-dist; deploy; production QA 1280/375.

## Results

- 72-PDF extractor replay vs R776 (`/home/ubuntu/qa/r777-extract-4.json` vs
  `r776-extract.json`): 71 / 72 byte-identical; ronstr8 96 → 91 lines, the
  only line-set change is the Skills grid + the two wrapped project tag
  flows (`… Networking` + `Antigravity, Claude, Codex` → one row). Page 3
  now detects the grid (`multiColumn` page flags `[false, false, true]`, was
  all false; Sumit `[true, false]` unchanged) — the ATS single-column check
  reports the Skills grid, as it has for Sumit since R764.
- 72-PDF end-to-end parser replay (`qa/r777-e2e.mts`, R776 parser + R776 text
  vs head): 71 / 72 identical; ronstr8 skills
  `Programming Languages Technologies: Bash, …, CSS Python, … Databases` /
  `Frameworks: Oracle, …` / 4 bare rows / `Aider Antigravity` (7 rows) → 5
  labelled rows, one per grid heading, every item present
  (`Programming Languages: Bash, Java, Perl, Golang, C, Python, Rust,
  Javascript` … `Coding Agents: Claude, Codex, OpenClaw, Aider, Antigravity`);
  Logodal project tags `Networking Antigravity` → `Networking, Antigravity`
  (the wrapped tail of the tag flow); Interests `Hacking (in the ESR sense)
  Tinkering with gadgets` unchanged. Sumit 6 labelled rows byte-identical
  (the reverted parser variant broke them).
- 114-text replay: `importText.ts` untouched, so identical by construction.
- tsc app + worker, eslint, build, verify-dist green. Deployed
  `index-CXjRMMBg.js` + `extractFile-41TLHNuj.js` + `importText-Dr8jVXWU.js`
  (extractFile SHA-256 identical to dist; the first deploy `index-hhYEgpIN.js`
  carried the Interests regression and was replaced); Routes `code 10000` as
  always.
- Production QA (`/home/ubuntu/qa/r777-qa.cjs`, cache disabled) 1280 + 375:
  ronstr8 `/ats-checker` → builder — every section object equal to the local
  oracle (skills / projects differ from R776 exactly as above; contact /
  summary / 4 experience / 1 education / customSections identical); Skills
  textarea shows the five labelled rows, Interests rows verbatim; Sumit,
  Kenneth, Giovanni, Alex, Oxford PDF, UFL equal to local oracle and to R776;
  no horizontal overflow (1280 scrollWidth 1265 = clientWidth; 375 360 = 360
  on top / Experience / Projects / Skills panes); 0 console messages, 0 HTTP
  ≥ 400, 0 AI POST, 0 leads, 0 downloads, storage restored to baseline
  (immediate and settled).
- Untested: ronstr8 exports / share; mobile-initiated upload.
- Boundaries: a grid column whose headings and items differ in x by more than
  8 pt is still one candidate per start; a two-item tag row not preceded by a
  ≥ 3-tag row stays a row (`Hacking …, Tinkering …` is not merged with the
  five-item row below it — intended: it is not known to be the same list); a
  tag flow that wraps at more than 2.5 em pitch is not joined; `unwrapSidebar`
  keeps its own R774 rules.
