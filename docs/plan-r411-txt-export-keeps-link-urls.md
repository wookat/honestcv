# R411 — TXT export keeps link URLs

## Evidence (production audit, post-R410 bundles)
A summary containing `[portfolio](https://example.com/qa)` exports to TXT as just
"…a portfolio link." — the URL is dropped entirely (qa/dl/*.txt vs *.md,
`r411_d1_exports.png`). Every other format preserves it: MD keeps the markdown,
DOCX emits a real hyperlink, PDF gets a clickable link annotation (pypdf-verified).
A recruiter or ATS reading the TXT loses the portfolio/profile address.

Source: the Builder TXT download is `downloadText(resumeToPlainText(shown), …)`
(Builder.tsx) and `resumeToPlainText` ends with `lines.map(stripInlineMarks)`
(resume.ts) — `stripInlineMarks` keeps only run text, discarding `href`.

## Constraint
`resumeToPlainText` also feeds ATS scoring, match reports and AI payloads —
those must NOT start seeing URLs (keyword/token behavior would shift). So the
URL-preserving behavior is opt-in on the TXT download path only.

## Fix
- marks.ts: new `stripInlineMarksKeepLinks(text)` — groups runs by `href` and
  renders `label (url)`, skipping the parenthetical when the label already is
  the URL (`label === href` or `https://label === href`).
- resume.ts: `resumeToPlainText(r, opts?: { keepLinkUrls?: boolean })` picks the
  strip function per line; default unchanged.
- Builder.tsx TXT download passes `{ keepLinkUrls: true }`.

## Validation
Local: `npx tsc -b`, eslint on the three files, `npm run build`, oracle on the
new strip function (link, bold-inside-link, label==url, unfinished link stays
literal, no-marks passthrough).
Production QA: TXT download now contains `portfolio (https://example.com/qa)`;
MD/PDF/DOCX unchanged; ATS score and AI request bodies for the same resume
byte-identical to before (no URL leakage into scoring); baseline restore.
