# R837 — Education "details" wraps instead of clipping (2026-09-10)

## Evidence (first-hand, production R836 bundle `684ebcd0`)

Scripts: `/home/ubuntu/qa/r837-evidence.cjs` (deployed bundle, R815 all-sections fixture +
GPA `3.8/4.0`, Minor `Mathematics`, Details `First Class Honours. Final project: an accessible
public transport journey planner.`), `/home/ubuntu/qa/r831-corpus.cjs` (retained 186-resume import
corpus `/home/ubuntu/qa/r776-text-replay.json`).

- The Education "Honors, thesis or other details (optional)" control (`edu-<id>-details`) was a
  single-line `<Input>` sharing a flex row with the five-button entry toolbar. Usable width
  (`clientWidth − padding`) **161 / 289 / 242 px** at 1024 / 1280 / 375.
- Corpus: 64 non-empty Education details values, **12 distinct** (53 of the 64 are the one
  83-character value from our own export fixtures — the "64 / 64 over" figure quoted in the R836
  note was therefore inflated by duplicates; the distinct-value figures below are the ones that
  matter). Measured with the control's own font (14 px Inter, canvas): **347 → 2 259 px**
  (50 → 345 characters; p50 ≈ 536 px). Fit in the single-line box: **0 / 12 at every width**.
- A single-line box can not be made wide enough: the widest row a card offers is 391 px at 1024
  and 519 px at 1280 — that would fit **1 / 12** and **2 / 12** distinct values. Every remaining
  value is a sentence or a `;`-separated list (honors, thesis title, coursework, expected
  graduation), i.e. prose, not a name.
- The rest of the Builder already treats such prose as a `rows=2` textarea (Involvement /
  Coursework / Awards / Publications / Certifications / Military descriptions). Side finding,
  not this round: in the shared `ENTRY_TEXT_ROW` those textareas are only **161 px** usable at
  1024 (Military 207 px, its toolbar has one button fewer; 146 px once a native scrollbar
  appears) and 289 / 335 px at 1280 — measured on the deployed R837 bundle with
  `r837-evidence.cjs`; a candidate for the same container-query treatment as R826 / R829
  (queued).
- Storage / preview / exports / ATS were never affected: `EducationItem.details: string` is
  rendered whole by `educationDetailLine()` and every exporter. This is an editor-only defect.

## Design (measured on the production DOM before any source change — `r837-simulate.cjs`, `r837-simulate-b.cjs`)

Three candidates, all seeded with the fixture and all 12 distinct corpus values:

| candidate | usable width 1024 / 1280 / 375 | 83-char p50 value | distinct values fully visible (no scroll) | details row height 1024 / 1280 / 375 |
|---|---|---|---|---|
| A. wider single-line row (Input alone on its row, toolbar below) | 391 / 519 / 242 | clipped at every width (536 px) | 1 / 2 / 0 of 12 | 80 / 80 / 84 |
| B. `rows=2` textarea in the shared `ENTRY_TEXT_ROW` (like the other description boxes) | 146 / 274 / 227 | 5 / 3 / 3 wrapped lines → vertical scroll | 0 / 3 / 2 of 12 | 64 / 64 / 112 |
| **C. `rows=2` textarea on its own full-width line, toolbar right-aligned beneath (chosen)** | **391 / 519 / 227** | **2 / 2 / 3 lines** — whole on desktop | **7 / 8 / 2 of 12** | **108 / 108 / 112** |

(Was: one-line input row 36 / 36 / 84 px — the row already wrapped below `sm`, so 375 is the
same for B and C. Card height follows the row: C = 504 / 390 / 554 measured, i.e. +72 / +72 /
+28 over the R836 card, derived from the row difference.) Every wrapped candidate has
`scrollWidth === clientWidth` for 12 / 12 values at every width; horizontal clipping is gone
by construction.

Chosen: **C**. C over B because at 1024 — the desktop layout the editor is used in beside the
preview — B fits ~17 characters per line and scrolls 12 / 12 values, while C shows 7 / 12
whole (8 / 12 at 1280) and the values that still scroll are the ≥ 131-character template
boilerplate strings (`GPA: 0.00 (do not include if <3.00); …`). The 44 px C costs over B at
desktop is one toolbar line; the Education toolbar only ever sat on the details row because
the one-line input left room next to it.

Rejected: A (0 / 12 → 1 / 12 is not a fix); auto-growing textarea (`field-sizing: content` is
Chromium-only, and every other description box in the product is a fixed two-row box);
changing the stored shape or the ` · `-joined preview line (details stays a one-line string:
Enter is swallowed, pasted `\r?\n` become spaces so a paste from a PDF cannot smuggle a line
break into the export).

## Fix (`src/pages/Builder.tsx`)

```tsx
const ENTRY_TEXT_STACK =
  'flex flex-wrap items-start gap-2 [&>:first-child]:basis-full [&>:nth-child(2)]:ml-auto'
…
<div className={ENTRY_TEXT_STACK}>
  <Textarea id={`edu-${e.id}-details`} rows={2} placeholder="Dean's List, thesis title…"
    onKeyDown={(ev) => { if (ev.key === 'Enter') ev.preventDefault(); markShortcutKeyDown(ev) }}
    value={e.details}
    onChange={(ev) => setResume(… details: ev.target.value.replace(/\r?\n/g, ' ') …)} />
  {/* five toolbar buttons unchanged */}
</div>
```

Label, id, placeholder, `setResume` path, `markShortcutKeyDown` (Ctrl/Cmd+B/I/U/K), toolbar
buttons and their order, preview, PDF / DOCX / TXT / MD, ATS, Undo: unchanged. CSS bundle
unchanged (every class already existed).

