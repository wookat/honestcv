# R198 — Entry-divider templates (Rezi "Dev Compact" style)

## First-party evidence

Rezi public changelog, Updates April 2026 (https://www.rezi.ai/rezi-changelog, fetched 2026-08-31):

> "Dev Compact Resume Template — Single-column layout with horizontal dividers. Full-width content
> area for maximum page usage. Best for developers with detailed project descriptions."

Rezi ships a template whose defining feature is horizontal hairline dividers *between entries*
(not just under section headings). RezUp's 22 templates only vary heading dividers/bands; no
template can visually separate dense entries, which is exactly what long dev resumes need.

## Gap

- `TemplateMeta` has `divider` (under headings) and `band`, but nothing between entries.
- A dense resume (4+ roles, multiple projects) reads as a wall of text in every template.

## Design

Zero schema changes to `Resume`; purely a template capability, template-driven like `band`.

1. `TemplateMeta.entryDivider?: boolean` — when set, a light neutral hairline (not accent —
   entries are separators, headings carry the accent) is drawn above every entry after the first
   within each multi-entry section (experience incl. grouped companies, projects, involvement,
   education, coursework, certifications, awards, publications, references, military, agents).
2. Renderers:
   - Preview (`ResumePreview.tsx`): `entrySep(i)` → `borderTop: 1px solid #e4e4e4` + small padding.
   - PDF (`pdf.ts`): `PdfWriter.entryRule()` draws a 0.5pt `#d4d4d4` full-width line; called
     between entries in every section loop.
   - DOCX (`docx.ts`): paragraph `border.top` (single, light gray) on the entry's first paragraph.
   - TXT/MD/ATS/scoring: unchanged (purely visual; text content identical).
3. Two new templates using it (total 24):
   - **Circuit** — sans, uppercase headings, thin heading rule, left header, entry dividers.
     The "Dev Compact" analog: full-width, dense-content friendly.
   - **Ledger** — serif, title-case headings, no heading rule (entry dividers carry the
     structure), left header. Editorial variant.
4. Gallery filter: `Ruled entries` chip in `TEMPLATE_FILTERS`; `TemplateThumb` draws the
   hairline between sample jobs so pickers show the difference.

ATS-safe: dividers are vector lines/borders, no tables, no images, single column preserved.

## Acceptance

- Circuit/Ledger show hairlines between entries in preview, PDF and DOCX; all 22 existing
  templates render byte-identically (flag unset).
- Divider never renders above the first entry of a section; grouped-company experience gets a
  divider between companies and between roles inside a group.
- TXT/MD exports and ATS/keyword scores unchanged on template switch.
- Thumbnails and the `Ruled entries` filter surface the new templates; dark mode + 375px fine.
