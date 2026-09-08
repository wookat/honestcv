# R756 — ATS keyword extraction: requirement names the ad says once (Figma, WCAG, GAAP, DEA, Excel, English)

Chain: R755 (#973) → this PR. Corpus (`qa/r751-rows.json`, 84 real ads), gold labels (`qa/r752-labels.mts`, 247 STRICT terms), 16 dev / 8 held-out split and the R752 category definitions are unchanged.

## Question

R755 left 18 held-out misses; 12 of them were terms `extractKeywords()` never listed at all (Figma, WCAG, iOS, Android, ERP, Excel, GAAP, DEA …), so `highPriorityKeywords()` never saw them. Why, and which extraction policy recovers them without letting generic or metadata words in?

## Evidence (before any code)

`qa/r756-lost.mts` runs the production extractor at limit 30 and 200 over every gold term the dev/held-out ads miss and classifies each miss; `qa/r756-context.mts` prints the ad line each term sits on and whether `requirementsBlockLines()` captured it.

| class | examples | count (dev + held-out) |
|---|---|---|
| counted, single mention, not curated → ranked in the `fill` tail behind every repeated word | `gaap excel english microsoft` (Remote #32), `figma wcag ios android` (Everway #37), `dea cds npi ancc malpractice` (Headway #16), `b2b saas html/css` (Tailscale #41), `slack crm` (Credit Wellness #63) | 21 |
| requirements block not found → no block bonus either | Headway "To join Headway's growing community, you are/have:" (sentence cue not recognised), Everway "Essential criteria / Desirable criteria" (heading not recognised) | 2 ads |
| counted ≥ 2 but displaced by the top-30 cut in a long ad | `rag targeting` (Reddit #52), `erp english` (Jedox #67) | 4 |
| dedupe artefact | `css` treated as already listed because `scss` contains it (substring test) | 1 |
| gold-policy / title terms | `lead platform licensed` | 3 |

So the dominant cause is ranking, not recognition: a curated skill said once scores `n + 2`, a non-curated name said once scores `1`, and every word the ad repeats twice outranks it. The curated list cannot enumerate GAAP, DEA, ANCC, WCAG, Figma, Slack …; what these terms share is that the ad writes them with a capital inside its requirements block.

## Policies measured (`qa/r756-measure.mts`, `qa/r756-all84.mts`)

Measured on dev gold, held-out gold, and the 84-ad keyword-list diff (entrants / leavers / High count), each against the R755 tree:

1. **Curated-list expansion** — adds only the names we already know; does not recover ANCC / DEA / CDS / NPI-class certifications. Rejected as the mechanism (kept as positive-only signal, as in R755).
2. **Global document frequency** as a cut — rejected in R755 (removes gold R terms at the same rate as generic ones); not re-tried as a gate.
3. **Capitalised requirement-block names as skills** (`namedTerms`): a word the block writes with a capital that is not the sentence's own, on a line that is not Title-Cased, joins `core` and gets a rank bonus. Weight sweep (`R756_SKILL` / `R756_NAMED`, measurement-only env vars, removed before commit):
   - skill 2 / named 1.5 — dev gold extracted 157 → 150 (named terms displace repeated gold words), rejected;
   - skill 3 / named 1.5 — dev 157 → 157, held-out 78 → 86, but 71 unlabelled entrants incl. `de ia id` (US state codes), `#li-hybrid`, `8g`, `2.5m`, `saturday tuesday april`;
   - **skill 3 / named 1** with fail-closed shape rules (≥ 3 characters, starts with a letter, not a calendar word) — dev 157 → 157, held-out 78 → 86, 1 unlabelled entrant (`computer` → labelled R in the overlay).
4. **Parser boundaries**: `criteria` heading (Essential / Desirable criteria), `(what) you'll / you will need`, and a `… you are/have:` sentence ending in a colon open a block. Recovers Headway and Everway; `requirementsBlockLines` now exported for the harness.
5. **Whole-word dedupe** (`containsWord`): `css` is no longer "already listed" by `scss`; `node` still is by `node.js`.

## Result (R755 tree → this tree, STRICT, production `extractKeywords` → `highPriorityKeywords`)

Original R752 gold (unchanged):

| set | before P / R / F1 (tp fp fn) | after P / R / F1 (tp fp fn) |
|---|---|---|
| dev (16) | 0.51 / 0.94 / 0.66 (147 139 10) | 0.53 / 0.94 / **0.67** (147 132 10) |
| held-out (8) | 0.46 / 0.80 / 0.59 (72 84 18) | 0.51 / 0.91 / **0.65** (82 79 8) |
| all (24) | 0.50 / 0.89 / 0.64 (219 223 28) | 0.52 / 0.93 / **0.67** (229 211 18) |

Held-out misses 18 → 8: `figma wcag ios android` (Everway), `gaap excel english` (Remote), `dea` (Headway), `css` (Sporty), `ai` (Remote) now extracted and High. Remaining held-out misses: `rag targeting` (Reddit, ranks 51 / 30 at limit 200 — long ad, top-30 ceiling), `erp english` (Jedox, ranks 44 / 49 — same), `lead platform licensed` (title / policy terms), `mv` (2-letter, excluded by the shape rule).

Measurement overlay (`qa/r756-labels-add.mts`, 72 labels for entrants the R752 gold never saw, merged only where the gold has no label; kept out of the repo and of the reported gold): before dev / held-out / all F1 0.63 / 0.55 / 0.60 → after 0.67 / 0.67 / 0.67. False positives by category (all 24): G 123 → 133, E 44 → 52, D 38 → 38, S 14 → 15, A 4 → 2. The 10 new G and 8 new E are single-mention capitalised words inside requirement lines (`number individual` in "NPI Number and Individual Malpractice Insurance", `united states`, `chromebooks ipads` in Credit Wellness's equipment note) — the price of promoting names the curated list cannot know.

84 ads (`qa/r756-all84.txt`): keyword lists change in 68, 260 terms enter, 191 leave, High 1529 → 1703. Read ad by ad: entrants are certifications / tools / standards / languages (`dea ancc npi cds`, `gaap ifrs`, `figma wcag`, `slack crm`, `mba mha`, `pqe`, `b2b saas`) plus the generic and metadata words above; leavers are repeated duty words (`process collaborate implement payment states software tools platform training`). Rejected entrants that motivated the shape rules: `de ia id` (states), `#li-la1 #li-hybrid` (LinkedIn tags), `8g 2.5m` (numbers), `saturday tuesday april` (schedules); `angula` is the ad's own typo ("Angula r").

Regression probes: R715 byte-identical; R709 — backendGo gains `dss` (PCI DSS), dataAnalyst / marketing / pm reorder only, nurse gains `iv` (IV therapy) and drops `medical/surgical` to #16; R753 — ClickUp gains `ngrx html/css`, Elixirr gains `gis`; all read as requirement names the ads state once.

## Not done / boundaries

- English capitalisation conventions: a German or French ad capitalises every noun, so the named-term route is muted there only by the Title-Case line guard.
- Long ads keep the 30-keyword ceiling; a single-mention name scores 2.5 and loses to any word repeated three times (Reddit `rag`, Jedox `erp`).
- 2-letter names (`MD`, `FE`, `MV`) are excluded on purpose; `qa ai ui ux pm` reach the list through the curated route.
- 24 ads / one annotator; ±0.02 F1 ≈ one ad. The overlay labels were written during this round by the same annotator and are reported separately, never merged into the R752 gold.
