# R399 — dashboard folder groups get semantic headings

## Evidence (first-party)

Banked hypothesis from the R398 SOP-10 audit, now verified in source
(`src/pages/Dashboard.tsx`, folder group render around line 1160):

- Each folder group is a `<section>` whose visible title is only a styled
  `<button aria-expanded>` (`text-sm font-semibold`) — there is **no heading
  element** for the group.
- Page heading structure around it: `h1 My resumes` (line 870), sibling
  sections `h2 Career documents` (1221) and `h2 Sample library` (1424).
- Consequence: screen-reader users navigating by headings (the most common
  SR navigation mode) cannot discover or jump between folder groups; the
  folder name is announced only as a button. WCAG 1.3.1 / 2.4.6-adjacent.

## Fix (minimal)

Wrap the existing toggle button in an `<h2>` — the standard accessible
accordion/disclosure pattern (heading wraps the control; `aria-expanded`
stays on the button). Tailwind preflight zeroes heading margins/font-size,
so the wrapper is visually inert; all styling stays on the button.

```diff
- <button type="button" aria-expanded={!isCollapsed} ...>
+ <h2 className="contents">
+   <button type="button" aria-expanded={!isCollapsed} ...>
      ...
- </button>
+   </button>
+ </h2>
```

(`contents` keeps the button a direct flex item of the row so layout is
byte-identical.)

Heading level: `h2` — folder groups are siblings of the other top-level
dashboard sections under `h1 My resumes`.

## Non-goals

- No visual/style change, no behavior change to collapse/rename/remove.
- No heading changes elsewhere on the dashboard.

## Verification

- Local: `npx tsc -b`, `npx eslint src/pages/Dashboard.tsx`, `npm run build`.
- Production QA: folder group heading exposed as `heading level 2` in the
  accessibility tree with the button inside (aria-expanded intact); layout
  pixel-unchanged in grid+list, 375px light/dark; collapse/rename/remove
  regressions; zero console errors.
