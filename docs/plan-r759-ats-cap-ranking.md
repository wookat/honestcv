# R759 — ATS ranking under the 30-keyword cap: a requirement name said once outranks a plain word said twice

Chain: R758 (#976) → this PR. Corpus (`qa/r751-rows.json`, 84 real ads), gold labels (`qa/r752-labels.mts`, 247 STRICT terms), 16 dev / 8 held-out split, the R752 category definitions and the 30-keyword ceiling are unchanged. The R756 overlay (`qa/r756-labels-add.mts`) is measurement only; this round adds a second, post-hoc overlay (see "Labels added after the fact").

## The question

R758 grew Tailscale's requirements block from 8 to 20 lines and two single-mention names the overlay labels R (`html/css`, `saas`) fell out of the top-30. R755 / R757 had already named "ranking inside the cap" as the dominant remaining G error. Before touching the ranking: how often does the cap cut a gold term, what sits in the cap instead, and does any candidate policy fix this without the broad churn R758 measured?

## Evidence (before any code)

`qa/r759-cap.mts` — for every labelled ad, the full ranking (`extractKeywords(text, 200)`) against the top-30, with the corpus document frequency (`df`, out of 84 ads) of every term.

| overlay | gold terms cut by the cap | of those never extracted | in-cap non-STRICT terms | in-cap non-STRICT that are High | median df cut gold | median df in-cap fp |
|---|---:|---:|---:|---:|---:|---:|
| fixed gold | 5 | 1 (`mv`, Remote) | 299 | 149 | 11 | 17 |
| + R756 overlay | 6 | 1 | 340 | 177 | 6 | 16 |

The cut gold terms, all in the requirements block: Tailscale `saas` (rank 31, df 18) `html/css` (32, df 3); Reddit `rag` (51, df 2); Jedox `erp` (45, df 6) `english` (50, df 24); Remote `mv` (never counted — a one-letter-pair token). The cap is not the main error (299 in-cap false positives vs 5 cut gold), but the cut terms are exactly the kind of term a candidate is asked for by name.

`qa/r759-score.mts` — Tailscale's ranking, term by term. Ranks 30–32 are `b2b`, `saas`, `html/css`: `n = 1`, in the block, capitalised there, score `1 + NAMED_TERM_WEIGHT 1 + block 0.5 = 2.5`. Ranks 19–29 hold eleven `n = 2` block words at the same 2.5 (`designing`, `designers`, `minimal`, `environments`, `initiatives`, …) that were counted first because the ad says them first. The tie is decided by reading order, not by anything about the word.

A document-frequency gate was measured again and is rejected again: the medians differ (6–11 vs 16–17) but `english` (df 24) and `saas` (df 18) are cut gold terms with a higher df than most in-cap false positives; a gate that removes them removes true requirements at about the same rate as generic words (R755 / R756 / R758 result unchanged).

## Candidate policies (`qa/r759-policies.mts`, a debug copy of `ats.ts` with an env switch, deleted afterwards)

| policy | rule | fixed gold all (tp/fp/fn, F1) | R756 overlay all (F1) | 84 ads: set-changed / kw in+out / High in+out | 12 fresh ads |
|---|---|---|---|---|---|
| P0 current | score, then reading order | 230/206/17, 0.673 | 0.677 | — | — |
| P1 | `NAMED_TERM_WEIGHT` 1 → 1.5 | 226/197/21, 0.675 | 0.683 | 28 / +72 −72 / +70 −44 | 4 / +10 −10 |
| P1b | `NAMED_TERM_WEIGHT` 1 → 2 | 224/185/23, 0.683 | — | 34 / +108 −108 / +106 −76 | 4 / +13 −13 |
| P2 | equal score → curated skill or capitalised name first | 226/197/21, 0.675 | 0.683 | 28 / +70 −70 / +68 −42 | 4 / +10 −10 |
| **P3** | equal score → capitalised requirement name first | 226/197/21, 0.675 | 0.683 | 28 / +70 −70 / +68 −42 | 4 / +10 −10 |
| P4 | equal score → block word first, then skill | 226/197/21, 0.675 | 0.683 | 28 / +70 −70 / +68 −42 | 4 / +10 −10 |

P1 / P2 / P3 / P4 produce the same labelled result; P3 is the narrowest rule (no score changes, one comparator) and is the one taken forward. P1b buys F1 by pushing every named term above every twice-said word including curated-skill neighbours — larger churn for the same mechanism, not adopted.

## What P3 actually swaps (`qa/r759-diff.mts`, `qa/r759-ctx.mts`, `qa/r759-ctx2.mts`)

On the fixed gold P3 is flat (F1 0.673 → 0.675): it loses six labelled terms — Spotify `accessible` (R), Sporty Group `backend` (P), Reddit `targeting` (P), Think Academy `young` `learners` (R), Lakeshore `cloud` (R) — all lower-case words the ad says twice, once in the block — and gains Jedox `erp` (R) plus nine fewer G / S / E false positives. R758 stopped here and rejected an equal-score tie-break on these numbers.

This round read the source line of every word the tie-break brings in (24 on the labelled ads, 10 on the fresh ads), because they are unlabelled and therefore invisible to the metric:

| ad | enters (source line) | leaves |
|---|---|---|
| Spotify | `rest` `b2b` — "experience integrating frontend systems with APIs such as REST, gRPC, or GraphQL", "experience building enterprise or B2B applications" | `flows` G, `accessible` R |
| Sporty Group | `server-side` `rendering` — "Experience … with Nuxt.js or Server-Side Rendering (SSR) frameworks" | `line` G, `backend` P |
| Bayesian Health | `dna` — "Continuous improvement is in your DNA" | `frontline` |
| Tiens | `chinese` — "Chinese language skills are an advantage" | `germany` |
| Truelogic (UX) | `designer` (title), `u.s.-based` ("experience working with U.S.-based or global enterprise clients"), `english` ("Advanced English proficiency (C1–C2) is required") | `development` G, `organizations` G, `global` E |
| Reddit | `data/ml` `scientist` — "prior focus … data/ML platforms", "Prior professional experience as a … Data Scientist" | `passion` G, `targeting` P |
| Jedox | `erp` `claude` `chatgpt` — "hands-on use of AI tools (such as Claude, ChatGPT, Copilot …)" | `customer` S, `processes` G, `solutions` G |
| Think Academy | `elementary` `school` `child` `psychology` `english` `chinese` — "comfortable with U.S. Elementary School math content; Education, Child Development, Math Education, Psychology …", "Fluent, confident English instruction skills … in Chinese or bilingually" | `growth` G, `students` G, `professionally` S, `class` E, `young` R, `learners` R |
| U-Haul | `wpm` — "Ability to type while talking (40 WPM or higher is a plus)" | `assessments` E |
| Remote | `search` — "familiar with Computer Science topics, such as: Recursion, Sorting, Search, …" | `cover` G |
| Lakeshore | `computer` `science` — "Bachelor's degree in Information Security, Computer Science"; `additional` — "…moving fast Additional Information" (a heading glued to the previous line) | `got` G, `teams` G, `cloud` R |
| fresh Juniper Square | `standards` — "IFRS (International Financial Reporting Standards) a plus" | `technology` |
| fresh Klaviyo | `cdps` `kvs` `ai/analytics` — three requirement bullets; `boston` — "onsite role … in our Boston office" (a city; R757's place list covers countries / regions only) | `strategy` `roadmap` `define` `structured` — the looking-for sentence's duties |
| fresh LiveEO | `earth` `observation` `prefect` — "Remote sensing / Earth Observation experience", "workflow orchestration tools such as Prefect" | `structured` `coding` `large-scale` |
| fresh Truelogic (Visual) | `senior` `designer` — title words from the looking-for sentence | `agency` `brands` — "experience in a creative agency environment", "experience working with … brands" |

Labelled-ad entrants under the R752 rules: 21 of 24 are R / P / T, 3 are not (`dna` G, `u.s.-based` G, `additional` A). Fresh-ad entrants: 9 of 10 are R / P / T, 1 is E (`boston`). Leavers on labelled ads: 6 gold, 15 G / S / E; on fresh ads: 2 real requirements (`agency`, `brands`), 8 duty / generic words.

Across all 84 ads the same shape holds (`qa/r759-dump.mts` → `qa/r759-cmp.cjs`): the words entering are overwhelmingly names — `princexml weasyprint sile`, `pmhnp-bc cbt emr`, `gaap erp saas`, `ietf mls matrix`, `lustre beegfs s3-compatible`, `ollama`, `gis qgis arcgis`, `braze`, `crm`, `api` — with a handful of noise (`process`, `contribute`, `diversity equity inclusion belonging`, `technology`, `asia-pacific`, `comptes`); the words leaving are mostly repeated generic words (`tooling visual performance flows line technologies software complex industry stakeholders lead training`), with a few real ones (`n8n`, `tele-psychiatry`, the six above, and the licence-state abbreviations `ks de ia id mt sd` in the nurse ad).

## Labels added after the fact (`qa/r759-labels-add.mts`, `R759_EXTRA=1`)

The 24 labelled-ad entrants were labelled by reading their source lines **after** seeing which policy produced them. They are reported as a separate overlay so the fixed gold stays untouched and the reader can weigh the bias:

| labels | P0 (tp/fp/fn, P/R/F1) | P3 |
|---|---|---|
| fixed gold, dev | 147/129/10, 0.53/0.94/0.68 | 144/122/13, 0.54/0.92/0.68 |
| fixed gold, held-out | 83/77/7, 0.52/0.92/0.66 | 82/75/8, 0.52/0.91/0.66 |
| fixed gold, all | 230/206/17, 0.53/0.93/0.67 | 226/197/21, 0.53/0.91/0.67 |
| + R756 overlay, all | 262/229/21, 0.677 | 260/218/23, 0.683 |
| + R756 + R759 overlays, dev | 166/145/27, 0.53/0.86/0.66 | 179/140/14, 0.56/0.93/0.70 |
| + R756 + R759 overlays, held-out | 96/84/15, 0.53/0.86/0.66 | 102/81/9, 0.56/0.92/0.69 |
| + R756 + R759 overlays, all | 262/229/42, 0.53/0.86/0.66 | 281/221/23, 0.56/0.92/0.70 |

Read the fixed-gold row as the conservative result (flat), the last three rows as what the source lines say (+19 tp, −8 fp).

## Fix (`src/lib/ats.ts` only)

```ts
const byRank = (a, b) => b[1] - a[1] || Number(namedTerms.has(b[0])) - Number(namedTerms.has(a[0]))
core.sort(byRank)            // was: b[1] - a[1]
[...found.entries()].sort(byRank).slice(0, limit)
```

Scores, weights, the block parser, `namedTerms`, High-priority promotion and the `fill` path are unchanged. Only the order of equal-score terms changes: a word the requirements block writes with a capital (R756's `capitalizedRequirementTerms`, with R757's sentence-capital and place-name exclusions) now precedes a plain word with the same score. Inside the cap this is an order-only change (42 of 84 ads, 6 of 12 fresh ads change order only); at the cap boundary it decides which term is listed.

## Production

Gates: `tsc -p tsconfig.app.json`, `tsc -p worker/tsconfig.json`, `eslint src/lib/ats.ts src/lib/grounding.ts`, `npm run build`, `npm run verify-dist` — green. Deployed via `npm run deploy` (bundle `index-BwcihWGT.js`; Cloudflare Routes metadata `code 10000` reported as on every deploy — Worker + assets uploaded, production serves the new bundle). Production QA (`qa/r759-verify-ats.cjs`, `/ats-checker`, `qa/shots/r759/`): Tailscale ad at 1280 (30 keywords, High 25 incl. matched) and Jedox ad at 375 (30 / High 27) — keyword list and High set identical to the local build run the way the page runs it (`extractKeywords(text, 30)` with no company: `/ats-checker` has no company field); `saas` `html/css` / `erp` `claude` present and the displaced `designing` `designers` / `customer` `processes` `solutions` gone (`chatgpt` is rank 31 without the company context that the benchmark passes), 0 console errors, 0 horizontal overflow, storage back to baseline, 0 AI calls. Observed while verifying, not caused here: without a company field `/ats-checker` lists the employer's own name `jedox` as keyword #1 — `employerTokens(jd)` does not pick it up from this ad's text (candidate for R760).

## Boundaries

- The rule is capitalisation-based and English; a lower-case requirement the ad says twice (`accessible`, `cloud`, `backend`) now yields to a capitalised one it says once. Six labelled terms are lost on the fixed gold; the trade is stated above, not hidden.
- Named-term precision limits inherited from R756 / R757 now decide cap entries: a city said once (`boston`), a values phrase capitalised in a block (`Diversity, Equity, Inclusion and Belonging`), a glued heading (`Additional Information`) enter when they tie. These are R757-class issues (candidate for R760), not ranking issues.
- 24 labelled ads, one annotator, ±0.02 F1 ≈ one ad; the R759 overlay is post-hoc by construction.
- Cut gold that remains after this change: Reddit `rag` `targeting` (ranks 38 / 40 in a 76-term ad), Jedox `english` (32), Remote `mv`, Spotify `accessible`, Sporty `backend`, Think Academy `young` `learners`, Lakeshore `cloud`. The cap itself (30) is a product / benchmark constant and was not touched.

## Rejected

- Global document-frequency gate (fourth time): cut gold `english` df 24 / `saas` df 18 sit above the in-cap fp median.
- `NAMED_TERM_WEIGHT` 2 (P1b): +0.01 F1 for 34 changed ads and 108 keyword swaps — same mechanism, more churn.
- Skill-or-name tie-break (P2) and block-then-skill (P4): identical labelled result to P3 with a wider rule.
- Raising the cap: Tailscale ranks 33–41 are `customer high-quality content developer relations base range` — G / E.