## Tests (361 → 365)

`tests/education-details-wrap.test.ts`: the details control is a `<Textarea rows={2}>` inside
`<div className={ENTRY_TEXT_STACK}>`; the stack has `basis-full` + `ml-auto` and no `sm:`
variant; Enter is prevented, `markShortcutKeyDown` kept, `\r?\n → ' '`; label and placeholder
kept. `tests/entry-visible-labels.test.ts` R836 "label above the row" check now looks for the
`ENTRY_TEXT_STACK` row. On the R836 tree 3 of the 4 new tests fail.

Gates: vitest 365 / 27 files; `tsc -p tsconfig.app.json`, `tsc -b`; eslint 0 errors / 11
pre-existing warnings; build; verify-dist 123.

## Deploy + native re-measure (`r837-native.cjs`, no DOM surgery)

New account version `f1e07ce3-b53a-439e-a401-5032cbb1d35a`; production `index-BOKJKr-_.js`
`d35dbb7d…` / `Builder-1Y60Q9DW.js` `3fec2dfe…` / `style-CSnCqmMX.css` `b010f700…`
SHA-identical to `dist/client`; `/api/health` 200.

| width | control | usable | box h | row h | toolbar | card | corpus fully visible / h-scroll | page |
|---|---|---|---|---|---|---|---|---|
| 1024 | textarea rows=2 | 391 | 64 | 108 | 5 × 38×36, 8 px below, flush right | 504 | 7 / 12 · 0 / 12 | 1009 / 1009 |
| 1280 | textarea rows=2 | 519 | 64 | 108 | 5 × 38×36 | 390 | 8 / 12 · 0 / 12 | 1265 / 1265 |
| 375 | textarea rows=2 | 227 | 64 | 112 | 5 × 40×40 | 554 | 2 / 12 · 0 / 12 | 360 / 360 |

Identical to the simulation. Enter + typing leaves no `\n`, input = storage; toolbar Undo after
one `fill()` restores the seeded baseline byte for byte, preview shows the value. (Native
Ctrl+Z inside a textarea first undoes per keystroke — browser behaviour shared with every other
textarea; the app-level oracle is the toolbar Undo.) 0 duplicate ids, console 0.

## Independent production QA (testing agent, `/home/ubuntu/qa/r837-qa/`)

Independent real Chrome 1024×768 / 1280×800 / 375×667 + a native-scrollbar 375 supplement,
cache disabled, storage restored byte for byte (diff 0), recordings
`r837-qa/r837-{1024,1280,375,375-native}-readable.mp4`,
`/home/ubuntu/screencasts/r837-*/…-edited.mp4`. **Every oracle passed, no product defect**:

- `TEXTAREA rows=2`, exact caption, `for` = `id`, accessibility name = caption, label click
  focuses; 0 duplicate ids. Toolbar (Move up / Move down / Duplicate / Save to library / Delete;
  Hide stays in the card header) 38×36 desktop / 40×40 mobile, 8 px below the box, right edges
  aligned; Tab order GPA → Minor → Details → enabled toolbar buttons.
- Usable 391 → 376 / 519 → 504 px once the long value's scrollbar appears; 375 overlay-scrollbar
  Chrome 257 (card 540), native-gutter Chrome 242 → 227 (card 554). Short (50 ch) and medium
  (83 ch) values sit inside the two-row box at 1024 / 1280 (canvas 1 and 2 lines; 375: 2 and
  3), the 190-char long value wraps to 4 / 3 / 6 lines (native-gutter 375: 7) and scrolls
  vertically by design; `scrollWidth === clientWidth` for every value at every width.
- Enter inserts nothing; LF and CRLF pastes are stored with spaces; input = storage = preview
  (`details · Minor in Mathematics · GPA: 3.8/4.0`); one app Undo after each single edit or
  paste restores the baseline byte for byte. Duplicate / Move / library Save–Remove / Hide–Show /
  Delete + Undo all work.
- Rest of the Education card unchanged (degree / school full row at 1024, location + dates,
  GPA / Minor pair 178 / 242 / 112). R826–R836: LinkedIn 417 / 545 / 283, reference 4:3 tracks,
  13 reference / education + 18 one-line + 10 Involvement / Military captions, 12 / 12 dates,
  70 mobile entry controls 40×40 (desktop 22 × 38×28 + 48 × 38×36), 12 calendar buttons 40×40,
  mobile picker x 8–232, no page-level overflow with the picker open.
- ATS 79 at every width; one valid 2-page A4 PDF whose text contains the full details / Minor /
  GPA; axe 0 violations at 1024 and 375; 200 GETs, 4 read-only `/api/ai/quota`, 0 AI generation
  / checkout / non-GET / failed requests, 0 console or page errors; asset SHAs unchanged.

QA harness notes (not product defects): movement at a list boundary intentionally hands focus
to the opposite enabled arrow; the library button's accessible name is `Remove saved education
<degree> — <school>` (title `Remove from library`); overlay-vs-native 375 scrollbars change the
usable width by 15 px — report which variant was measured.

## Boundary

- Values ≥ ~130 characters still scroll vertically inside the two-row box at desktop; at 375
  anything over ~60 characters does. Deliberate: matches every other description box.
- Side finding for the queue: the six shared-row description textareas are 161 px (Military
  207 px) usable at 1024 in `ENTRY_TEXT_ROW`, 146 px once a native scrollbar appears — the
  same container-query treatment as R826 / R829 would give them the full row below 32 rem.
