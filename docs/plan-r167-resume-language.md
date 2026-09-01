# R167 — Per-resume language (localized headings + AI output language)

## Evidence (first-hand + public docs)

- Rezi dashboard → resume row `…` → Settings shows a per-resume **LANGUAGE**
  selector with the caption "Select the language for using AI features and
  resume analysis tool" (screenshot `shots-r167/16-language.png`, 2026-08-31).
- Rezi public docs ("Language Settings", rezi.ai/rezi-docs/how-to-change-your-account-language)
  list supported resume languages: English (US/GB), Spanish, French,
  French (Canadian), Hindi, Korean, German, Portuguese; the resume's language
  drives AI features and analysis for that resume.
- RezUp today has **no language concept**: `SECTION_LABELS` in
  `src/lib/resume.ts` is English-only and every AI prompt writes English.
  A user building a Spanish/German/Portuguese resume gets English section
  headings in preview and all four exports unless they hand-rename every
  heading (R128 overrides), and AI drafts come back in English.

## Gap chosen

Narrow, real, verifiable: an optional per-resume **Resume language** that
1. localizes the default section headings everywhere they render
   (preview, share page, PDF, DOCX, TXT, MD) via the existing single funnel
   `sectionLabel()` / `sectionHeading()` — user heading overrides still win;
2. makes the AI writer reply in that language (rewrite, summary drafts,
   suggest bullet, keyword bullet, tailor to job, cover letter).

Languages shipped: English (default), Spanish, French, German, Portuguese —
the most common Latin-script resume markets; all render fine in the PDF fonts
we embed. (Hindi/Korean need font work — out of scope this round.)

## Design

- `Resume.language?: 'en' | 'es' | 'fr' | 'de' | 'pt'` — additive, optional,
  default `'en'`; absent on old resumes → behavior unchanged.
- `src/lib/resume.ts`: `RESUME_LANGUAGES` (code → native name),
  per-language section-label tables; `sectionLabel(r, key)` picks the table
  for `r.language`. Custom-section fallback label localized too.
- Worker: the six writer endpoints accept optional `language`; when valid and
  not `'en'`, the prompt gains one line: "Write your entire output in
  <Language>. Keep facts from the input unchanged." (allowlist-validated,
  never echoed back). Skill-suggest, interview, resignation, assistant stay
  English this round.
- `src/lib/api.ts` + Builder/Jobs call sites pass `resume.language`.
- UI: a compact "Language" select in the Builder Design & layout row (next to
  Letter/A4), title text explaining scope. No schema/scoring/quota changes.

## Verification plan

Local lint + typecheck + build green; deploy; on production (1440 + 375):
- set language to Spanish → preview headings become "Experiencia", etc.;
  TXT/MD/PDF/DOCX exports carry the localized headings (byte-check TXT,
  pdftotext the PDF); share page shows localized headings read-only.
- heading override still wins over the localized default; clearing it
  restores the localized default (R128 regression).
- real AI call with language=es returns Spanish text.
- default (English) resumes: zero visual diff; R166 share + R165 gating
  regressions pass.
