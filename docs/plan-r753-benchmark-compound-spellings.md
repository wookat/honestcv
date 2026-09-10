# R753 — function benchmark refresh (5 rounds since R748) + compound spellings (front-end / front end / frontend) are one keyword

## Benchmark refresh

Rezi public pages (`qa/r753-rezi.mjs` → `qa/r753-rezi.json`, 8 URLs): titles and
h1–h3 sets identical to the R748 snapshot; `/resume-keyword-scanner` still 404. No new
competitor surface to match.

Production (`cv.zalize.com`, `qa/r753-api.mjs`, `qa/r753-prod.cjs`):

| probe | result |
|---|---|
| `/`, `/ats-checker`, `/pricing`, `/jobs`, `/sitemap.xml` | 200 |
| `/api/jobs/search` engineer / nurse / data analyst+London / barista+Chicago / product manager | 150 / 28 / 65 / 4 / 150 rows; Remotive 6 / 0 / 0 / 0 / 1 (degraded upstream, R748) |
| Arbeitnow footer residue | 47 / 1 / 2 / 0 / 44 rows still end in `Find more English Speaking Jobs in <country> on Arbeitnow` — the R752 suffix match covers only `Find Jobs in …`. Raw upstream (`?page=1,2`, 500 jobs) shows both variants. **P2, R754** (deploy + snapshot-age check before calling it anything else). |
| Tailor golden path (1 real AI call, Front-end Engineer @ Comand Ai, Alex Morgan fixture) | 200 in 16 s, 4 rows, 0 console / page errors, 0 overflow, storage back to baseline. Report: 9 of 23 keywords matched, **`front-end` listed as missing while the resume says `Frontend`**; the summary rewrite's `Front-end` was flagged as "job-ad wording your resume never uses". |

## Gap table (P0/P1 only)

| # | area | finding | decision |
|---|---|---|---|
| 1 | ATS scoring / Tailor grounding | the same word in another spelling (`front-end` vs `frontend`) is a miss and a "borrowed word" | **P1 — this round** |
| 2 | job feed | Arbeitnow footer variant survives normalisation (44–47 rows per 150) | P2 (cosmetic, description tail) — R754 |
| 3 | Tailor grounding | `mirrored` flags generic words (`quality team technical platform`) on 21/25 retained rows | unresolved — needs a specificity policy with labels before a change; not this round |

No P0.

## Evidence for #1 (84 real ads, `qa/r723-jds.json`, production `extractKeywords`)

`qa/r753-hyphen.mts`, `qa/r753-compound.mts`:

- 45/84 ads carry ≥ 1 hyphenated keyword; `cross-functional` ×32 dominates but has no
  closed spelling anywhere in the corpus. The only compounds written both ways in the
  corpus: `frontend` 61 / `front-end` 6 / `front end` 1; `backend` 16 / `back-end` 2;
  `fullstack` 2 / `full-stack` 3 / `full stack` 6; `tradeoffs` ↔ `trade-offs` 7;
  `lifecycle` ↔ `life-cycle` 2.
- 9/84 ads (Berliner Verlag, Koppla, neoshare, Spotify, DiliTrust, Sporty Group, CertiK,
  Roofr, …) have `frontend` / `backend` / `front-end` as a **keyword** — role-defining
  terms. A one-line resume in each spelling against those 13 keywords, before:

| resume spelling | hit | miss |
|---|---|---|
| `frontend backend fullstack` | 12 | 1 (neoshare `front-end`) |
| `front-end back-end full-stack` | 1 | 12 |
| `front end back end full stack` | 0 | 13 |

- neoshare's ad has both `front-end` and `frontend` as separate keywords (denominator
  counts the same word twice).
- Labelled set (R752, 24 ads): gold contains `frontend` ×6 and `backend` ×3 (closed
  spelling); no hyphenated gold — the labels are not affected either way.
- Tailor replay (`qa/r753-tailor-replay.mts`, 25 retained rows): `front-end` is in the
  mirrored list for the Comand Ai rows although the resume says `Frontend`.

## Change (`src/lib/ats.ts`, `src/lib/grounding.ts` — no Worker, prompt or UI change)

A two-part alphabetic compound (`^[a-z]{3,}[- ][a-z]{3,}$`) and its closed spelling are
the same word:

- `ResumeIndex.compounds`: closed spelling → the resume's wording, built from hyphenated
  tokens (`front-end`) and adjacent token pairs (`front end`).
- `findForm`: after the exact / stem lookups fail, `findCompound` — a hyphenated or
  two-word needle looks up its closed spelling in the token set or `compounds`; a plain
  needle of ≥ 6 letters looks itself up in `compounds`. `found` reports the resume's
  wording, so the UI keeps saying "written as `Frontend`".
- `extractKeywords`: a keyword whose closed spelling is already listed is skipped
  (`front-end` + `frontend` → one keyword; the higher-scored spelling stays).
- `tailorClaims`: the resume vocabulary (`wordStems`) also carries the closed spelling of
  its hyphenated words, and a hyphenated suggestion word is "already there" if its closed
  spelling is.

Not done: a curated alias list per compound. The rule is general, symmetric and exact —
`cross-functional` now also matches `cross functional` and `crossfunctional`, nothing
else; no unrelated word pairs collide in the corpus.

## After

- `qa/r753-compound.mts`: all three resume spellings hit 12 / miss 0; neoshare lists one
  keyword for the word; 0 ads with two spellings of one word as keywords.
- `qa/r753-diff.mts` (HEAD vs working tree, 84 ads, Alex Morgan): keyword lists changed
  in **1** ad (neoshare −`frontend`, now covered by `front-end`), Alex Morgan hits changed
  in **1** (neoshare `front-end` false → true / "frontend"). Everything else byte-identical.
- R752 labelled benchmark: STRICT P 0.43 / R 0.91 / F1 0.59, recall R 159/171 P 43/47
  T 24/29 — unchanged.
- Tailor replay: `front-end` leaves the mirrored list; every other flag identical.
- Grounding probes R744 / R745 / R749 / R750 unchanged (all PASS / ok).

## Boundaries

- Two-part alphabetic compounds only (`e-commerce` ↔ `ecommerce` needs ≥ 3 letters per
  part and is not covered; `on-site` ↔ `onsite` likewise). Chosen from the corpus, not a
  dictionary; a genuinely different word pair that differs only by a hyphen would collide
  (none found in 84 ads).
- `compounds` keeps the first wording per closed spelling.
- Grounding change is hyphen ↔ closed only (no two-word form) — word-level like every
  other grounding check.
