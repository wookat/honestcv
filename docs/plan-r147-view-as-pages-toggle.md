# R147 — "View as pages" toggle for the Builder live preview

## Rezi evidence (firsthand, 2026-08-31)

On the Finish Up & Preview page (`/dashboard/resume/<id>/finish-up`) the layout
toolbar has a **View as pages** switch (next to "Show promotion"):

- **On (default):** the resume renders as discrete page cards.
- **Off:** the resume renders as one continuous flow; where a page boundary
  would fall, Rezi injects a small inline **"Break"** marker instead of a hard
  page frame (observed in the DOM: `<div offscreen>Break</div>` appears after
  toggling off).

This is a viewer preference — it does not change the exported PDF.

## RezUp gap

`ResumePreview` in `src/components/ResumePreview.tsx` supports only two modes:
single clipped page (`paginated` unset) or a stack of page frames
(`PaginatedPages`). The Builder always renders the paged stack. There is no
continuous view: while editing a long resume, page frames chop content and add
vertical dead space between frames, which is noisy on 375 px screens.

## Plan

1. `ResumePreview` gains `view?: 'pages' | 'flow'` (default `'pages'`,
   only meaningful with `paginated`). `'flow'` renders a single frame at true
   page width (same 96dpi geometry and scale math as `PaginatedPages`) whose
   height follows the content, with a dashed **Page break** marker line
   positioned at every page-height boundary so users still see where the PDF
   will paginate.
2. Builder layout toolbar gains a **View** control (`Pages` / `Flow`) beside
   the existing Icons toggle. Preference persists in a new localStorage key
   `honestcv.previewView` (viewer preference, NOT resume schema — matches how
   Rezi keeps it out of the document). Default stays `Pages`.
3. Share page, dashboard and landing keep their current behavior.

## Non-goals

- No schema change, no dependency change, no export change.
- No "Show promotion" analog (that's Rezi's own branding footer).

## Verification

- Local `npm run lint` + `npm run build` green.
- Production 1440 px + 375 px: toggle both states with a multi-page resume,
  break markers align with paged boundaries, preference survives reload,
  inline preview editing / section jump still work in flow view, PDF export
  unchanged, no horizontal overflow at 375 px.
