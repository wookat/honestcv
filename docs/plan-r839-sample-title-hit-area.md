# R839 — `/samples` card title button keeps its 40 px hit area at every width (2026-09-10)

Follow-up to R838's route audit (`r838-audit-768.log`): the one real axe `target-size` violation
at 768 px was the sample card's title button (`Dashboard.tsx`, R655's
`-my-2.5 … py-2.5 … sm:my-0 sm:py-0`), reported as `198.5px by 20px, should be at least 24px by 24px`.

## Evidence (first-hand, production R838 bundle `c8d71cb7`)

Scripts: `/home/ubuntu/qa/r839-evidence.cjs` → `r839-evidence.json` (intrinsic geometry per
width + isolated axe on the visible grid), `/home/ubuntu/qa/r839-repro.cjs` (the audit's
scroll-in-400-px-steps procedure at 768 × 812), `/home/ubuntu/qa/r839-simulate.cjs` →
`r839-simulate.json` (production DOM surgery: drop the two `sm:` reset classes, re-measure,
re-run the scrolled axe repro).

### Intrinsic geometry (unchanged since R655)

| viewport | grid cols | card w | title button w × h | isolated axe `target-size` |
|---|---|---|---|---|
| 375 | 1 | 328 | 302 × **40** | pass |
| 640 | 2 | 288.5 | 262.5 × **20** | pass |
| 768 | 2 | 224.5 | 198.5 × **20** | pass |
| 1023 | 2 | 352 | 326 × **20** | pass |
| 1024 | 3 | 229.7 | 203.7 × **20** | pass |
| 1280 | 3 | 277.3 | 251.3 × **20** | pass |

The isolated run passes at 640–1280 because axe applies the WCAG 2.5.8 *spacing* exception: the
nearest other target (Star badge above, "Use this example" 14 px below the 20 px line + the
sector line) is outside a 24 px circle. The audit's failure only reproduces with the audit's own
procedure — `r839-repro.cjs` at 768 × 812, `scrollY = 800`: the sticky header (`y 0…57`) covers
the card whose title sits at `y = −2`; the header's nav links are then within the 24 px circle,
the spacing exception no longer applies, and axe reports the bare 20 px line. So:

- **WCAG 2.5.8 compliance**: the button already passes at every width by the spacing exception
  *and* by the equivalent-control exception — the card's thumbnail is a second `<button>`
  (`Preview {role} sample`, ≥ 200 × 280 px) that calls the same `setPreviewExample(e)`.
- **Product standard**: every other control the product treats as touch-facing is 40 px on touch
  widths, and a 20 px-tall text line is a poor tap target on 768–1023 px tablets (iPad portrait /
  landscape are 768 / 820 / 834 / 1024 CSS px), where the `sm:` reset in R655 was aimed at
  "desktop" but also removes the hit area from tablets. Reported honestly: this is a tablet
  ergonomics + audit-hygiene item, not a compliance defect.

### Candidate designs (simulated on production before touching source)

| # | design | 640–1023 | ≥ 1024 | geometry | verdict |
|---|---|---|---|---|---|
| A | keep R655 (`sm:` reset) | 20 px | 20 px | — | audit keeps flagging; tablets keep a 20 px line |
| B | move the reset to `lg:` | 40 px | 20 px | zero change (negative margin cancels padding) | fixes 640–1023 only; 1024–1279 iPad landscape stays 20 px; breakpoint debate for one button |
| C | **drop the reset — `-my-2.5 py-2.5` at every width** | 40 px | 40 px | zero change | **chosen** — simplest class, one rule, no breakpoint to argue |
| D | `min-h-6` only | 24 px | 24 px | card grows 4 px at ≥ sm | passes axe by 0 px margin, changes layout, below product 40 px |
| E | make the thumbnail the only control (remove the title button) | — | — | removes a tab stop | changes keyboard/mouse semantics; separate a11y design item (see below) |

`r839-simulate.cjs` result for **C** (9 cards patched per width): at 375 / 640 / 768 / 1023 /
1024 / 1280 the title text rect, sector rect, card rect, thumbnail rect, Star rect and
"Use this example" rect are **byte-identical before and after**; all 9 card heights, document
height and `scrollWidth` unchanged (`scrollWidth ≤ innerWidth`); the button becomes 40 px tall
at every width with 2 px clearance to the thumbnail button above and 14 px to "Use this example"
below (the padding overlaps only the non-interactive sector line). Scrolled axe repro at
768 × 812 after the patch: the previous "insufficient size (198.5px by 20px)" finding is gone;
the remaining findings at `scrollY 800 / 1600 / 2000` are all *"partially obscured"* — the
40 px button under the sticky header at that scroll step — which the audit classifier already
files as a harness position artefact (`obscured-only`), i.e. **0 real violations**.

## Change

`src/pages/Dashboard.tsx` — one class string on the sample card title button:

```diff
- className="-my-2.5 block w-full cursor-pointer truncate py-2.5 text-left text-sm font-medium hover:underline sm:my-0 sm:py-0"
+ className="relative -my-2.5 block w-full cursor-pointer truncate py-2.5 text-left text-sm font-medium hover:underline"
```

