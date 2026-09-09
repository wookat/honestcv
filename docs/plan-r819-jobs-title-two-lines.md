# R819 — /jobs list titles wrap to two lines instead of one truncated line

Chain: R818 (#1036) → this PR.

## Question this round answers

R818 left a boundary: at 1024–1279 the `/jobs` list pane is 282–339 px and long titles truncate with
an ellipsis. Is that an acceptable compact-list trade-off (the detail pane has the full title) or a
usability defect? Decide from first-hand production geometry **and** rendered screenshots, not from
class names.

## Evidence (production, before the fix)

`/home/ubuntu/qa/r819-evidence.cjs` — every one of the 150 rows the board loads, cache disabled,
storage restored, title selector `button[id^=job-card-] p.truncate.text-sm`, "clipped" =
`scrollWidth > clientWidth`, "ambiguous" = two rows whose *visible* title prefix and company · location
line read the same.

| width | list pane | title box | clipped titles | hidden chars / clipped title | ambiguous rows |
|------:|----------:|----------:|---------------:|-----------------------------:|---------------:|
| 375   | 328       | 237       | 62 / 150       | ≈ 10                         | several        |
| 768   | 465       | 374       | 15 / 150       | ≈ 6                          | 0              |
| 1024  | 282       | **191**   | **94 / 150**   | **≈ 15**                     | 2              |
| 1152  | 333       | 242       | 61 / 150       | ≈ 11                         | 0              |
| 1280  | 339       | 248       | 58 / 150       | ≈ 11                         | 0              |

Screenshots (`/home/ubuntu/qa/shots/r819-evidence-*/`) at 1024 read `Tier III Service Desk Engin…`,
`Lifecycle Specialist, Time …`, `Lifecycle Specialist, Emplo…`, `Global Payroll Implementation…` —
the part that distinguishes one posting from the next (`… - AMER` / `… - Canada`, `… - PEO` /
`… - GPIS`) is exactly the part that is cut. The detail pane does show the full title, but only for
the row already selected: a user has to click rows one by one to tell them apart. That is the
definition of a usability defect, not a compact-list trade-off — 63 % of rows lose information at
the first desktop width, and the widest desktop width (1280) still clips 39 %.

## Options measured before choosing

`/home/ubuntu/qa/r819-simulate.cjs` injected CSS into the production page (no product change) and
re-measured the same 150 rows:

| option | 1024 clipped | ambiguous | row height | horizontal overflow |
|--------|-------------:|----------:|-----------:|--------------------:|
| current one-line `truncate`            | 94 | 2 | 54 | none |
| **two-line clamp (`-webkit-line-clamp: 2`)** | **15** | **0** | 54–74 | none |

Same at 375 (62 → 3), 1152 (61 → 3), 1280 (58 → 3). Cost: rows with a long title are 20 px taller,
so the list needs more vertical scrolling. That is the trade-off worth making — vertical scrolling
is the list's normal interaction; guessing which `Lifecycle Specialist, …` is which is not.

Rejected:
- Changing the 2fr/3fr list / detail ratio — gives the list ≈ 40 px more at 1024 and takes it from
  the detail pane at every desktop width; still ≈ 80 clipped titles.
- Three lines / no clamp — 3-line titles made rows 94 px and a 150-row list twice as tall;
  two lines already recover 135 of the 150 titles.
- Shrinking the title font — 13 px reduced clipped rows only to ≈ 80 and hurts legibility.
- A tooltip / `title` attribute — invisible on touch and to keyboard users, and the detail pane
  already plays that role.

## Fix (`src/pages/Jobs.tsx`, one element)

```tsx
- <p className="truncate text-sm font-medium">{j.title}</p>
+ <p className="line-clamp-2 text-sm font-medium break-words">{j.title}</p>
```

`line-clamp-2` is Tailwind's built-in utility (`display:-webkit-box; -webkit-line-clamp:2;
-webkit-box-orient:vertical; overflow:hidden`); `break-words` lets a single over-long token
(`Python/TypeScript/Microservices`) wrap instead of forcing the row wider. The company · location
line stays one truncated line (secondary information; the detail pane repeats it in full). Nothing
else in the card, the pane split or the R818 breakpoints changes.

## Verification

- `tests/jobs-panes.test.ts` (+2, 276 → 278): the card-title paragraph carries `line-clamp-2` and
  `break-words` and no `truncate`; the company · location paragraph keeps `truncate text-xs`. The
  first test fails on the R818 tree (`<p className="truncate text-sm font-m…`). The test anchors on
  the `{j.company} · {j.location}` expression and takes the *last* `{j.title}` before it — the
  first `{j.title}` in the file belongs to filtering / ARIA code (first draft of the test matched
  that and read an empty tag).
- Gates: vitest 278 / tsc app + `tsc -b` / eslint 0 errors (11 pre-existing warnings) / build /
  verify-dist 123.
- `/home/ubuntu/qa/r819-verify.cjs` (13 checks per width; local preview and production identical):
  every title computes `-webkit-line-clamp: 2`, `overflow: hidden`, `white-space: normal`,
  `overflow-wrap: break-word`; no title renders more than 2 lines; long titles use the second line
  (1024: 94 rows, 1280: 58, 375: 62); clipped titles 375 → 3, 768 → 0, 1024 → 15, 1152 / 1279 /
  1280 → 3 (the survivors are 60–80-char titles such as `Senior Backend Engineer (Python &
  TypeScript, Microservices & Data Pipelines)`); company · location stays one line; title button
  54–74 px; no row / list / page horizontal overflow (`scrollWidth = visualViewport.width`);
  selecting a two-line row shows the identical full title in the detail heading, unclipped, with
  `aria-pressed=true` on the row; below `lg` browser Back still returns to the list on `/jobs` with
  the sentinel gone; localStorage keys back to baseline; 0 console / page errors.
- Harness note: Chrome ≥ 130 reports computed `display` of a clamped `-webkit-box` as `flow-root`,
  so the oracle asserts `-webkit-line-clamp` + `overflow` + `white-space`, not `display`.
- Production QA after deploy: see `docs/handoff-context.md` (R819).

## Boundaries

- 3–15 titles per width still end in an ellipsis on their second line (≥ 60 chars); the detail pane
  has the full title, and no two rows read the same any more.
- The company · location line is still one truncated line (`Machine Learning Reply · Munich, Bay…`);
  the detail heading repeats it in full. Wrapping it too would add another 16 px per row for
  secondary text — not in this round.
- The 2fr/3fr pane ratio is unchanged.
