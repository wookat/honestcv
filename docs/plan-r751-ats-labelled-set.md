# R751 — ATS keyword benchmark: a labelled set, and the "High priority" pool it exposed

## Question

R708–R734 improved keyword extraction on spot checks (~10 ads, 13 hand-picked word pairs).
No round measured precision/recall against labels. This round builds the first labelled
set from the 84 real ads retained in R723 (`qa/r723-jds.json`, Jobicy / Arbeitnow /
Remotive / The Muse — engineering, nursing, accounting, design, product, sales, teaching)
and asks: **which keywords does the builder tell the user to prioritise, and are they
requirements?**

## Corpus normalisation

The R723 corpus is raw feed HTML (pre-R724). Scripts mirror production `htmlToText`
(`worker/index.ts`: entity-encoded markup decoded first, `<li>` → `• `, block ends → `\n`,
tags stripped, double-decoded entities) so the text is what production scores today.
Two artefact classes survive normalisation and were confirmed in production rows:

- **Lone bullet markers** — `•` alone on its line, the item on the next (16/84 ads:
  ClickUp, Bayesian Health, Headway, Affirm, intercom, Instructure, …). Every list line
  therefore failed the list-item test and a `•` line passed the heading test.
- **Editor / Office artefacts** — Proton's `Lexical__h3 / textBold / listitem`,
  Wunderman Thompson's `span nbsp data-contrast data-ccp-props`. These are extraction
  keywords in production today; out of scope here (extraction, not prioritisation).

## Measurement (before)

`qa/r751-measure.mts` / `qa/r751-why.mts` on the 84 normalised ads, production code:

| metric | value |
|---|---|
| keywords per ad | 28.9 |
| **High priority** per ad | 24.2 (**84 %** of keywords) |
| ads where *every* keyword is High priority | 28 / 84 |
| ads ≥ 80 % High priority | 61 / 84 |
| High by repetition ≥ 3 | 1343 / 2033 |
| High only by "requirements block" | 554 |
| High only by first line | 56 |

