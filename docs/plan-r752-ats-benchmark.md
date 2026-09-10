# R752 — ATS High-priority benchmark: annotation rules, 24 labelled ads, category metrics

Follow-up to `plan-r751-ats-labelled-set.md`. R751 shipped a requirements-section parser
and measured it on 5 hand-labelled ads. This round writes the labelling rules down,
labels 24 stratified ads (16 dev / 8 held-out), measures the production functions
(`extractKeywords` → `highPriorityKeywords`) against them per category, and changes the
parser only where a labelled or corpus-wide defect was traced to a specific cause.

Everything below was measured with `qa/r752-labels.mts` (labels + metrics, run with
`npx tsx --tsconfig tsconfig.app.json`, `R752_SET=dev|test|all`) over
`qa/r751-rows.json` (the 84 R723 ads normalised with the production `htmlToText` mirror).

## Annotation rules (one annotator, applied to the candidate union of R751-baseline and current keywords)

Every candidate keyword of an ad gets exactly one category:

| cat | meaning | examples |
|---|---|---|
| R | hard skill / tool / domain / qualification stated in a requirements section (heading, inline label, or "You bring …" sentence) | `ifrs`, `cpa`, `solidity`, `pmhnp-bc`, `3+ years` terms |
| P | the same, stated under a preferred / nice-to-have / bonus heading or phrase | `us gaap` under "Nice to have" |
| T | role-defining term from the title | `frontend`, `nurse`, `security` |
| S | soft skill / trait stated in a requirements section | `communication`, `ownership`, `proactive` |
| D | hard skill / tool named only in duties / responsibilities / tech-stack prose, not in a requirements section | `tableau` in "You will build dashboards in Tableau" |
| G | generic / function / descriptor word wherever it appears | `clear`, `complex`, `impact`, `modern`, `stack` |
| E | employer, location, benefits, compensation, schedule, legal, scam notice, feed metadata | `philippines` (office), `401k`, `weekend`, `rights` |
| A | artefact: feed token, entity fragment, or a multi-word tool split by the tokenizer | `gh`, `actions` (from "GH Actions"), `#x26`, `indrll1` |

Adjudication rules written before this round's parser edits:

1. **Section wins over wording.** A term is R/P/S if the ad places it under a requirements
   heading (or the equivalent inline label / opening sentence), whatever the grammar of the
   bullet. The same term named only in duties is D. This is the rule the parser implements,
   so the labels measure the parser, not a different theory of "requirement".
2. **Preferred is P, never R.** Whether P counts as High is a policy choice (see below), so
   it is kept separate in the labels.
3. **Title terms are T** even when repeated in requirements (`nurse` in a nurse ad).
4. **Soft skills stated as requirements are S**, not G — "communication skills" is a
   requirement the ad wrote down; "clear" is not.
5. **Relevant-but-not-stated is not gold.** A skill the role obviously needs but the ad
   never names is not labelled at all (it cannot be a candidate).
6. **Phrases are labelled as phrases** (`smart contract`, `financial analysis`); their
   component words are labelled on their own only when they also appear alone.
7. **Metadata is E** regardless of section: `Location: Berlin` / `Job Type: Full-Time` /
   pay / hours / weekend availability, even inside a "Scheduling Requirements:" section.
8. **Legal / EEO / scam text is E**, and any word whose only occurrence is there is E.
9. **Ambiguous terms follow the ad's usage** (`design` in a design-role requirements bullet
   is R; `design` in "help design the roadmap" is G). Employer and product names are E.
10. **Artefacts are A only when they are not the ad's own vocabulary**: `gh actions` is the
    ad's abbreviation of GitHub Actions and is labelled A because the tokenizer split the
    tool, not because the feed corrupted it; `indrll1` (an Indeed tracking token pasted
    into the body) and `#x26` (an undecoded entity) are A because the user never sees
    them as words.

Three policies are derived from the categories — none of them changes the code:

- **STRICT** gold High = R ∪ P ∪ T
- **SOFT** = STRICT ∪ S
- **DUTY** = SOFT ∪ D

## Corpus and label set

- 84 ads normalised as production does (`qa/r751-measure.mts`), raw kept alongside.
- 24 labelled ads, stratified by job family and artefact class: engineering (Koppla,
  Spotify, CertiK, Roofr, Tailscale, Meta, Reddit, Solace, Fortinet, Jedox, Remote ×2),
  design (Everway), finance/data (Sporty Group, Bayesian Health), healthcare (Headway,
  BetterHelp), sales/ops (Tiens, Credit Wellness, U-Haul), education (Think Academy),
  IT security (Lakeshore), plus SumUp (no recognisable block), Truelogic (Lexical
  artefacts). Dev set = 16 ads (indexes 3 6 10 14 17 25 41 46 50 56 61 63 70 76 80 83),
  held-out test = 8 (8 11 16 32 37 52 67 82).
