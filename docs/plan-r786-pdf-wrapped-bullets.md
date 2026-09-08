# R786 — PDF import: a wrapped bullet is one line for the scorer and the parser

## Evidence (first-hand, R785 production QA + `qa/r786-probe.mts`, `qa/r786-scan.mts`)

- Sumit (Pages CV) uploaded to `/ats-checker`: **DOCX 82, PDF 86** for the same
  content. `Bullet points the right length` fails the DOCX and passes the PDF;
  `Quantified bullet points` reports 6/23 (DOCX) vs 3/23 (PDF).
- The PDF text `pdfPageText` hands to `scoreResumeText` keeps every visual line
  of a bullet as its own line: 23 bullets, 18 of them wrapped, every
  continuation is marker-less (`qa/r786-probe.mts` on
  `/home/ubuntu/qa/r778-downloads/sumit-yadav-resume.pdf`). `textBulletLines`
  in `ats.ts` takes marker lines only, so the scorer
  - measures bullet length on the first visual line (all pass; the source
    bullets run 30–40 words),
  - counts a number only if it sits on the first line (`achieving` /
    `20–30% API performance improvement` → not quantified),
  - drops the continuation text from `Active voice` / `Strong openers` /
    `Punctuated` (punctuation is on the last line).
  The DOCX, whose paragraphs are whole, is the faithful reading.
