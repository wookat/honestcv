# R94: Contact icons toggle (Rezi "Icons" parity)

## First-hand evidence (2026-08-29, logged-in Rezi Finish Up)

- Rezi Finish Up toolbar (`/dashboard/resume/<id>/finish-up`) has an `Icons`
  button (aria-label "Icons", free — not Pro-gated). Toggling it swaps the
  contact-line separators: OFF renders `<div>•</div>` between contact items,
  ON renders a small inline SVG icon per item (verified DOM diff: the email
  segment gains a 0.9em envelope `<svg>` filled with the body ink color).
  Evidence: `~/audit-r1/shots-r94/{before-icons,after-icons}.png`,
  `icons-before2.html` vs `icons-after2.html`.
- Also audited this round: Paper size dropdown (Letter/A4) and the Color
  popup (Text color navy/black + 12 accent swatches) — HonestCV already has
  `pageSize: 'letter'|'a4'`, `textColor` (R87) and `accentColor`, so the only
  remaining free toolbar gap is Icons. `Profile picture` stays deferred
  (Pro-gated at Rezi, large schema/export scope).

## Current HonestCV behavior

- Preview joins contact fields with a literal `'  |  '` string.
- PDF `linkLine()` draws text segments separated by `'  |  '` with link
  annotations; DOCX emits `'  |  '` TextRuns between hyperlink runs.

## Design

- `Resume.contactIcons?: 'off' | 'on'` — optional enum, default absent = off,
  so existing stored resumes render byte-identically. Sanitizer whitelists
  `['off','on']`; invalid values fail closed to off. Shared helper
  `contactIconsOf(r)` in `resume.ts` (same pattern as `bulletIndentOf`).
- Icon set (5): mail, phone, map-pin, globe, linkedin — matching the five
  contact fields. Minimal 24×24 stroke paths (lucide, ISC license).
- Preview: when on, contact line becomes inline-flex spans, each prefixed by
  a 10px `currentColor` stroke SVG; the `'  |  '` separators are replaced by
  gap spacing. Off keeps the existing plain join untouched.
- PDF: `linkLine` segments gain an optional `icon` key. When present, each
  segment draws its icon via `page.drawSvgPath` (stroke only, soft color,
  scaled to the text size) before the text; separators become fixed gaps.
  Width math includes icon + gaps; the existing too-wide fallback still
  degrades to plain wrapped text. Off path is bit-identical to today.
- DOCX/TXT/MD: intentionally unchanged — DOCX keeps `'  |  '` text
  separators (glyph icons in Word require embedding raster images or
  symbol-font hacks that render inconsistently across machines). Disclosed
  in the Builder control title and the PR.
- Builder: `Icons` Off/On pill pair after the Indent control, `aria-pressed`,
  title notes it applies to preview + PDF and that DOCX keeps text
  separators. 375px-safe (same pill style as Indent/Divider).

## Out of scope

- Profile picture (Rezi Pro), per-template icon styles, DOCX icon images.

## Verification

- `npm run lint`, `npx tsc -b`, `npm run build`, `git diff --check`.
- Production QA: preview on/off + persistence; PDF icons drawn (vector, text
  still selectable, links intact, no overflow; off = previous geometry);
  DOCX unchanged both states; invalid value fallback; R90–R93 toolbar
  regressions; 375px; console hygiene; zero AI calls; localStorage restore.
