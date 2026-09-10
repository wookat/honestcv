# R838 — benchmark refresh + entry description boxes take the full card width (2026-09-10)

## Part 1 — function benchmark refresh (5 rounds since R833, production R837 bundle `f1e07ce3`)

Scripts: `/home/ubuntu/qa/r838-rezi.mjs` → `r838-rezi.json` (compared with `r833-rezi.json`),
`/home/ubuntu/qa/r838-prod-functional.mjs` → `r838-prod-functional.json` (temporary client id,
`x-qa: 1`), `/home/ubuntu/qa/r838-audit.cjs` → `r838-audit-{1024,768,375}.log` (8 routes, axe
after scrolling, unnamed tabbables, page overflow, console).

- **Rezi public pages**: 7 / 8 URLs 200 (`/resume-checker`, `/job-search`,
  `/ai-cover-letter-builder`, `/ai-interview` still redirect to `/tools/…`), `/resume-keyword-scanner`
  still 404; titles and H1–H3 sets byte-identical to R833. No new public capability to compare
  against.
- **Production non-AI paths, first-hand**: `/api/health` 200 `ok:true llmConfigured:true`;
  quota 12; share create → read (bytes equal, `Cache-Control: no-store`) → `/s/:id` shell
  (title + og:title `Jordan Reyes — Software Engineer | RezUp`) → wrong-token delete 403 → delete
  200 → read 404; billing `freeMode:true checkoutEnabled:false`, checkout 503 "Checkout is not
  available yet.", license claim / activate 503 "License signing is not configured.", license
  status 200 `plan:null`; jobs search 200, 31 rows from `remotive+jobicy+arbeitnow`.
- **The one authorised AI call** (summary draft) answered the truthful
  `{"error":"The AI service can't be reached right now (530)…","status":502,"aiUnavailable":{…,"status":530}}`
  and the quota stayed at 12 — relay `code-plan.site` is still NXDOMAIN / `serverHold`.
  `llmUnreachableSince:null` in health *before* that call was only the expired 15-minute
  `llm:down` marker, not a recovery; after the call it reads `1789006469128`. **Out-of-repo P0
  unchanged**: needs a new relay base URL + key (boss). Licensing secrets
  (`LICENSE_SIGNING_SECRET`, `LEMONSQUEEZY_WEBHOOK_SECRET`, `LS_VARIANT_*_ID`) still unset —
  checkout / claim fail truthfully by design.
- **Route audit** (8 routes × 1024 / 768 / 375): page `scrollWidth` ≤ viewport everywhere
  (1009 / 753 / 360), 0 unnamed tabbables, 0 console errors, axe real violations **0 at 1024
  and 375** (only "obscured" findings — controls under the sticky header / pane switcher at the
  scroll position, all previously classified as harness position artefacts). **1 real at 768**:
  `/samples` card title button (`Dashboard.tsx` `-my-2.5 … py-2.5 … sm:my-0 sm:py-0`) is
  198.5 × 20 px — R655 only gave it the 40 px hit area below `sm`; at 640–1023 it is a 20 px
  tall text button (WCAG 2.5.8 needs 24). Queued as the R839 candidate (P1, tablet).

### Refreshed P0 / P1 list

| # | item | class | evidence | status |
|---|---|---|---|---|
| P0 | AI relay unreachable (`code-plan.site` serverHold) | outside repo | `aiUnavailable status 530`, quota unspent | boss: new relay URL + key |
| P1 | Structured-entry description textareas 161 px usable at 1024 (Military 207), 289 at 1280 | Builder geometry | this round, below | **fixed this round** |
| P1 | `/samples` title button 20 px tall at 640–1023 | touch target | `r838-audit-768.log` | R839 |
| P1 | Certification description: editor accepts newlines, preview / PDF / DOCX render one paragraph | semantics | QA this round (pre-existing since R67) | queued |
| P2 | Custom-section "Entries" caption, LinkedIn non-English export, Builder lazy-load, picker shift under zoom | — | earlier rounds | queued |

## Part 2 — Evidence for the fix (first-hand, production R837 bundle, `/home/ubuntu/qa/r838-evidence.cjs`)

Seed: R815 all-sections fixture. Corpus: the retained 186-resume import replay
(`/home/ubuntu/qa/r776-text-replay.json`) yields **116 distinct experience bullets** (≥ 20
chars) — the closest real sample of what users type into a "one bullet per line" box (the
replay's Involvement / Coursework / Awards / Publications / Military arrays are empty, which is
a corpus gap, not proof that production lacks such values). Measured with the control's own
font (`14px Inter`, canvas): p50 102 chars / **678 px**, p90 1 052 px.