- The parser (`importText.ts`) joins a marker-less continuation only via
  `continuesPrevious`: lowercase / figure start, or an open-phrase ending on
  the previous line. Sumit's `… App Service, and Storage` + `Accounts,
  integrated into CI/CD …` fails both (capital start, `Storage` is not an open
  word) → the Builder import stores two bullets and every later index shifts
  (R785 testing-agent report; screenshot
  `/home/ubuntu/qa/shots/r785/1280-sumit-pdf-split-azure-bullet.png`).
- Geometry over the 72 retained PDFs (`qa/r786-scan.mts`: every row whose
  first item is a lone list glyph, paired with the row below it):

  | shape | rows | what it is |
  |---|---:|---|
  | glyph item + text item, next row plain, `next.x == text.x ± 2`, same size ± 0.25, pitch ≤ 1.6 em | **132** | hanging-indent wrap — all 132 read as continuations (Sumit 15, Word ×4 21, Google Docs 3, our 25 Northstar templates 75, sidebar samples 2) |
  | same but size differs | 1 | Google Docs template footer (`Made & updated for you by …`), pitch 1.8 em |
  | glyph item, next row plain, `next.x` left of `text.x` (at the margin) | 113 | next header / heading — never a wrap |
  | glyph item, next row is a glyph row | 213 | next bullet (pitch 1.3–1.6 em, same as a wrap — pitch alone cannot tell them apart; `x` does) |
  | glyph inside the text item (`• text` as one item) | 133 | Kenneth LinkedIn 77, Alex / reportlab 12 (non-hanging wraps at the glyph x, pitch ≤ 1.3), Giovanni 3 (pitch 1.6–2), synth headers 4 at the same x and pitch 1.3–1.6 — **ambiguous by geometry**, left to the parser's text rule |

## Root cause

The extractor emits each visual line; nothing rejoins a bullet's wrapped
lines, so the ATS text path scores fragments and the parser has to guess from
wording. The DOCX and TXT paths hand over whole paragraphs.

## Fix (extractor only, `src/lib/extractFile.ts`)

`Segment` records `textX`: the x of the first text item when the segment's
first item is a lone list glyph (`• ● ▪ ◦ · - – — * ■ ○ ➢ ➤ ►`). In
`inOrder`, a segment continues the previous row when

```
prev.textX !== null                      // previous row is a hanging-indent bullet
&& !glyphStart(s.text)                   // this row is not a bullet itself
&& |s.x − prev.textX| ≤ 2 pt              // starts exactly where the bullet's text starts
&& |s.size − prev.size| ≤ 0.25 pt
&& 0 < prev.y − s.y ≤ 1.6 · s.size        // the next line down, not a later paragraph
```

and is appended with a space (no space after a hyphen-broken word, the
`joinWrapped` rule). The joined row keeps `textX` and takes the new `y`, so a
three-line bullet chains. Inline-glyph bullets (`textX === null`) are untouched
— the parser's `continuesPrevious` keeps doing what it does today for them.

Not changed: `ats.ts`, `importText.ts`, DOCX / TXT paths, `unwrapSidebar`
(sidebar items have their own pitch rule), tag rows.

## Validation

- `qa/r786-scan.mts` table above (rule fires on exactly the 132 rows).
- Extractor replay: 72 PDFs, this branch vs the R785 extractor text — expect
  changes only in the files with hanging-indent wraps, every change a line
  join.
- Parser replay on the new texts vs the R785 parse: expect identical output
  except where `continuesPrevious` could not join (capital-start
  continuations such as Sumit's `Accounts, …`).
- ATS replay: Sumit PDF → 82 = DOCX 82 with `Quantified` 6/23; own Northstar
  exports: bullet checks now see whole bullets (a longer bullet may now fail
  `right length` — that is the truthful reading).
- Tests: `tests/pdf.test.ts` — a `buildResumePdf` render of a resume with a
  bullet that wraps to three lines (number on the second line) extracts as one
  `• ` line, is quantified, and the header of the next role is not joined;
  goldens re-generated only where the diff is read and explained.
- Production QA (1280 + 375): Sumit PDF 82 / DOCX 82, Builder import stores
  the Azure bullet whole (23 bullets = DOCX), Oxford / sample / LinkedIn
  regressions unchanged.

## Results (local)

- Extractor replay, 72 PDFs (`qa/r786-extract.mts`): 38 byte-identical, 143
  joins in 34 files; every changed line is a space / hyphen join of two
  consecutive old lines (`OTHER` = 0). Sumit 18 joins, `word-table` 14,
  Stony Brook 9, `word-longtitle` / `word-plain` 6, Northstar 2–6 each.
- Parser replay (`qa/r786-replay.mts`): 70 / 72 identical. Changes:
  `gdocs-cloudcolleague` bullet `Key Results: … responsibilities.` +
  `E.g., revenue, cost savings …` (wrapped sub-bullet) now one bullet;
  Stony Brook `certifications` 28 → 24 segments (`Applicant Tracking System`
  + `(ATS) - software …`, `paid` + `jobs, internships …` and two more wraps
  rejoined). Sumit / Oxford / LinkedIn ×3 / ronstr8 / Alex / UFL / Canva /
  Kenneth / Giovanni parses unchanged (their `continuesPrevious` already
  joined the lower-case wraps).
- ATS replay: 45 / 72 identical. Sumit (no JD): score unchanged 71, checks
  `Quantified` false → **true**, `Right length` true → **false** (the DOCX
  reading), `Punctuated` unchanged. **All 25 Northstar exports + `sample-sidebar`
  91 → 95**: `Punctuated bullet points` had been failing our own exports because
  the scorer saw the first visual line of every wrapped bullet without its
  full stop.
- Tests: 26 PDF text goldens change (84 joined lines replace 168; all 25
  `northstar-*` + `sample-sidebar`), 0 JSON goldens change; new `tests/pdf.test.ts`
  case renders a 194-char bullet through all 25 templates — one `• ` line
  equal to the source, `Quantified` passes, next role header separate. The
  case fails on the R785 extractor (`Received: "• Architected … and Storage"`).
  `npm test` 140.

## Rejected

- Joining in `ats.ts` by wording (a marker-less line after a bullet): would
  glue the next role header (`Senior Software Engineer · Infosys Limited`) and
  headings (`PROJECTS`) to the last bullet for every PDF; the geometry says
  which is which, the wording does not.
- Scoring bullets from `parseResumeText` output instead of the raw text: makes
  the scorer depend on the parser's section model and changes every
  pasted-text score; out of scope.
- Pitch-only wrap detection (as `unwrapSidebar`): a wrap and the next bullet
  share the 1.3–1.6 em pitch in 186 + 66 rows; only `x` separates them.
- Handling inline-glyph bullets by geometry: `Software Engineer · Datalytics`
  (synth-skills-grid) sits at the same x, size and pitch as Giovanni's
  continuation lines.
