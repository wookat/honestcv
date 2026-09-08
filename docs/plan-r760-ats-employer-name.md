# R760 — `/ats-checker` without a company field: the ad's own name for the employer is not a keyword

Chain: R759 (#977) → this PR. Corpus (`qa/r751-rows.json`, 84 real ads) + 12 fresh out-of-sample ads (`qa/r758-oos.json`), gold labels (`qa/r752-labels.mts`), 16 dev / 8 held-out split, the R752 category definitions and the 30-keyword ceiling are unchanged. All numbers below are from `qa/r760-audit.mts` (a debug copy of `ats.ts` that exports `employerTokens`, deleted afterwards) and `qa/r760-dump.mts` + `qa/r759-cmp.cjs`.

## The question

R759 saw `jedox` as keyword #1 on `/ats-checker`, which has no company field. R725 removes the employer from the keyword list only when the caller passes the company (jobs feed / builder); from the ad text alone `employerTokens()` recognised four shapes (`About Acme`, `At Acme,`, `Acme is a…`, `Join Acme`), took the first match and stopped. How often does the employer leak into the top-30 without a company, why, and can the inference be widened without capturing product names, agencies or role words?

## Evidence (before any code)

96 ads (84 fixed + 12 fresh), `extractKeywords(text, 30)` with no company, against the feed's company field:

| | ads where inference names the feed company | inference names something else | inference finds nothing | employer token in top-30 | as keyword #1 |
|---|---:|---:|---:|---:|---:|
| baseline (R759 tree) | 52 | 9 | 35 | **19** | 3 (`jedox`, `affirm`, `sumup`) |

The 35 misses read at their source line: `What is Jedox? Jedox is a global leader…`, `Affirm is reinventing credit…`, `About the Product Manager role at Headspace`, `Fortive Corporation Overview`, lower-case brands the capital-led pattern never sees (`iwoca`, `saas.group`, `koppla`), `Here at Creative Force…`, `Bayesian Health's mission…`, `Think Academy Online is seeking…`; two ads introduce the employer only after a stopped-at first match.

A capitalisation-only heuristic ("the capitalised word the ad repeats most") was measured and rejected: 59 right / 32 wrong / 5 none.

Candidate patterns (`qa/r760-infer2.mts`, first match across all patterns): 66 right / 11 "wrong" / 19 none. The 11 read at their source line are **all the ad's own name for the hiring entity** — the feed field is the parent, the agency or the board: `UpLift` (feed: BetterHelp), `Knit` (feed: recruiter Eleve Talent), `General Assembly` (feed: Remote), `Primer` (Primer.io), `WPP Enterprise Solutions` / `VML` (feed: legacy Wunderman Thompson slugs), `Fin` (Intercom's product brand, "Fin is the AI Customer Agent company"), `Instagram` (Meta team ad, "Instagram is building…"), `Accruent` (Fortive subsidiary), `Helios Software Group` (Valsoft subsidiary), `Headway` (Headway.co). None is a requirement.

Two real false captures did appear and shaped the rule: `Think Academy Online is seeking…` yields `online` (the ad says "online" 3× in lower case as a plain word) and `At PM Pediatric Care, we…` yields `care` (a real keyword in a paediatric-care ad, 4× lower case vs 2× in the name).

## Fix (`src/lib/ats.ts` only)

- `EMPLOYER_HEADING_RES` — section titles that name the employer; **every** match counts: `About Acme`, `What is Acme?` / `Who is acme?`, `About the … role at Acme`, `Acme (Corporation|Company)? (Overview|Description|Introduction)`.
- `EMPLOYER_PROSE_RES` — prose that introduces the employer; the **first acceptable** match counts (a match whose words are all section words / skills is skipped instead of ending the search): `At Acme,`, `at acme, we|our|you` (lower-case brands), `Acme is a|an|the|one|on a mission|building|looking|hiring`, sentence-initial `Acme is <verb>ing|your|proud`, `Acme (…)?, is|are seeking|hiring|looking for|recruiting|searching for`, `Join|Life at|Working at|Why Acme`, `we built|created|founded|started|welcome to|here at acme`, `Acme's mission|vision|purpose|culture|values`.
- `employerNameTokens(name, jd)` — a matched name yields no tokens if any word is a section word (`role team company our profile working here …`); otherwise its words that are ≥ 3 letters, not a stopword, not a known skill, **and that the ad writes capitalised more often than in lower case** (a word the ad only ever writes in lower case passes — that is the `iwoca` case). This is what keeps `care` and `online` in the list while `Academy`, `Headway`, `Fortive` leave it.

## Results

| | names feed company | names the ad's own entity | nothing | employer in top-30 | #1 |
|---|---:|---:|---:|---:|---:|
| baseline | 52 | 9 | 35 | 19 | 3 |
| **R760** | **69** | 11 | **16** | **6** → 5 (the 6th is `care`, kept on purpose) | 1 (`sumup`) |

Remaining 5: DiliTrust (`Vision: As a leading SaaS provider, DiliTrust is a global company` — mid-sentence), TIENS (`The TIENS Group Co., Ltd. is a…` — article-led), Meta (PM ad never introduces Meta), Intercom (product-first ad; `Fin` is inferred, `Intercom helpdesk` stays), SumUp (Bulgarian-language ad). Left alone: each needs a pattern that would also match ordinary sentences.

Fixed R752 gold (company passed, as the harness does): **identical** to R759 — dev 144/122/13, held-out 82/75/8, all 226/197/21 (F1 0.67). The employer path only removes tokens; with the company given the only differences are Meta #40 `instagram` → `side` and Valsoft #85 `group` entering (1 + 1 ads of 96).

Without a company (`/ats-checker` path), 84 fixed ads: 16 lists change (kw +11 −16, High +6 −11, High 1707 → 1702); 12 fresh: 2 change. Every leaver is an employer token (`headspace headway bayesian saas.group instagram force fortive jedox affirm academy ×6 iwoca`) plus `board` (PM Pediatric Care, displaced by `care`); the refills are `belonging credentialing care productionizing saas side tech crm chatgpt support tutoring group landing`.

## Boundaries

- English introduction shapes; a company that only appears mid-sentence, after an article, inside a product-first pitch, or in a non-English ad is still not inferred.
- The capitalised-more-often test is per ad: a brand the ad also uses as a plain word more often than as its name (`care`) stays a keyword by design.
- "The ad's own entity" (subsidiary, product brand, team) is removed together with the parent when the feed also passes the company — `instagram` on a Meta ad; this is the intended reading of R725 ("employer's name") but it is a change for those ads.
- No parser, score, weight, High or cap change; the R752 gold is untouched.
