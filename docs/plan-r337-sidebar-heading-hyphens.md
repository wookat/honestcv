# R337 — fix Sidebar template mid-word heading breaks in the 74px gutter (SOP-02)

## Evidence (first-hand, production audit R337)
- Production audit of the share consumption chain (see
  plan-r337-share-consumption-audit.md) found one P3: with the Sidebar
  template + Spanish headings, long gutter labels break mid-word with no
  hyphen — "EXPERIENCI / A", "HABILIDADE / S", "VOLUNTARIADO R34 / 2" — in the
  Builder preview, the shared resume page, and printed PDFs
  (pdftotext showed `EXPERIENCI\nA`).
- Measured cause: the side-label heading is absolutely positioned in a fixed
  74px gutter with `overflow-wrap: break-word` (ResumePreview.tsx heading
  style). 11px bold uppercase "EXPERIENCIA" needs ~75px, so break-word splits
  it at an arbitrary character. `Range.getClientRects()` confirmed two line
  rects per heading; computed style showed `hyphens: none`.
- English is affected too: "CERTIFICATIONS" (~96px at 11px caps) already
  breaks mid-word the same way.

## Options considered
- Smaller gutter font: helps some words, cannot fit German
  "Berufserfahrung"-class labels or arbitrary custom section names; hurts
  scannability everywhere to fix an overflow case.
- `overflow-wrap: normal`: overlong words would overflow into the body column.
- Truncation/ellipsis: hides meaning of user-authored section names.
- **Chosen: CSS hyphenation.** Add `hyphens: auto` to the side-label heading
  and set `lang={resumeLanguageOf(resume)}` on the resume sheet roots so the
  browser applies the correct hyphenation dictionary (en/es/fr/de/pt — the
  exact set the resume model supports). `overflow-wrap: break-word` stays as
  the last-resort fallback for unhyphenatable strings. Hyphenation acts on the
  source text (uppercasing is via `text-transform`), so "Experiencia" →
  "EXPERIEN-CIA" instead of "EXPERIENCI/A".

## Scope
- ResumePreview.tsx only: `lang` attribute on the three `data-resume-preview`
  roots + `hyphens: 'auto'` in the sideLabels heading style.
- No worker/schema/export changes. PDF/DOCX exports render through their own
  layout code with full-width headings and are unaffected; the print path uses
  this same DOM and picks up the fix.

## Validation
- Local: tsc/lint/build.
- Production: Sidebar + Spanish fixture — gutter headings hyphenate or wrap at
  word boundaries (no bare mid-word split), Builder preview + shared page +
  printToPDF; English Sidebar regression (CERTIFICATIONS hyphenated, short
  headings unchanged); other templates unchanged (no absolute gutter); 375px
  strict width; dark mode; zero AI quota; share revoked and baselines restored.
