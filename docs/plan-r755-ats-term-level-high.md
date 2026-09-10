# R755 — ATS High priority: a word in a requirement bullet is not itself a requirement

## Question

R752 left the requirements-section parser as the *minor* error source: of the 182 generic (G) High-priority
false positives on the 24 labelled ads, 117 sat inside a correctly found requirements block. `highPriorityKeywords`
promoted every keyword that appeared anywhere in the block, so the bullet

> You have experience building enterprise or B2B applications with complex workflows, permissions, and large datasets

made `complex`, `permissions`, `large` High along with the things it asks for. The plan of record
(`docs/plan-r752-ats-benchmark.md`) said: measure document frequency, head-noun / bullet position and the curated
skill list as a positive-only signal **on the labelled set before writing code**.

Corpus, split, labels and category rules are R752's, unchanged: 24 ads (16 dev / 8 held-out), 247 STRICT gold terms
(R ∪ P ∪ T), `qa/r752-labels.mts` over `qa/r751-rows.json`. Nothing was relabelled.

## Evidence

### Document frequency does not separate generic words from requirements (rejected)

`qa/r752-df.mts`: DF over the 60 unlabelled ads, applied as a filter to High terms inside the block on the 24
labelled ads. At every threshold it removes about as many gold R terms as generic ones:

| DF threshold | G removed | R removed | examples of gold lost | precision of what remains |
| --- | --- | --- | --- | --- |
| ≥ 0.15 | 80 | 43 | `finance accounting compliance sales design identity access` | 0.61 |
| ≥ 0.30 | 42 | 23 | `care medical financial ai sales tools data management` | 0.52 |
| ≥ 0.50 | 12 | 12 | `ai data sales product development management` | 0.49 |

`ai`, `data`, `sales`, `design`, `security`-class words are frequent across ads *because* they are frequent
requirements. DF is not used in production.

### Per-hit features on the block (`qa/r755-feat.mts`, dev set, 272 block hits)

For every keyword that is in a correctly found block, which of these hold on at least one of its lines:

| signal | keeps (R/P/T) | keeps (G) | drops (R/P/T) | precision alone | recall of block gold |
| --- | --- | --- | --- | --- | --- |
| all block hits (R752 behaviour) | 137 | 91 | 0 | 0.50 | 1.00 |
| `cue` — within 8 tokens after "experience with / knowledge of / degree in / ability to / experience building …" | 53 | 8 | 84 | 0.83 | 0.39 |
| `short` — the line has ≤ 6 tokens (a list item of its own) | 20 | 2 | 117 | 0.74 | 0.15 |
| `skill` — curated `looksLikeSkill` | 25 | 0 | 112 | 1.00 | 0.18 |
| `cap` — written with a capital that is not the sentence's own | — | — | — | high | low |
| `phrase` — multi-word keyword | — | 0 | — | 1.00 | low |
| **union: cue ∨ short ∨ cap ∨ phrase ∨ skill** | 93 | 18 | 44 | 0.73 | 0.68 |

Held-out (8 ads): the same union keeps R 41/45, P 12/13, T 2/3 and drops G 29/39 (precision 0.80, block recall 0.90).

The curated skill list is a clean positive signal (0 generic terms in either split) but covers 18 % of block gold;
it must not be the gate. Position-at-bullet-head (`lead`) added nothing over `cap` + `short`. Reading the 44 dropped
dev gold terms line by line (`qa/r755-lost.mts`) gave the cue nouns the first regex lacked — `foundation in`,
`ability to`, `interest in`, `comfort working`, `experience building` (gerund object), `expertise (payments, …)` —
and showed the sentence-initial capital had to be excluded (`Continuous learner` is not a product) while a capital
anywhere else in the token (`SaaS`, `ERP`, `SharePoint`, `iOS`) is.

### The R709 short-ad case

The five R709 fixtures (`qa/r709-probe.mts`) are inline `Requirements: active RN license, BLS and ACLS
certification, 1+ year acute care experience …` lines. None of the per-line signals fire there (one long line, cue
nouns *after* their objects), and the first cut lost `license certification acute assessment therapy wound`.
The ad itself labels that line a list of requirements, so the parser now marks the remainder of an inline
`Requirements:` label as `listed` and every keyword on it counts. Neutral on the 24 labelled ads (none uses the
inline form), restores the R709 fixtures exactly.

### Tried and not kept

| variant | dev F1 | held-out F1 | why not |
| --- | --- | --- | --- |
| cue window 5 instead of 8 | 0.64 | 0.58 | loses `parsing`, `languages` at the end of long objects |
| exclude `COMMON_AD_WORDS` from cue acceptance | 0.66 | 0.58 | no held-out gain, adds a list to maintain |
| postpositive cue (`<term> experience / certification / skills`, ≤ 3 tokens before) | 0.66 | 0.59 | dev +1 tp / +3 fp, held-out unchanged; the R709 case is covered by `listed` |
| DF filter (any threshold) | — | — | table above |