| width | box | usable (clientWidth − padding) | corpus bullets wrapped lines p50 / p90 | bullets over the 2 visible rows | Military placeholder ("Duties, awards, achievements — one bullet per line", 58 ch) |
|---|---|---|---|---|---|
| 1024 | inv / cw / award / pub / cert / agent (`ENTRY_TEXT_ROW`, 5-button toolbar) | **161** (146 once a native scrollbar appears) | 5 / 8 | **112 / 116** | — |
| 1024 | mil (4-button toolbar) | 207 | 4 / 6 | 100 / 116 | 3 lines → scrolls inside a 2-row box |
| 1024 | edu details (R837 `ENTRY_TEXT_STACK`) | 391 | 2 / 3 | 32 / 116 | — |
| 1280 | ordinary shared row / mil | 289 / 335 | 3 / 4 | 85 / 116 | 2 lines |
| 1280 | edu details | 519 | 2 / 3 | 13 / 116 | — |
| 375 | all (row already wraps below `sm`, R798) | 242 (257 overlay scrollbar) | 3 / 5 | — | — |

So at the 1024 side-by-side layout a median real bullet needs 5 lines inside a box that shows
2, and even at 1280 three quarters of the corpus overflows the visible rows; the Military
placeholder itself does not fit its box at 1024. Stored value, preview, ATS, exports were
never affected — editor-only, exactly R837's shape.

## Design (measured on the production DOM before any source change — `/home/ubuntu/qa/r838-simulate.cjs`)

| candidate | usable 1024 / 1280 / 375 | bullets over 2 rows @1024 / @1280 | row height 1024 / 1280 | desktop card cost |
|---|---|---|---|---|
| A. keep the shared row | 161 (mil 207) / 289 (335) / 242 | 112 / 85 of 116 | 64 / 64 | 0 |
| B. R826-style container query: stack only while the entry grid is < 32 rem (`MODE=cq`) | 391 / 289 / 242 | 32 / 85 | 108 / 64 | +44 px at 1024 only |
| **C. `ENTRY_TEXT_STACK` at every width (chosen)** | **391 / 519 / 242** | **32 / 13** | 108 / 108 | +44 px at 1024 and 1280 |

Chosen: **C**. It is the pattern the product already uses for the two prose boxes users type
most into — Experience bullets (full width since the start) and Education details (R837) — and
B leaves 1280 at 289 px, where p50 is still 3 lines and 85 / 116 bullets overflow the visible
rows; the 44 px it costs per card at 1280 is one toolbar line, the same trade R837 made.
Simulation @1024: ordinary 161 → 391, Military 207 → 391, p50 5 → 2 lines, p90 8 → 3, over-2-rows
112 → 32; toolbar 8 px beneath, right-aligned; page `scrollWidth` unchanged 1009 / 1265 / 360;
375 byte-identical (already stacked).

Rejected: A (no fix); B (1280 still clips the median bullet, and a per-width difference in
where the toolbar sits is a second layout to learn); auto-growing textarea (Chromium-only
`field-sizing`, R837 already rejected); the Project description row is **left in
`ENTRY_TEXT_ROW`** — it shares its row with a single button, so its usable width is already
the card minus 46 px and the row has different geometry.

## Fix (`src/pages/Builder.tsx`)

Seven wrappers `<div className={ENTRY_TEXT_ROW}>` → `<div className={ENTRY_TEXT_STACK}>` around
`inv-<id>-description`, `cw-<id>-description`, `award-<id>-description`, `pub-<id>-description`,
`mil-<id>-description`, `cert-<id>-description` and the agent textarea
(`aria-label="How building the agent was relevant"`). Nothing else: ids, captions,
placeholders, `rows={2}`, `setResume` paths, toolbar buttons and order, preview, exports, ATS,
Undo untouched; CSS bundle unchanged (`style-CSnCqmMX.css`, every class already existed).

## Tests (365 → 374)

`tests/entry-description-stack.test.ts` (new): each of the seven textareas is `rows={2}` inside
`ENTRY_TEXT_STACK`; the stack keeps `basis-full` + `ml-auto` and no `sm:` variant; exactly one
`ENTRY_TEXT_ROW` use remains and it is the single-button Project description row.
`tests/entry-visible-labels.test.ts`: the two "caption sits above the description row" checks
(Involvement / Military, one-line cards) now look for the stack row — same label-order
assertions. On the R837 tree 8 of the 9 new tests fail.

Gates: vitest 374 / 28 files; `tsc -p tsconfig.app.json`, `tsc -b`; eslint 0 errors / 11
pre-existing warnings; build; verify-dist 123.

## Deploy + native re-measure (deployed bundle, no DOM surgery)

New account version `c8d71cb7-45f1-4bd6-9296-a260413dee1f`; production `index-ZTTf7_s7.js`
`bf87f444…` / `Builder-DIFQiYsr.js` `69d7c2e1…` / `style-CSnCqmMX.css` `b010f700…`
SHA-identical to `dist/client/assets`; `/api/health` 200.

