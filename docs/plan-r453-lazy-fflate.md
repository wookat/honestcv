# R453 — load fflate lazily so DOCX parsing stops taxing every first paint

## Production evidence (first-hand)

- Post-R452 Lighthouse (simulated mobile, home): perf 88 (was 83), BP 100,
  SEO 100, a11y 100; TBT 130 ms (was 250 ms). Top remaining flagged item is
  still `unused-javascript`: entry `assets/index-DDFERYRM.js` 104.5 KB
  transfer, ~47.5 KB unused.
- The R452 sourcemap breakdown showed fflate contributes ~88 KB of source to
  the entry chunk. `fflate` is imported statically in exactly one module,
  `src/lib/extractFile.ts` (`unzipSync`/`strFromU8`), and used only inside
  `extractDocx()` — i.e. only when a user actually uploads a .docx file.
- `extractFile.ts` is statically imported by four pages (Landing eager;
  AtsChecker/Builder/Dashboard route chunks), so fflate lands in the shared
  entry chunk and every visitor downloads a DOCX unzip engine before first
  paint, whether or not they ever upload anything.

## Fix (narrow)

- Replace the top-level `import { unzipSync, strFromU8 } from 'fflate'` with
  `const { unzipSync, strFromU8 } = await import('fflate')` inside
  `extractDocx()` (already async; the PDF path already lazy-loads pdfjs the
  same way). No caller or API changes; no dependency changes.

## Measured result (local build)

- Entry `index-*.js` 329.86 → 324.37 kB (gzip 101.94 → 99.11 kB); fflate now
  a separate ~5.4 kB `browser-*.js` chunk fetched only on .docx upload. The
  88 KB sourcemap figure was source text (comments included); the minified
  tree-shaken cost was ~5.4 kB. Modest but real, and it removes dead-on-load
  code flagged by `unused-javascript`. The literal `unzipSync` string still
  appearing in the entry is just the destructuring identifiers at the dynamic
  import site, not fflate code (sourcemap shows zero fflate sources in entry).

## Acceptance

- tsc / eslint / build green; entry `index-*.js` shrinks materially and a
  separate fflate chunk appears, requested only on .docx upload.
- Production QA: .docx upload still parses (Builder import + ATS checker,
  file checks intact), .pdf/.txt untouched, damaged-docx copy unchanged,
  zero console errors, R451/R452 regressions, 375 light/dark.

## Out of scope

- pdfjs already lazy; react-dom/radix are required. No other bundle work.