- 247 STRICT gold terms (R 171 / P 47 / T 29), 26 S, 49 D.

## Measurement

"before" = production before R751 (High snapshot stored in `r751-rows.json`);
"R751" = this branch's HEAD; "R752" = this PR. All 24 ads unless stated.

| policy | version | tp | fp | fn | precision | recall | F1 |
|---|---|---|---|---|---|---|---|
| STRICT | before | 193 | 362 | 54 | 0.35 | 0.78 | 0.48 |
| STRICT | R751 | 217 | 309 | 30 | 0.41 | 0.88 | 0.56 |
| STRICT | **R752** | 226 | 296 | 21 | 0.43 | 0.91 | 0.59 |
| SOFT | before | 213 | 342 | 60 | 0.38 | 0.78 | 0.51 |
| SOFT | R751 | 239 | 287 | 34 | 0.45 | 0.88 | 0.60 |
| SOFT | **R752** | 248 | 274 | 25 | 0.48 | 0.91 | 0.62 |
| DUTY | before | 252 | 303 | 70 | 0.45 | 0.78 | 0.57 |
| DUTY | R751 | 278 | 248 | 44 | 0.53 | 0.86 | 0.66 |
| DUTY | **R752** | 286 | 236 | 36 | 0.55 | 0.89 | 0.68 |

Held-out test set only (8 ads, not looked at while editing the parser), STRICT:
R751 P 0.41 / R 0.80 / F1 0.54 → R752 P 0.42 / R 0.80 / F1 0.55. Dev: 0.57 → 0.61.
The gain is small and mostly on dev; it is not evidence of a large improvement, only
that the edits did not overfit into a loss.

Recall by gold category (R752, STRICT): R 159/171, P 43/47, T 24/29, S 22/26, D 38/49.

False positives by category (R752, STRICT, 296 total): **G 182**, E 50, D 38, S 22, A 4.
Remaining false negatives (21): `R:not-extracted` 9 (the keyword never reached the list,
e.g. a phrase the tokenizer splits), `T:not-high` 5, `R:not-high` 3, `P:not-extracted` 3,
`P:not-high` 1.

By the route that made a term High (R752, STRICT false positives):

| route | G | E | D | S | A |
|---|---|---|---|---|---|
| requirements block | 117 | 19 | 6 | 17 | 2 |
| repeat ≥ 3 in job text | 50 | 19 | 18 | 3 | 2 |
| title line | 8 | 10 | 9 | – | – |
| curated skill / phrase | 4 | 2 | 5 | – | – |

So the dominant error is **not** section detection any more: 117 of 182 generic false
positives sit inside a correctly found requirements block (`stack impact taking grow full
contribute code fit systems workflows complex data modern …`). Word-level membership of a
requirement bullet is the wrong unit; the next step is term-level (which words in a
requirement bullet are the requirement), not another heading regex.

## Error taxonomy — what each finding is

| finding | class | decision |
|---|---|---|
| Credit Wellness #63: "We are looking for team members who are:" + bullet list of traits/tools not treated as a block | **parser defect** (sentence rule required a skill cue; a colon-terminated opener introduces the list) | fixed: an opener ending in `:` starts a block |
| Koppla #3 / CertiK #10 / Everway #37 / Pleo #27 / Proton #51: "We are looking for a Frontend Engineer in Berlin…" intro (no cue) opened a block that ran through the employer story | **parser defect** | fixed: a sentence-opened block is that sentence plus its list, closed by the first non-list line; opener needs a requirement cue or a colon |
| CertiK #10: `Requirements` glued to the end of the last responsibility bullet (feed dropped the line break) | **corpus-cleaning defect visible to the user** (the ad reads that way in the UI too) | fixed narrowly: `splitGluedHeading` splits a known section title glued to the paragraph after it or list item before it (Title-Case, ≤5 words, closed list of titles) |
| Headspace #15 (found by the 84-ad before/after diff, not by the labels): the glued-heading splitter cut `About the` off `About the Part-Time 1099 Psychiatric Nurse Practitioner Contractor role at Headspace`, the R725 boilerplate rule then dropped the whole intro incl. "seeking a licensed psychiatric nurse practitioner" | **regression introduced this round** | fixed: the `about <name>` form excludes function words (`about the/a/an/our/this/your`); Headspace back to byte-identical with R751 |
| U-Haul #80: block runs from "Requirements" through `Scheduling Requirements:` / `Work From Home Requirements:` / `Technical Requirements:` into `Roadside assistance is open 24/7/365…`, `must be available on the weekend` | **policy disagreement, not a parser defect** — the ad titles those sections "…Requirements" and the parser follows section titles by rule 1; the labels call schedule/equipment E by rule 7 | not changed. `Perks of joining the U-Haul Team!` now closes the block (a `!`-terminated short line is a heading) so compensation/benefits no longer ride along; the three "Requirements" sections stay in, deliberately |
| Instructure #31: `philippines` High from "CPA license (Philippines) is strongly preferred" | policy disagreement (labelled E as a location; the ad states it as a licence qualifier) | not changed |
| `gh`, `actions` (Koppla) | A — tokenizer splits the ad's own "GH Actions" | not changed (1 ad; adding an alias for one abbreviation is not evidence-backed) |
| `src` (Fortinet title line) | A — file-path token in a pasted tech list | not changed |
| `#x26`, `&#39;`, `&mdash;` in live feed bodies | **feed-cleaning defect** | fixed in `worker/index.ts`: numeric (dec/hex) entities and 14 common named entities decode; invalid code points (surrogates, `&#0;`) are left as-is |
| Arbeitnow trailing `Find Jobs in Germany on Arbeitnow` | feed footer counted as ad text | fixed in `worker/index.ts`, narrow suffix match |
| `indrll1` (Lakeshore) | A — Indeed tracking token pasted into the ad body by the employer | not changed; it is in the ad the user reads too |
| `Location: Berlin (Hybrid)` / `Job Type: Full-Time (W2)` lines counted as job vocabulary | corpus rule gap | fixed: `METADATA_LABEL_RE` routes such lines to boilerplate (skills named there still count, as everywhere in boilerplate) |
| `401(k)` / `dental insurance` / `paid time off` / `employment eligibility` paragraphs without a heading | corpus rule gap | fixed: added to `BOILERPLATE_PARAGRAPH_RE` |
| Remotive attribution in the /jobs intro | not an ATS question | unchanged; tracked in the queue |

