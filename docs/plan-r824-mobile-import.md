# R824 — The mobile import journey: dialog no longer clips its own CTA at 375; `Degree - School (dates)` and a bare known city on the contact row import

Chain: R822 (#1040) → this PR. R823 was an evidence round (benchmark refresh + Cloudflare deletion
incident, see `docs/handoff-context.md`) and shipped no product change.

## Question this round answers

R823's production QA walked one user path at 375 px — open Import in the Builder, paste a résumé,
press Import — and it failed three times on production: the Import dialog clipped its own content
(the CTA button included), the education line lost its school, the contact row lost its city. Can
all three be closed in one round without changing desktop geometry or making the importer guess?

## Evidence (production before the fix, R823 testing agent + local re-measurement)

- Import dialog at 375 (`qa/r823-qa/supplemental/375-import-dialog-settled.png`, re-measured
  locally with `qa/r824-dialogs.cjs` after the enter animation, opacity 1): dialog `clientWidth`
  373, `scrollWidth` **445**, descendants reaching x = 422 (a 397 px `Import — replaces current
  content (Ctrl+Z to undo)` button and a 397 px textarea). The wizard's second step measured
  373 / **423** (x → 400) for the same reason. At 1280 both read 510 / 510 with nothing overflowing.
- Cause, verified in code: shadcn's Button keeps `whitespace-nowrap`, so the long label's
  min-content width (≈ 397 px) exceeds the 343 px dialog column; `DialogContent` is `display:grid`
  with the implicit single column whose `min-width: auto` grows to that min-content, dragging every
  sibling (description, share-ID row, textarea) past the dialog's right edge where `overflow-y-auto`
  clips them. Text widths measured with the dialog's own font: `Import — replaces current content
  (Ctrl+Z to undo)` 397, `PDF, DOCX or pasted text — parsed entirely in your browser` 376, `Build
  section by section with the Getting started checklist` 361, `Save as new copy and use it for that
  job instead` (dashboard Resume settings) 351.
- Importer, reproduced locally on `parseResumeText` (`tests/import/_probe.test.ts`, deleted after
  the permanent tests below took over its cases):
  - `B.S. Computer Science - State University (2017 - 2021)` → `degree = "B.S. Computer Science -
    State University"`, `school = ""` (dates read). `splitRoleCompanyRaw` splits headers on `—`, `–`,
    `·`, `|` but not on a spaced ASCII hyphen — the same character the date range uses.
  - `jane@example.com | +44 20 7946 0000 | London` → `contact.location = ""`. `contactPlace` accepts
    `City, ST`, USPS states and region labels only; a bare well-known city on a separator row is
    dropped, and the header fallback only looks at whole lines shaped like `City, Country`.
- Hygiene: `src/lib/_r800_extractFile.ts` and `_r801…_r806_importText.ts` (13 217 lines) were
  pre-fix parser snapshots kept in `src/` by R800–R806 as failing-first evidence. `rg` over `src/`,
  `worker/`, `tests/`, `scripts/`, `vite.config.ts`, `tsconfig*.json` finds no import of any of them
  (only plan docs cite them by name); they sat in the tsc / eslint scope on every gate run.

## Options

| option | verdict |
|---|---|
| `DialogContent` grid column `minmax(0, 1fr)`; long Buttons `h-auto whitespace-normal`; wizard cards `text-left whitespace-normal` | **chosen** — one shared fix for every dialog, per-label opt-out of nowrap where a label is known to be longer than a 343 px column; `sm:` geometry untouched (1280 stays 510 / 510) |
| Shorten the CTA label ("Import") | rejected — the label carries the undo affordance R6xx added on purpose; the grid track would still grow for the next long label |
| `overflow-x-hidden` on the dialog | rejected — hides the clipping, the CTA's right half stays unreachable |
| Bare place on the contact row: accept any capitalised single word | rejected — `Engineer`, `Springfield` become locations; fail-closed on the shared vocabulary from R716/R718 (`src/lib/places.ts`, moved out of `jobs.ts` so the importer does not pull the jobs module) and only on a row that also carries an e-mail / phone / URL |
| Split every ` - ` in an education header | rejected — `BSc (Hons) Computer Science - 2:1` would lose its grade; split only when exactly one side matches `SCHOOL_RE` |

## Fix

- `src/components/ui/dialog.tsx` — `grid-cols-[minmax(0,1fr)]` on `DialogContent`.
- `src/pages/Builder.tsx` — Import CTA `h-auto min-h-9 whitespace-normal`; both wizard option cards
  `text-left whitespace-normal`.
- `src/pages/Dashboard.tsx` — the two long Resume-settings save buttons `h-auto min-h-10
  whitespace-normal`.
- `src/lib/places.ts` (new, moved from `src/lib/jobs.ts`) — country / region aliases, city → country
  map, `isKnownPlace`; `jobs.ts` imports and re-exports it.
- `src/lib/importText.ts` — `bareKnownPlace()` on contact-row segments (known place + contact token
  on the same row, never the name); the `City, Country` header fallback stops at the first section
  heading; `eduHeaderSeparators()` promotes a spaced ASCII hyphen to the header separator when
  exactly one side is a school.
- Deleted: `tests/import/_probe.test.ts`, `src/lib/_r800_extractFile.ts`,
  `src/lib/_r801_importText.ts` … `_r806_importText.ts`.

## Tests (fail on the R822 tree, pass here)

- `tests/import/rules.test.ts` (+9): London / `United Kingdom` on the contact row → location;
  `Engineer`, unknown `Springfield`, a standalone `London` line without contact tokens and a
  `React, TypeScript` skills row are **not** locations; `B.S. Computer Science - State University
  (2017 - 2021)` and the reversed orientation → degree / school / 2017 / 2021; `BSc (Hons) Computer
  Science - 2:1` keeps its grade on the degree side. 6 / 9 fail on the pre-R824 parser.
- `tests/dialog-mobile-width.test.ts` (+4, source-level): `DialogContent` has the shrinkable column,
  Import CTA / wizard cards / dashboard save buttons wrap. 4 / 4 fail on the pre-R824 sources.
- 186-file import replay (`qa/r824-replay.mts`): identical 186 / 186.

## Verification

Local: vitest 312 (299 → 312), `tsc -p tsconfig.app.json`, `tsc -b`, eslint 0 errors / 11 known
warnings, `npm run build`, `verify-dist` 123 URLs. Local preview 375: wizard 373 / 373, wizard step 2
373 / 373, Import 373 / 373, no overflowing descendant; 1280: 510 / 510 all three. Production QA
after deploy: see `docs/handoff-context.md` R824.

## Boundaries

- Only labels measured longer than a 343 px column were switched to wrapping; a new long label in
  a Button still needs `whitespace-normal` — the grid column now shrinks, so it is clipped inside its
  own button rather than dragging the dialog.
- Bare place inference is fail-closed on the vocabulary in `places.ts` (≈ 130 city spellings plus the country and
  region aliases); a city it does not know on a contact row stays unparsed, as before.
- `Role - Company` experience headers with a spaced hyphen are unchanged (no school test to
  disambiguate them from a hyphenated role).
