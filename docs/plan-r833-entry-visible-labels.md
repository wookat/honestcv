# R833 — benchmark refresh + Involvement / Military entries get the visible, contextual field labels the Experience / Education cards already have

## Benchmark refresh (first-hand, production R832 bundle)

- Rezi public pages (`/home/ubuntu/qa/r833-rezi.mjs` → `r833-rezi.out`): 7 of 8 tracked routes 200
  (three redirect to `/tools/...` as since R823), `/resume-keyword-scanner` 404 as before; the headline
  feature inventory (builder / score / target / job search / cover letter / mock interview) is
  unchanged since R828 — no new public capability to close.
- Production function smoke (`r833-prod-functional.mjs` → `r833-prod-functional.json`, own test data,
  deleted afterwards): health 200, quota 12, share create → read (bytes equal) → shell page (title /
  og) → wrong-token delete 403 → delete 200 → 404; billing `freeMode: true` / checkout 503 / license
  503 (unconfigured, as reported since the account move); jobs search 200 / 31 rows
  `remotive+jobicy+arbeitnow`. The single authorised AI call (`summary-draft`) returned outer 200 with
  `{error, status: 502, aiUnavailable: {status: 530}}` and the quota stayed 12 — the relay
  `code-plan.site` is still NXDOMAIN (registry `serverHold`); **P0 remains external**, nothing to do
  in this repo.
- Builder form audit (`r833-labels.cjs` → `r833-labels-1024.txt`, R815 all-sections fixture, every
  populated control classified by *visible* caption only — `label[for]`, `aria-labelledby`, ancestor
  `<label>`; `aria-label` deliberately not counted): **76 controls → 28 visible / 0 sr-only / 48 with
  no visible caption**. Of the 48, 8 are the Involvement / Military structured entries
  (`Role`, `Organization`, `College or city (optional)`, `Involvement description`, `Rank or
  position`, `Branch`, `Stationed at`, `Responsibilities and accomplishments`), all named by
  placeholder-only `aria-label`s; the Experience / Education cards of the same fixture already carry
  contextual visible labels (`Your role at Brightlane`, `Which company was this?`, `When were you at
  Brightlane?`). So the gap is *consistency inside our own product*: two dated-entry sections lose
  their caption the moment the user types (placeholder disappears), while the two sections above
  them keep one. Accessible names were present (axe 0 violations since R644), so this is a P1
  form-UX gap, not a WCAG violation.
- Involvement / Military also still used the R826 *two-grid* layout (role / org in a plain
  `grid gap-2 sm:grid-cols-2`, place + dates in `ENTRY_FIELDS_GRID`) — so at 1024 their role /
  organisation and rank / branch boxes were the 178 px half-row boxes R829 fixed for Experience /
  Education (`inner=178` in `r833-sim-1024.json` before).

## Simulation on production first (`r833-simulate.cjs`, DOM surgery on the R832 bundle)

| viewport | Involvement card h before → after | Military card h before → after | role / rank inner | `scrollWidth` |
| -------- | --------------------------------- | ------------------------------ | ----------------- | ------------- |
| **1024** | 424 → 582                         | 222 → 380                      | 178 → **391**     | 1009 → 1009   |
| 1280     | 344 → 418                         | 178 → 252                      | 242 → 242         | 1265 → 1265   |
| 375      | 718 → 846                         | 314 → 428                      | 242 → 242         | 360 → 360     |

No page-level overflow at any width; screenshots `/home/ubuntu/qa/shots/r833/`.

## Design

Both cards adopt the Experience / Education pattern verbatim — one `ENTRY_FIELDS_GRID` with four
`space-y-1.5 ${ENTRY_WIDE_FIELD}` wrappers (role / org, place, date pair), each with a
`<Label htmlFor>` pointing at an explicit id, and the description label above the `ENTRY_TEXT_ROW`:

```
inv-<id>-role          "Your role at <org>"                       | "Your role"
inv-<id>-organization  "Which organization was this?"
inv-<id>-location      "Where was <org> based? (optional)"         | "Where was this? (optional)"
inv-<id>-start         "When were you involved with <org>?"        | "When was this?"   (end date keeps aria-label="End date")
inv-<id>-description   "What did you do at <org>?"                 | "What did you do there?"
mil-<id>-rank          "Your rank or position in the <branch>"     | "Your rank or position"
mil-<id>-branch        "Which branch did you serve in?"
mil-<id>-location      "Where were you stationed?"
mil-<id>-start         "When did you serve in the <branch>?"       | "When did you serve?"
mil-<id>-description   "What were your responsibilities and accomplishments?"
```

- The placeholder-only `aria-label`s are removed (the visible label is the accessible name; a
  duplicate `aria-label` would override the label text for AT). `MonthYearField` takes `id` for the
  start input; the end input keeps `ariaLabel="End date"` as in Experience / Education.
- No state, export, ATS or preview code changes; the description textarea / toolbar row is unchanged.
- Rejected: sr-only labels (fixes the classifier, not the user); static labels without the org /
  branch (the Experience pattern already proved the contextual form); keeping the two-grid layout
  (would leave the 178 px role / rank boxes at 1024 while everything else moved to the shared grid).

## Tests (344 → 348)

- `tests/entry-visible-labels.test.ts` (new, 4): every exp / edu / inv / mil field in the inventory
  has a `<Label htmlFor>` whose target id appears on a control; the contextual templates exist; the
  eight placeholder-only `aria-label`s are gone; Involvement / Military use `ENTRY_FIELDS_GRID`.
- `tests/entry-dates-wide.test.ts`: dated-entry inventory keyed by `htmlFor={\`inv-…-start\`}` /
  `mil-…-start` (4 wide fields each), plain-grid count 4 → 2.
- Gates: vitest 348, `tsc -p tsconfig.app.json`, `tsc -b`, eslint 0 errors / 11 pre-existing
  warnings, build, verify-dist 123. (`prettier --check` warns on `Builder.tsx` on the base branch
  too — the repo's `lint` is eslint only.) Whitespace-insensitive diff of `Builder.tsx`: +71 / −19.

## Deploy + verification

- New account version `125d02ff`; production `index-uaFcsWWu.js` / `Builder-BF0hI7W2.js`
  SHA-identical to dist.
- Native re-measure on the deployed bundle (`r833-native.cjs`, no DOM surgery, `r833-native-prod.txt`):
  1024 inv 443×568 / mil 443×366, role / org / rank / branch / location inner **391**, dates 158,
  labels 5/6 visible per card (the 6th is the end date, `aria-label="End date"` by design), 0
  duplicate ids, 0 clipped values, `scrollWidth = clientWidth` 1009; 1280 inner 242 / dates 84,
  role + org share a row; 375 one column, inner 242 / dates 76, `scrollWidth` 360. Identical to the
  simulation.
- Independent production QA (testing agent, `/home/ubuntu/qa/r833-qa/`): see the R833 entry in
  `docs/handoff-context.md` and the PR.

## Boundaries / found during QA (pre-existing, queued)

- **R834 candidate**: every entry toolbar button (30 in `Builder.tsx`, `size="sm"` +
  `min-h-10 shrink-0 sm:min-h-9`) is **38 × 40 px at 375** — R815 only asserted the height; width is
  `px-3` + a 14 px icon. Same on Experience / Education and on the R832 bundle. Meets WCAG 2.5.8
  (24 px) but not the product's own 40 × 40 touch target; fix is `min-w-10 sm:min-w-0`.
- Below `sm` the toolbar wraps under the textarea (`ENTRY_TEXT_ROW` `basis-full`, R798) — intended.
- Involvement / Military cards are 158 px taller at 1024–1215 (four labels + two rows); 74 px at
  1280; 128 px at 375.
- The remaining 40 controls without a visible caption are single-field rows (summary, coursework,
  awards, publications, certifications, references, custom sections) whose placeholder is the only
  caption; they are one-line inputs whose section heading names them and are queued as a separate
  consistency item, not a P1.