## Change (`src/lib/ats.ts` only)

```ts
type RequirementLine = { text: string; listed: boolean }   // listed = rest of an inline "Requirements:" line
function requirementsBlockLines(jd): RequirementLine[]      // case preserved; requirementsBlock() unchanged for callers

// highPriorityKeywords, block path:
if ((phrase ? reqBlock.includes(kw) : reqTokens.has(kw)) && namedAsRequirement(kw, reqLines)) high.add(kw)

function namedAsRequirement(kw, lines): boolean
  phrase or looksLikeSkill(kw)                          → true
  a line containing kw with ≤ 6 tokens, or listed       → true
  kw written with a capital that is not the sentence's  → true   (SaaS, ERP, SharePoint, Figma; not "Continuous …")
  kw within 8 tokens after REQUIREMENT_CUE_RE           → true   (experience with · knowledge of · degree in ·
                                                                   ability to · interest in · experience building · expertise ( …)
  otherwise                                             → false  (stays a keyword, not High)
```

Nothing else in the High order changes (title line → phrases / skills in the job section → repetition in the job
section). Keyword extraction is untouched: keyword lists are byte-identical on all 84 ads.

## Results

STRICT (R ∪ P ∪ T), `qa/r752-labels.mts`, HEAD (R754) vs this change:

| set | before P / R / F1 | after P / R / F1 |
| --- | --- | --- |
| dev (16) | 0.44 / 0.98 / 0.61 | 0.51 / 0.94 / **0.66** |
| held-out (8) | 0.42 / 0.80 / 0.55 | 0.46 / 0.80 / **0.59** |
| all (24) | 0.43 / 0.91 / 0.59 | 0.50 / 0.89 / **0.64** |

- False positives by category, all 24 ads: G 182 → 123, S 22 → 14, E 50 → 44, D 38 → 38, A 4 → 4
  (dev G 115 → 70, held-out G 67 → 53). The generic words that remain are mostly outside the block
  (title line, repetition in the job section), which this round does not touch.
- Recall lost on dev: 7 R + 3 P — `accessible` ("You care deeply about creating … accessible user experiences"),
  `quarterly` (parenthetical after `reporting`), `systems` ("systems-thinking skills"), `risk` ("communicate
  security risks"), `training` ("teacher training experience" — postpositive), `backend` as a category label
  (`Backend: TypeScript, AWS …` — the label, not a term). Held-out recall unchanged at 0.80; its 18 misses are
  12 `not-extracted` (Figma, WCAG, ERP, Excel, GAAP, DEA never reach the top-30 — extraction, next round) and
  Headway's `licensed psychiatric nurse practitioner` title terms, identical before and after.
- 84 real ads (`qa/r755-diff.mts`): keyword lists changed 0; High total 1743 → 1544 (−11 %); ads where every keyword
  was High 6 → 0; 60 ads lose at least one High term, none gains. Most-dropped: `engineering ×5, tools ×4, drive ×4,
  systems ×4, content ×4, business ×4, senior ×4, complex ×3, code ×3, design ×3, technical ×3, passion ×3, data ×3,
  customer(s) ×6`. Read for the reviewers: Vercel Product Designer 25 → 12 (`design tools complete evidence validate
  launch details success measures involved interpret funnel` — "You …" sentences with no cue), neoshare 17 → 7
  (`concepts results modern enjoy technologies environment talent performance impact`).
- Probes: `qa/r715-probe.mts` (Tailor keyword report) and `qa/r753-ats.mts` (ClickUp / Comand Ai High sets)
  byte-identical; `qa/r709-probe.mts` differs in two terms — backendGo loses `services` ("… microservices … services"
  as a duty word), pm loses `fintech` ("4+ years of product management in fintech" — `product management` is not a
  cue noun). Both accepted as boundaries.

## Boundaries

- English cue vocabulary; a requirement stated as "You build interactive prototypes independently" (no cue noun,
  lower-case, long line) is now a keyword but not High — that is the trade for the 59 generic words.
- `listed` covers the inline `Requirements:` form only; a heading followed by a single long prose paragraph is
  judged term by term like any bullet.
- A capital mid-sentence is taken as a name (`Excel`, `Git`); an ad that capitalises Every Word would promote
  everything on that line — the sentence-initial guard does not help there.
- 24 labelled ads, one annotator; ±0.02 F1 ≈ one ad. Held-out gain (+0.04) is the same size as the dev gain
  (+0.05), so the rule is not fitted to the 16.
- Extraction misses (Figma / WCAG / ERP / Excel / GAAP in held-out) are the larger remaining recall loss and are
  not addressed here.
