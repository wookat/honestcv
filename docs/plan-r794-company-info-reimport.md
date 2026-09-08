# R794 — the company-info line under an entry header re-imports as `companyInfo`

Origin: R793 recorded honestly that the optional "About the company" line the Builder
offers on every experience entry (`experience.companyInfo`, Builder → `About Brightlane
(optional)`, "One line of context shown under the role") re-imports **as its own entry
header** from our own TXT / Markdown / PDF exports. Queue item #2 after R793.

## Evidence (`qa/r794-evidence.mts`, R793 parser)

Two sample entries with `Series B fintech, ~200 people, B2B payments` and
`Fortune 500 retailer with 12,000 employees`:

| export | what the R793 parser made of the line |
| --- | --- |
| TXT (`Software Engineer at Brightlane (Jun 2023 – Present)` ⏎ line) | a new experience `Series B fintech, ~200 people, B2B payments` that **takes the entry's bullets**; the real entry is left with none |
| Markdown (`### … — …` ⏎ `*line*` — italics are stripped on de-shelling) | same |
| PDF classic / modern / sidebar (soft italic sub-line, pdf.js hands back plain text) | same |

Nothing in the serialised shape marks the line: no glyph, no date, no binder, no terminal
punctuation. The first broad rule ("first unbulleted line after a complete header is
company info") was tried and **rejected by the corpus replay**: 5 / 186 files changed —
Canva's marker-less exports (`Collaborate with top management …`, `Gather, organize, and
analyze data …`) and ronstr8's Chrome print (`Served as primary developer …`, `Built a
high-availability RESTful …`) are ordinary bullets with no glyph and no period, and the
rule stole the first one into `companyInfo`.

## Change (`src/lib/importText.ts`, experience parser only)

`isCompanyInfoLine(line, next)` — a line is company info only when **all** of:

- the current entry has role, company and start date, no company info yet, **no bullets yet**
  (the field is printed straight under the header in every export);
- ≤ 90 characters, no terminal `.!?;:`, no ` · ` / ` | ` / ` — ` binder, no ` at X` phrase
  (an entry header), no bullet glyph, no date, not a location line;
- its first word is not an action verb (`ACTION_VERBS` from `guidance.ts`, the product's own
  list) and not a past-tense `…ed` opener — the shape of a marker-less bullet;
- at least two lowercase content words (`Series B fintech, ~200 people` yes, `AT&T` /
  `Acme Corp` no);
- the **next** non-empty line is structural: a bullet, a dated line, a section heading, or
  the end of the text. A second marker-less prose line after it means the first one was
  a bullet too (Canva / ronstr8 shape).

Everything else — marker-less body lines, wrapped headers, locations, bare years — flows
through the unchanged branches below it.

## Results

- `qa/r794-evidence.mts`: TXT, MD and classic / modern / sidebar PDFs now read back
  `companyInfo` on both entries with their 3 bullets each.
- `qa/r794-replay.mts` (114 text + 72 PDF-text fixtures vs the R793 parser byte copy):
  **186 / 186 identical** — the shape only occurs in our own exports.
- Tests: `tests/import/rules.test.ts` + 2 (TXT / MD round trip on three entries including a
  bullet-less one; guards: Canva marker-less list, action-verb line before the next header,
  undated `Role at Company` header, location line); `tests/pdf.test.ts` + 1 (all 25
  templates re-import role / company / location / dates / companyInfo / bullets field for
  field) and the R793 pagination test now asserts `companyInfo` equality instead of the
  `endsWith('Engineer')` workaround; `tests/docx.test.ts` + 1 (DOCX ≡ TXT re-import with
  company info). All four new tests fail on the R793 parser; `npm test` 182 → 186.

## Boundaries

- Only the first marker-less line under a header, before any bullet; a company-info line
  that starts with an action verb or ends in a period is still read as a bullet.
- A résumé whose first bullet has no glyph, no period, no action-verb opener **and** is
  followed directly by the next entry could now be read as company info — no such line in
  186 corpus files; recorded as the accepted trade-off.
- Sidebar's narrow column can wrap a long company-info line; a wrapped second line is read
  as a bullet (not in fixtures — sample lines fit).