| width | inv / cw / award / pub / cert / agent usable | mil usable | corpus p50 / p90 lines | over 2 rows | row h | page |
|---|---|---|---|---|---|---|
| 1024 | 161 → **391** | 207 → **391** | 2 / 3 | 32 / 116 | 108 | 1009 / 1009 |
| 1280 | 289 → **519** | 335 → **519** | 2 / 3 | 13 / 116 | 108 | 1265 / 1265 |
| 375 | 242 (unchanged) | 242 | 3 / 5 | — | 112 | 360 / 360 |

Re-running the simulation against the deployed bundle is a no-op at every width (baseline =
stack), i.e. the deployed geometry equals the design. Military placeholder now 2 lines at 1024
(was 3), 1 line at 1280.

## Independent production QA (testing agent, `/home/ubuntu/qa/r838-qa/`)

Independent real Chrome 1024×768 / 1280×800 / 375×667 (overlay scrollbars), cache disabled,
storage restored byte for byte (diff 0), recordings `r838-qa/r838-{1024,1280,375}-readable.mp4`,
`/home/ubuntu/screencasts/r838-*/…-edited.mp4`. **Every R838 oracle passed, no product defect**:

- All seven controls `TEXTAREA rows=2`, 416.5 / 544.5 / 283 × 64 px (usable **391 / 519 / 257**),
  spanning the card's field width; toolbar 8 px beneath, right edges aligned, 38×36 desktop /
  40×40 mobile; description + toolbar row 108 / 108 / 112. Six captions keep `for` = `id` and
  accessible name = caption, Agent keeps its `aria-label`, label click focuses, 0 duplicate ids.
- Realistic 106-char bullet: 2 lines at both desktop widths, 3 at 375 (vertical scroll
  76 / 62 by design); `scrollWidth === clientWidth` 415 / 543 / 281 for every box — no
  horizontal clipping. Input = storage = preview for 21 field × width combinations; real Enter
  + second-line typing stores `\n` in all seven and six preview distinct lines (Certification:
  single paragraph, see below); one app Undo restores the baseline byte for byte after each
  single edit (fill + keyboard edit = two Undo transactions, as expected).
- Available actions: Move up / down (second entry added via UI, order persists, Undo restores),
  library Save / Remove (Involvement / Coursework / Awards / Publications / Certifications),
  Hide / Show (`aria-pressed`, storage, preview), Delete + Undo — all pass. **Not applicable**:
  Duplicate (none of the seven toolbars has it), library (Military / Agent).
- Card heights 1024 / 1280 / 375: Involvement 612 / 462 / 798, Coursework 346 / 346 / 428,
  Awards 282 / 282 / 350, Publications 360 / 346 / 428, Military 410 / 282 / 428,
  Certifications 282 / 282 / 350, Agent 222 / 222 / 270 (desktop row 64 → 108 = the expected
  +44). Preview pane still alongside at 1024 (476.5 px) and 1280 (604.5 px).
- Regressions: Project description still one textarea + one button on a 64 px row (usable
  345 / 473), mobile stacked 112; Experience two `rows=4` textareas × 3 bullets; Education
  details R837 layout; LinkedIn 417 / 545 / 283; reference 4:3 tracks; 12 / 12 dates fit;
  74 mobile toolbar targets + 12 calendar buttons 40×40; 12 mobile pickers inside x 8–232 /
  105–329; page 1009 / 1265 / 375 = scrollWidth with pickers open; ATS 79; axe 0 violations
  at 1024 and 375; 150 GETs (3 read-only quota), 0 non-GET / AI / checkout / failed / console /
  page errors; asset SHAs identical before and after.

Finding relayed by QA and confirmed pre-existing (not R838):
Certification description keeps typed newlines in storage but the preview renders
`<p>{c.description.trim()}</p>` (since R67) and PDF / DOCX render one paragraph — its Builder
placeholder is "How it's relevant (optional)" (prose), unlike the six "one bullet per line"
boxes. Queued as a P1 semantics item (either render lines or make the editor single-paragraph).
Harness note: none of the seven toolbars has Duplicate; Military and the agent card have no
library button — QA reports those as not applicable rather than covered.

## Boundary

- Desktop cards with these boxes grow by 44 px (one toolbar line) at ≥ 640 px; 375 unchanged.
- Values longer than ~2 × 391 px (1024) / 2 × 519 px (1280) still scroll vertically inside the
  two-row box, as every other description box does.
- Corpus caveat: the replay has no real Involvement / Coursework / Awards / Publications /
  Military values; experience bullets were used as the proxy for "one bullet per line" text.