Why: `REQUIREMENTS_HEADING_RE` matched the heading words *anywhere in a line*
(`/^.*\b(requirements|…|you bring|experience…)\b.*$/im`) and the block ran **to the end of
the ad**. In 62/84 ads the "block" started at a duty sentence ("…you bring genuine
curiosity to the product…", Meta's opening paragraph) and swallowed responsibilities,
benefits and EEO text (avg 58 % of the ad). Repetition was counted over the whole ad, so
benefits / privacy / scam-notice vocabulary (`privacy personal details contact travel
events holidays policy`) qualified. Ads that open with an "At Acme, we're transforming…"
paragraph had that paragraph treated as the title line.

## Labels

Five ads across domains (ClickUp frontend, Thriveworks psychiatric NP, Bayesian Health
ML, Fivetran accountant, Varicent multimedia designer) labelled by hand: a keyword is a
**requirement** when the ad names it under its requirements / qualifications / "what you
bring" heading or as a hard skill in the duties. Company products, benefits, legal and
recruitment text are not. Labels live in `qa/r751-after.mts`; they are the author's, not
adjudicated (see limits).

## Change (`src/lib/ats.ts`, client only)

1. `normalizeAd` (was `withoutRepeatedParagraphs`): rejoins a lone bullet marker to the
   line it introduces before anything else runs.
2. `isHeadingLine` requires a letter; `splitBoilerplate` also learns the corpus headings
   (`What we give`, `Overview of Benefits`, `Pay & Benefits`, `EEO statement`,
   `Accommodations`, `AI Processing Notice`, `Visa sponsorship`) and moves **unheaded**
   boilerplate paragraphs (equal-opportunity, "without regard to", recruitment-scam /
   "will only email", privacy policy, visa sponsorship, "protected veteran") to the
   employer side; a notice line ending in `:` takes the list under it with it.
3. `requirementsBlock` is **section-bounded**: opened by a heading matching the
   requirements vocabulary (extended with the corpus: `Skills we're looking for`,
   `What we need`, `Required`, `Experience`, `Skills`, `Tech stack`, `Nice to have`,
   `Preferred`, `Votre profil`, …), by an inline `Requirements: …` label, or by a
   profile-opening sentence (`You bring…`, `You have…`, `We're looking for…`); closed by
   the next heading that is not a nice-to-have sub-heading, by a boilerplate heading, or
   by the first prose paragraph after its list (the EEO paragraph with no heading).
   Every requirements section counts (Minimum + Preferred).
4. `highPriorityKeywords`: requirements block and title first; then the term must occur
   where the ad describes the **job** (boilerplate stripped) and be a phrase, a skill, or
   repeated ≥ 3 times there (still excluding `COMMON_AD_WORDS`). The title rule applies
   only when the first line is short (≤ 12 words / 100 chars).

`extractKeywords` inherits 1–3 through the shared helpers (requirements terms still get
+0.5, boilerplate words are still excluded from ordinary counting).

## Measurement (after), same corpus, same scripts

| metric | before | after |
|---|---|---|
| keywords per ad | 28.9 | 28.0 |
| High priority per ad | 24.2 | 21.1 |
| High share | 0.84 | **0.75** |
| ads where every keyword is High | 28 | **9** |
| ads ≥ 80 % High | 61 | 44 |
| ads with 0 High | 1 | 1 |

Labelled five ads (High-priority set vs labels; keywords that left the pool are
unlabelled and excluded):

| | tp | fp | fn | precision | recall |
|---|---|---|---|---|---|
| before | 68 | 67 | 5 | 0.50 | 0.93 |
| after | 60 | 26 | 13 | **0.70** | 0.82 |

Keyword lists changed in 71/84 ads (260 out / 183 in). Out: `privacy personal details
philippine contact questions` (ClickUp AI-processing notice), `gender status laws
protected` (EEO), `holidays policy coworking lunches equipment` (benefits), `events
travel` (Perk). In: `gcp figma redis python cpa gdpr cybersecurity` and ordinary words
that moved up as the boilerplate words left.

Recall lost (13 fn): Fivetran's `audit close deadlines tax filings invoices` are in
**What You'll Do**, not `Skills We're Looking For` — the block is right and the label
policy ("hard skill in the duties") is what disagrees; ClickUp `reusable performance`
and Bayesian `productionizing real-time` are single-mention duty words. Remaining false
positives are function words *inside* requirement bullets (`teammates modern clinicians
complete guidelines tools code systems methods`) — block membership is word-level.

Regression probes unchanged or improved: R708 golden JD 88 % / missing `graphql next.js`
byte-identical; R709 five short ads — data analyst now also prioritises `tableau
snowflake` (skills in the duties), marketing's `You have 5+ years…` sentence now opens
the block (`hubspot seo figma looker braze copywriting` High, was only `growth marketing
manager` from the title); R733/R734 Perk — `travel` (benefits) leaves High, `events squad`
stay.

## Limits — what this does and does not establish

- 5 labelled ads / 73 positive labels, one annotator, no adjudication; the label policy
  (duties' hard skills count, duty verbs don't) is stated, not agreed. The numbers are a
  direction, not a benchmark.
- Word-level: a requirement bullet's function words are High with its skills.
- English headings only (plus `Votre profil`); ads with no heading, no inline label and
  no profile sentence get no block (11/84) and fall back to title + skill + repetition.
- `You are …` opens a block and can catch a duty sentence written in the second person.
- A ≥ 8-word non-list line matching the boilerplate paragraph vocabulary is treated as
  boilerplate wherever it sits (a duty line such as "Maintain the privacy policy…" would
  be misfiled).
- Editor / Office artefacts in two ads are still extraction keywords (Proton, Wunderman
  Thompson) — extraction, not this round.
