# R427 — Builder bottom status bars stack instead of overlapping

## Production evidence (CDP @1280, https://cv.zalize.com)

- /builder?template=bogus-t&example=bogus-e: both R426's template bar and
  R425's example bar rendered at the exact same fixed position
  (rects top=687 bottom=745 for both) — the later bar paints on top of the
  earlier one, hiding its message and controls. Six Builder status bars share
  the identical `fixed inset-x-4 bottom-16 z-50` slot (storage-full alert,
  example fetch-failure, template not-found, example not-found, cross-tab
  update, download share promo), so ANY two concurrent bars collide — e.g.
  storage-full + not-found, download promo + cross-tab update.

## Scope

- Builder.tsx only: one fixed `pointer-events-none` flex-col stack container
  (`fixed inset-x-4 bottom-16 z-50 flex flex-col items-center gap-2
  lg:bottom-4`) hosts all six bars; each bar drops its own
  fixed/inset/bottom/z/mx-auto classes and gains `pointer-events-auto`
  (content, roles, copy, buttons, handlers byte-identical). The shareOpen
  promo block moves into the container (JSX relocation only).

## Validation

- Local: tsc, eslint, build.
- Production QA: bogus template+example → two readable stacked bars, each
  dismissible independently; single-bar cases pixel-equivalent position;
  clicks pass through empty container area; 375 light/dark no overflow;
  R425/R426 regressions; zero console errors; baseline byte restore.
