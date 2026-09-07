# R663 — Landing showcase mock cards: 12px status text at 3.2–3.65:1 on white

## Why this round

R662 excluded `aria-hidden` subtrees from the light-theme computed scan and listed the Landing
showcase mocks as a candidate. This round re-ran the scan with `aria-hidden` included
(`qa/r663-scan.cjs`, `INCLUDE_HIDDEN=1 THEME=light`, seven routes, 1280) to see exactly what is
there before deciding whether "decorative" is a fair label.

## Evidence (production, bundle `index-K2E7xJLD.js`, light, 1280, 2026-09-06)

All hits inside `aria-hidden` containers, seven routes:

| Route           | Text                                                                 | Class              | fg on bg                          | Ratio    |
| --------------- | -------------------------------------------------------------------- | ------------------ | --------------------------------- | -------- |
| `/`             | "Detected" ×2, "3 positions detected" (ATS mock, `Landing.tsx` ≈557) | `text-emerald-600` | rgb(0,153,102) on white           | **3.65** |
| `/`             | "72" (Score breakdown mock, `ShowcaseBreakdown` ≈287)                | `text-amber-600`   | rgb(225,113,0) on white           | **3.2**  |
| `/`             | "83" (same)                                                          | `text-emerald-600` | rgb(0,153,102) on white           | **3.65** |
| `/`, `/builder` | keyword-chip `✓`                                                     | `text-green-600`   | rgb(0,166,62) on rgb(240,253,244) | 3.08     |

Everything else on the seven routes is ≥4.5:1 (or ≥3:1 large text) in light; dark was zero in
R661/R662.

### Judgement

- The showcase mocks (`<div aria-hidden><s.visual /></div>`, `Landing.tsx` ≈633; the ATS mock
  at ≈542) are hidden from assistive tech, but they are the product illustration a sighted
  visitor is meant to _read_: "Skills — Parsed as body text", "Missing keyword: kubernetes",
  the 72/83/40 dimension scores. That is informational content, not "pure decoration" in the
  WCAG 1.4.3 sense, and it is 12px body text on white. Treated as a real gap.
- The keyword-chip `✓` is a glyph duplicating the chip label that sits right next to it, is
  `aria-hidden`, and the pill background is tinted (3.08 vs 4.45 for the next ramp step). It
  conveys nothing the label does not; left as decoration (unchanged since R661 measured it).

- Also measured while verifying (not a defect): `ScoreRing` number (`text-xl font-bold`, 20px/700 =
  large text, 3:1 applies): emerald `oklch(0.596 …)` 3.65:1, `#d97706` ≈3.18:1, `#dc2626`
  ≈4.83:1 on white; on the dark card 9.55 / ≈5.6 / ≈3.7. All ≥3:1; unchanged.

## Fix (tokens only, `Landing.tsx`)

```diff
- <span className={score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-600'}>
+ <span className={score >= 80 ? 'text-emerald-700' : score >= 50 ? 'text-amber-700' : 'text-red-600'}>
…
- <span className={ok ? 'text-emerald-600' : 'text-red-600'}>{status}</span>
+ <span className={ok ? 'text-emerald-700' : 'text-red-600'}>{status}</span>
```

- `text-emerald-700` → rgb(0,122,85) on white **5.3:1** (R661/R662 measured token); dark
  remaps to `oklch(0.82 0.12 162)`.
- `text-amber-700` = `oklch(0.473 0.137 46.201)` ≈ rgb(187,77,0) on white **≈5.0:1**; dark
  already remaps `--color-amber-700` to `oklch(0.85 0.13 86)`.
- `text-red-600` already 4.77:1 (R662), unchanged.

No layout, copy or `dark:` changes.

## Verification

- Production light + dark at 1280 and 375: the five mock texts' computed ratios; the rest of
  the seven-route computed scan with `INCLUDE_HIDDEN=1` reports only the chip `✓` glyphs.
- Scrolling axe unchanged (0 real), no overflow, 0 console errors, storage restored.
- `npx tsc -b`, `npx eslint src/pages/Landing.tsx`, `git diff --check`, `npm run build`,
  `node scripts/verify-dist.mjs`.

## Limitations

- "Decorative vs informational" for the mock text is a judgement call documented above, not a
  measurement; the chip `✓` judgement goes the other way for the reasons given.
- No real screen-reader listening (the mocks are `aria-hidden`, so AT behaviour is unchanged
  either way).
