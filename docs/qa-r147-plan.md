# R147 QA plan — Builder preview "View as pages / Flow" toggle

Code evidence (diff c451a1d..31a78dc): `ResumePreview` gains `view?: 'pages'|'flow'` (default pages; only Builder passes it, Builder.tsx ~5768). `FlowPage` (ResumePreview.tsx ~473): single white sheet, `aria-label="Resume preview (continuous)"`, width baseW (816 letter / 794 a4), content measured via ResizeObserver, `breaks = ceil((contentH-1)/windowH)-1` with `windowH = baseH − 2·PAGE_PAD`; dashed `border-dashed` divs at `top = PAGE_PAD + (i+1)·windowH` each with a "Page break" span. Builder toolbar (Builder.tsx ~5544): "View" label + Pages/Flow buttons right of the Icons control, `aria-pressed`, ring when active, persists `localStorage['honestcv.previewView']` (not in resume schema → not undoable, survives baseline-resume changes). Share/dashboard/exports never pass `view`.

Bundles: hard refresh, assert exactly index-B4eHXVgM.js + Builder-BJCTlHyr.js.

Prep (unrecorded): backup localStorage baseline; load example resume, then inflate to ≥3 pages (duplicate experience entries / long bullets via storage seeding) so Pages shows "Page x of 3" and Flow should show exactly 2 break markers.

## T1 Default Pages unchanged
Fresh state (no honestcv.previewView key). PASS: preview shows separate page frames with "Page 1 of 3"-style corner badges; Pages button has aria-pressed=true + ring; `localStorage['honestcv.previewView']` absent.

## T2 Switch to Flow
Click "Flow". PASS: preview becomes ONE container `[aria-label="Resume preview (continuous)"]` (page-frame stack + "Page x of y" badges gone); all content present (last section text e.g. Skills visible at bottom — screenshot); marker count = pagesCount−1 (expect 2); DOM marker offsetTop values = PAGE_PAD+(i+1)·windowH (±1px); dashed line + "Page break" label visible in screenshot; `honestcv.previewView === 'flow'`.

## T3 Flow interactivity
In Flow: (a) click a summary/contact text in preview → InlineText contentEditable opens, type a marker, Enter → commits to resume storage and form input; (b) click blank area of a section wrapper (title="Edit …") → editor scrolls/jumps to that card. PASS: both behave as in Pages mode.

## T4 Layout controls re-flow live
In Flow, click Text size "A+" (or spacing +) once or twice. PASS: content height grows and marker positions/count update immediately (record markers' offsetTop before/after — must differ; if a new page boundary is crossed, marker count increments). Revert control after.

## T5 Persistence
F5 while Flow → still Flow (aria-pressed, continuous container). Click Pages, F5 → still Pages ("Page x of y" badges, `honestcv.previewView==='pages'`).

## T6 375px
Emulate 375+reload. PASS: View buttons visible & tappable (tap Flow → continuous view renders, scaled to container width); `scrollWidth ≤ 375`; screenshot.

## T7 Regressions
- PDF export page count unaffected by view: with Flow active, print/PDF path — assert via the existing "PDF export: N page(s)" indicator showing the same N in both views (avoid actual download if indicator suffices; else download PDF once and check pages = 3).
- Share page stays paginated read-only: NOT tested via creating a share link (forbidden) — assert instead that only Builder passes `view` (code) and mark runtime share check untested.
- R145/R146 sort-by-date quick check: toggle Experience sort on → sorts immediately, aria-pressed; date edit inside card held until blur (single quick assertion).

Cleanup: kill holder, clear emulation (verify innerWidth 1600), remove honestcv.previewView + resume keys, restore localStorage to exactly ["honestcv.clientId","honestcv.qa"]. No share links / AI / payments / deletion.