## Change (`src/lib/ats.ts`, client only; `worker/index.ts`, feed cleaning only)

- `requirementsBlock`: a `REQUIREMENTS_SENTENCE_RE` opener starts a block only with a
  requirement cue (`\d+ years`, experience, proficien-, degree, fluen-, knowledge,
  background, skill, certif-, licens-, qualif-) **or** a trailing colon; a block opened by a
  sentence closes at the first non-list line. Heading labels shed a trailing `!` as well as
  `:`; a `!`-terminated short line can be a heading; a line beginning `#` is not.
- `normalizeAd` → `splitGluedHeading`: closed list of section titles (`GLUED_HEADING_RE`),
  Title-Case guard, ≤5 words, never splits an inline `Label: content` line.
- `splitBoilerplate`: `METADATA_LABEL_RE` lines are boilerplate; four benefit/legal cues
  added to `BOILERPLATE_PARAGRAPH_RE`.
- `normalizeAd` and `requirementsBlock` are exported for the benchmark harness (pure
  functions, no UI use). `splitBoilerplate` stays module-private.
- The R752_MODE capitalisation/repetition experiment was tried and removed: STRICT F1
  0.59 at both settings with recall 0.74–0.77, i.e. no gain (numbers in the PR).
- An ESCO / O*NET lookup as a High filter was tried and not adopted: the API returned
  500 for a share of terms and, where it answered, it accepted generic English (`impact`,
  `design`) as often as it rejected artefacts.

Corpus-wide effect (84 ads, R751 → R752): keyword lists changed in 23 ads, High sets in
21, High share 0.753 → 0.742, High count 1772 → 1739. Every changed ad was read: the
removals are intro-paragraph words (`berlin construction industry environment truly`,
`business development capital investors`, Everway's seven intro paragraphs), the additions
are CertiK's real qualification list (`solidity`-adjacent `parsing type theory llvm smart
contract`) and Credit Wellness's trait list. R709's five short probes and R734's Perk
probe are unchanged.

## Limits — what this does and does not establish

- One annotator; no inter-annotator agreement. The rules are written so a second pass can
  disagree per rule rather than per term.
- 24 ads / 247 gold terms; the held-out set is 8 ads. Differences of ±0.02 F1 are within
  what one ad can move.
- Category "precision" is reported as the composition of false positives (which category
  they fall in), since a predicted High either is or is not gold; per-gold-category recall
  is the meaningful per-category number.
- The gold follows the ad's sections (rule 1). An ATS that reads duties as requirements
  would score the DUTY policy; this app shows D terms as ordinary keywords, not High, and
  the labels do not decide which is right for users.
- English-only headings and cues; 11/84 ads have no recognisable block and get High only
  via title / repetition / curated skills.
- The Worker entity/footer changes were verified on synthetic strings (`/tmp` probe in the
  PR) and by re-reading the live-feed residues that motivated them, not on a re-fetched
  corpus.
- Real Word / Google Docs / Canva PDF import sampling is still not done (unrelated to ATS;
  carried in the queue).

## Next

Term-level High inside a requirement bullet: 117 G false positives sit in correctly found
blocks. Candidates to measure on this labelled set before writing code: document frequency
across the 84 ads (words appearing in > N ads are ad-generic), head-noun position in the
bullet, and the curated skill list as a positive signal only. The ESCO experiment says a
taxonomy alone is not enough.
