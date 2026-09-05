# R418 — Builder header overflows the viewport at 2xl (1536–1640px)

## Production evidence (CDP, cv.zalize.com/builder, fresh nav per width)

| viewport | scrollWidth | horizontal scroll |
| --- | --- | --- |
| 1280 | 1280 | none |
| 1520 | 1520 | none |
| 1536 | **1587** | **51px** |
| 1600 | **1619** | **19px** |
| 1620 | **1629** | **9px** |
| 1640 | 1640 | none |

At the Tailwind `2xl` breakpoint (>=1536px) the Builder toolbar swaps its compact
download dropdown for the expanded PDF / DOCX / TXT / MD / Print buttons. The
header row (`SiteHeader` container, `max-w-6xl` = 1152px) then measures:
logo 124 + nav 453 + action cluster 810 = ~1419px of content in a 1152px
container. The action cluster overflows the container to the right; on
viewports 1536–1640 it also overflows the *viewport*, producing a page-level
horizontal scrollbar and clipping the Print button.

1536px is the effective width of a 1920px display at Windows 125% scaling —
one of the most common desktop resolutions — so this band is heavily used.

## Fix (Layout.tsx only)

`SiteHeader` already takes `wideAction` (Builder passes it) to manage exactly
this pressure at smaller widths. Extend it to the container width: when
`wideAction` is set, the header container becomes `max-w-[1600px]` instead of
`max-w-6xl`. At 1536 the content box is then 1504px >= 1419px needed, so the
expanded cluster fits from the same 2xl breakpoint that reveals it. Other
pages keep `max-w-6xl` byte-identical.

## Validation

- `npx tsc -b`, `npx eslint src/components/Layout.tsx`, `npm run build`.
- Production QA: /builder at 1520/1536/1600/1640/1920 — no horizontal
  scroll, Print button fully visible; non-builder pages unchanged at 1536;
  375 light/dark regression; R417 jobs alert regression.
