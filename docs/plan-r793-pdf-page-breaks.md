# R793 — PDF export keeps a wrapped bullet and an entry header whole across a page break

Origin: R793 function benchmark refresh (five rounds since R788) and the queue item
"page-boundary bullet wraps" carried since R786 ("our own PDF's cross-page wrapped bullets
still come back as two").

## Benchmark refresh (first-hand)

- Rezi public pages (`qa/r793-rezi.mjs` → `/home/ubuntu/qa/r793-rezi.json`): the 8 URLs
  probed since R778 are **byte-identical** to the R788 capture (same redirects to
  `/tools/*`, `/resume-keyword-scanner` still 404). No new public feature to close.
- Production routes `/ /builder /ats-checker /jobs /dashboard /documents /templates/
  /examples/` all 200 (`/pricing` → 307 to `/pricing/`); `/api/jobs/search?q=nurse` 25 rows
  attributed to Arbeitnow + Jobicy.
- Own closed loop (the dimension where the last ten rounds found every defect): the 22-job
  Kenneth résumé re-exported in all 25 templates and re-imported the production way
  (`qa/r793-pagebreak.mts`). 9 templates round-trip all 138 bullets; **16 do not** — the
  first user-visible P1 found this round, and the only one that touches what the user
  downloads (the PDF itself), not just what we read back.

## Evidence (`qa/r793-pagebreak.mts`, `qa/r793-render.mts`, R792 renderer)

`PdfWriter` paginated **each visual line on its own** (`ensure(lineHeight)` inside the
wrap loop), and every entry reserved a flat 34 pt before its header. On a 7-page résumé:

| template group | re-import | what sits at the page bottom |
| --- | --- | --- |
| modern, compact, bold, engineer, slate, horizon, metro, ink, prairie, cobalt | 140 bullets, 2 missing / 4 extra | `• Mobile: 8+ years … Android and Mobile Optimized` ⏎ page ⏎ `• Optimized Web (MOW), developing …` — the continuation is printed with **its own bullet glyph** on the new page (the marker draws on `i === 0` *of the page*), so pdf.js and the parser see two bullets |
| minimal, startup, coral, ledger | 139 bullets, 1 missing / 1 extra | `… Android and Mobile Optimized` ⏎ page ⏎ `   Web (MOW)` — an indented, marker-less orphan line that R786's same-page geometry cannot join across pages |
| sidebar | 26 experiences for 22 | `Pacific Gas and` ⏎ page ⏎ `Electric Company` — a wrapped header split by the page |
| classic, executive, elegant, ivy, corporate, atlas, quartz, ruby, circuit | exact | breaks happened to fall between bullets |

Visually (`/home/ubuntu/qa/r793/before-minimal-break.png`) the PDF a user downloads has a
one-line orphan at the top of page 4 and, on the marker-per-page templates, a bullet that
*reads* as two. The importer joins pages with a blank line after per-page ordering, so no
parser rule could see both halves — the information lives in the renderer.

## Change (`src/lib/pdf.ts` only)

Widow / orphan control in `PdfWriter`, the way every word processor does it:

- `breakIndex(n, lineHeight)`: for a wrapped block of `n` lines, the line index that starts
  a new page, or -1 when it fits. A block of ≤ 3 lines moves whole; a longer block splits
  only where ≥ 2 lines stay on each side. Used by `text()`, `bullet()` and `drawRuns()`
  (rich text), so a bullet's continuation never carries a fresh glyph and no single line is
  stranded.
- `keepEntry(left, right, { lead, sub, body, bullet })` + `titleLineHeight()`: before an
  entry header, reserve the header (its stacked-date variant included), the optional
  sub-line (company info) and the part of the first body block `breakIndex` would keep here;
  otherwise start the page first. Applied through one `entryHeader()` helper to experience,
  projects, involvement, education, coursework, certifications, awards, publications,
  references, military and agent entries (the flat `ensure(34)` is gone).
- `newPage()` / `atPageTop()` factored out of `ensure()`; layout, fonts, margins and the
  measuring path are untouched, so a résumé that fitted before still fits: sample 1 page on
  all 25 templates, Kenneth 7 (Sidebar 8) before and after (`qa/r793-pages.mts`).

Not changed: the importer (R786 same-page joining stays as is; there is now nothing to join
across pages in our own exports), DOCX / preview pagination (DOCX has no fixed pages; the
preview is one column), `measureResumePdf`.

## Tests

- `tests/pdf.test.ts` + 1: seven jobs × seven bullets (one to three lines each) rendered by
  all 25 templates run to 3–4 pages; asserts no intermediate page ends on an entry header,
  a date line or the company-info line, and that the re-imported bullets equal the source
  array exactly. Fails on the R792 renderer (`ledger: page ends on "Series B fintech, 200
  people"`); passes now. `npm test` 181 → 182. Goldens (stored PDFs) unchanged.
- The same test recorded, honestly, an importer gap that is not a page-break matter: the
  `companyInfo` line re-imports as its own header (`Series B fintech` / `200 people`) —
  queued, the assertion counts the seven real headers.

## Local

- Kenneth × 25 templates (`qa/r793-pagebreak.mts`): **25 / 25 return all 138 bullets, 0
  missing / 0 extra** (was 9 / 25). Sidebar still 26 experiences for 22 — its wrapped
  *company* header (`Pacific Gas and` / `Electric Company`, `IBM Global` / `Business
  Services`) is a same-page narrow-column wrap, not a page break; queued with R792's family.
- Page counts unchanged for both fixtures on all 25 templates.
- Gates: tsc app + worker + test, eslint (changed files), vitest 182, build, verify-dist.

## Boundaries

- Blocks of ≥ 4 lines still split (2 + 2 minimum) — a 6-line bullet crosses a page as
  `3 + 3`, printed once with a marker and joined on import by R786 only if the second half
  is on the same page, which it is not: such a bullet re-imports as two. No résumé in the
  corpus or our fixtures has a ≥ 4-line bullet at a page bottom; accepted.
- A section heading directly before an entry is not part of `keepEntry`; a heading can
  still end a page when the entry after it moves (rare: the heading is drawn before the
  entry decides). Queued.
- Sidebar's narrow-column wrapped company names (same-page) are outside this round.