**`relative` — found by the independent QA of the first deploy (`0202ff71`) and confirmed
first-hand (`/home/ubuntu/qa/r839-zfix.cjs`)**: the negative bottom margin pulls the following
sector `<p>` up over the button's lower 10 px, and because the paragraph comes later in DOM order
it paints on top and takes the pointer — `document.elementFromPoint` at `dy 30 / 38` returned
`P "Tech & data"` and a trusted click there opened nothing. This was **pre-existing since R655 at
375 px** (the 40 px hit area there was really 30 px) and the first R839 deploy extended the same
gap to every width. A positioned element paints above in-flow siblings, so `relative` makes the
whole 40 px band the button's at 375 / 768 / 1280 (`dy 2 / 20 / 30 / 38 → BTN` on the deployed
`9df12a0d` bundle). Consequence, intended: tapping the sector text also opens the preview.

The negative vertical margins cancel the padding in normal flow, so title text, sector line, card
height, Star badge and "Use this example" stay where they are; only the hit area (and the
focus-visible box) grows to 40 px above `sm`, as it already did below `sm` since R655.
Accessible name (`{e.role}`), `onClick`, focus return after the preview dialog closes,
thumbnail / Star / "Use this example" untouched; CSS bundle unchanged (both utilities already
exist).

Tests: `tests/touch-targets.test.ts` + 3 (`R839` block, 374 → 377) — the title button carries
`py-2.5` with `-my-2.5`, declares no `sm|md|lg|xl:(my-0|py-0)` reset, and is `relative`. 2 / 3 fail
on the R838 tree.

## Not done this round (recorded)

- **Duplicate preview control**: the thumbnail button (`Preview {role} sample`) and the title
  button (`{role}`) are two consecutive tab stops for the same action; the title's accessible
  name does not say it previews. Deciding whether the title should become the single named
  control (thumbnail decorative) or be demoted to a heading is an a11y design change with
  keyboard-order and screen-reader consequences — queued, not slipped into a hit-area round.
- **Certification description newlines** (R838 QA): the preview `<p>`, PDF `wrapText` (splits on
  `\s+`) and DOCX single paragraph collapse `\n`, while TXT / MD keep the lines. First-hand check
  this round: the *summary* follows exactly the same convention (prose field, `bodyText` /
  `body(resume.summary.trim())`), so this is the product's prose-field rule rather than a
  certification-only bug; changing it means deciding the rule for both fields (honour `\n` as
  line breaks everywhere vs. collapse in the editor as R837 did for Education details). Queued
  as a semantics decision.
- Scores probe (`/home/ubuntu/qa/r839-scores.json`, 116 retained resumes): `resumeStrength` vs
  `resumeHealth` verdict labels disagree on 4 / 116 (all within 10–31 points of each other, e.g.
  `word-cu` 85 Strong vs 54 Getting there). Not a UI defect on its own — the two numbers are
  labelled differently — recorded for a later consistency round.

## Gates / deploy

- vitest 377 / 28 files; `tsc -p tsconfig.app.json` ok; `tsc -p tsconfig.base.json` → TS5058 (file does not exist in this repo; `tsc -b --noEmit` ok is the replacement); eslint 0 errors / 11 pre-existing warnings; `npm run build`; `verify-dist` OK 123 sitemap URLs.
- Deployed from the new Cloudflare account (`CLOUDFLARE_NEW_*` credentials, old token / account id unset): first `0202ff71` (`index-BvHW3eak.js` / `Dashboard-DyiLzUmM.js`), then after the QA finding `9df12a0d` — production `index-ClIzkZc0.js` / `Dashboard-ufumHYh8.js` / `style-BGQuqabg.css` SHA-identical to `dist/client/assets`.
- Native re-measure on the deployed bundle (`r839-evidence.cjs`, no DOM surgery): title button 40 px tall at 375 / 640 / 768 / 1023 / 1024 / 1280 (302 / 262.5 / 198.5 / 326 / 203.7 / 251.3 wide); card, sector, Star, "Use this example" rects identical to the pre-change evidence; isolated axe `target-size` 0 violations at every width; scrolled 768 × 812 repro leaves only "partially obscured" findings (sticky header), console 0.

## Independent production QA

Testing agent, `/home/ubuntu/qa/r839-v2-qa/`, eight real Chrome contexts at 375 / 640 / 768 /
1023 / 1024 / 1280, cache disabled, storage restored byte for byte. First pass (`0202ff71`) found
the sector-`<p>` interception described above; second pass (`9df12a0d`): 54 / 54 title buttons
40 px tall, all neighbouring rects unchanged, clicks at dy 2 / 20 / 30 / 38 open the preview and
Escape returns focus to the title at 375 / 768 / 1280, Tab order / Star / Use this example / hover
underline / no overflow / axe `target-size` 0 at natural scroll at every width; the 768 scroll
sweep keeps only sticky-header ("partially obscured", "safe clickable space 16 / 6 px") findings.
0 AI / checkout / non-GET requests, 0 errors. Details in `docs/handoff-context.md` (R839).
