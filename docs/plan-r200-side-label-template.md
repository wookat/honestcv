# R200 — Sidebar template: section labels in a left gutter (Rezi "Dev" counterpart)

## Evidence (public, first-party)

Rezi changelog "Updates April 2026" (https://www.rezi.ai/rezi-changelog, fetched 2026-08-31):

> **Dev Resume Template** — Two-column layout with section labels on the left. Fits more
> content on one page. Best for experienced professionals with 3+ roles.

R198 covered the sibling "Dev Compact" entry (full-width + horizontal dividers → Circuit/Ledger).
The side-label layout dimension is the remaining template-family gap: all 24 RezUp templates
stack headings above content.

Consistency check with our own ATS guidance (/guides/two-column-resume-ats/): the guide's
"safe hybrid" section allows label-gutter layouts when the machine reading order stays
heading → content. This implementation keeps exactly that order in every output.

## Design

New `TemplateMeta.sideLabels?: boolean` + one template:

```ts
{ id: 'sidebar', name: 'Sidebar', description: 'Section labels in a left gutter — scannable
  two-column look with single-column reading order', tags: ['Developers','Experienced','Scannable'],
  accent: '#1e3a8a', headingCase: 'upper', serif: false, divider: 'none', headerAlign: 'left',
  nameCase: 'normal', sideLabels: true }
```

Per surface:

- **Preview** (`ResumePreview.tsx`): the per-section wrapper div gets
  `position:relative; paddingLeft:<gutter>` and `heading()` renders the h3
  `position:absolute; left:0; top:0; width:<label width>` so the label sits beside the first
  content line. DOM order stays heading-then-content (inline heading rename still works).
- **PDF** (`pdf.ts`): writer gains `x0` (left content edge, default `MARGIN`). For sideLabels,
  `x0 = MARGIN + 96` and `contentW` shrinks accordingly; `heading()` draws the (wrapped) label
  in the gutter at the same baseline as the upcoming content line without consuming vertical
  space. All content x-positions switch from `MARGIN` to `this.x0`. Text stream order remains
  heading → content (label drawn first), so extraction order is unchanged.
- **DOCX** (`docx.ts`): unchanged — renders standard stacked headings. A real DOCX gutter needs
  layout tables, which our own uploaded-file ATS check (R189) rightly flags; degrading to
  stacked headings is the honest ATS-safe choice.
- **TXT/MD/ATS/scoring**: unchanged (template-independent), byte-identical across templates.
- **Thumbnail** (`TemplateThumb.tsx`): labels drawn in a narrow left column, content right.
- **pSEO** (`build-seo.mjs`): static metadata + thumbnail + /templates/sidebar page; template
  count 24 → 25.

## Acceptance

- Sidebar preview at desktop + 375px: labels in gutter, content indented, no overflow.
- Sidebar PDF: labels at x≈54, content at x≈150, correct page breaks, `pdftotext` order is
  heading before section content; other templates byte-comparable to pre-R200 output.
- TXT/MD sha256 identical across sidebar/classic; ATS score unchanged when switching templates.
- Template gallery shows 25 templates; /templates/sidebar page live.
- No schema change; legacy resumes unaffected.
