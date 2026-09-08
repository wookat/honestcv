# R754 — Arbeitnow board footer survives on half the rows

## Evidence (first-hand, 2026-09-06)

- Production `/api/jobs/search?q=engineer` (R753 Worker, `index-BvwS2SCx.js` deploy): 94 Arbeitnow rows,
  47 end with `Find more English Speaking Jobs in <Germany|France|United Kingdom> on Arbeitnow`, 47 clean.
  `product manager`: 100 Arbeitnow rows, 44 with the footer, 56 clean. No other trailing board text found.
- Raw upstream (`/api/job-board-api?page=1,2`, 500 postings, `qa/r754-raw.json`): **500/500** descriptions end with
  the board's own paragraph, in exactly two shapes and three countries:

  | shape (raw HTML) | count |
  | --- | --- |
  | `<p>Find <a …>Jobs in <Country></a> on Arbeitnow</a>` | 242 |
  | `<p>Find more <a …>English Speaking Jobs in <Country></a> on Arbeitnow</a>` | 258 |

  The footer is always preceded by `<p>` (never glued to inline text), so `htmlToText` always leaves it on its own
  last line. The link target is the board (`arbeitnow.com` / `.fr` / `.co.uk`), not the employer.
- Deployed cleanup (R752, `worker/index.ts` `fetchArbeitnow`):
  `/\n*Find Jobs in [^\n]{1,60} on Arbeitnow\s*$/i` — matches shape 1 only. The 47 clean production rows are
  shape 1 after the R752 strip; the 47 residuals are shape 2. R752 verified the strip on a fixture that only had
  shape 1.

**Classification**: normalisation gap, not a stale deployment and not a cache artefact — the query cache and
the shared feed snapshot both reflect the R752 code (shape 1 is gone), and the raw upstream shows the second
shape on 52 % of postings.

## Why it matters

The description is what the user sees in the `/jobs` detail pane and what "Target my resume" / ATS check use as
the job description. The footer contributes `english speaking`, the country and `arbeitnow` as ad text; on a
short posting these land in the keyword pool (measured below).

## Change (Worker only)

```ts
// fetchArbeitnow
- .replace(/\n*Find Jobs in [^\n]{1,60} on Arbeitnow\s*$/i, '')
+ .replace(ARBEITNOW_FOOTER_RE, '')
+ const ARBEITNOW_FOOTER_RE = /\n*Find (?:[a-z]+ ){0,3}Jobs in [^\n]{1,60} on Arbeitnow\s*$/i
```

Up to three optional lowercase words between `Find` and `Jobs` (`more English Speaking`), still anchored to the
end of the text and to `on Arbeitnow`, so a posting that merely mentions the board mid-body is untouched.

## Validation

- `qa/r754-strip.mts`: run production `htmlToText` + old/new regex over the 500 raw postings → residual footers
  old 258 / new 0; text before the footer unchanged (only the final line removed); no non-footer line removed.
- ATS keyword effect on the 258 affected postings (extractKeywords with vs without footer).
- tsc (worker), build, deploy, production `/api/jobs/search` recount after the shared-feed snapshot refreshes
  (≤15 min) and per-query cache expires (≤60 min) — or with a fresh query string to bypass the query cache.

## Result

- 500 raw postings: residual footers old 258 → new 0; new text is a prefix of the old in 500/500; 65 footers had no
  newline before them (encoded `&lt;/div&gt;` ahead of the `<p>`), also removed. No body mentions Arbeitnow afterwards.
- Keyword effect on the 258 affected postings: top-30 list changes in 30 (`english` leaves 18, `find` 7,
  `france` 6, `speaking` 1), top-15 in 11.
- Production after deploy + feed refresh: `consultant` 23 / `sales manager` 63 / `designer` 24 Arbeitnow rows,
  0 footers; `engineer` still served from its pre-deploy query cache (TTL ≤ 60 min). `/jobs` 1280 + 375:
  Arbeitnow pane ends with the employer's sign-off, 0 console errors, 0 overflow.
