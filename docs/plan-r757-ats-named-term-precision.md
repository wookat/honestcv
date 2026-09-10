# R757 — ATS named requirement terms: a sentence's own capital and a place name are not requirements

Chain: R756 (#974) → this PR. Corpus (`qa/r751-rows.json`, 84 real ads), gold labels (`qa/r752-labels.mts`, 247 STRICT terms), 16 dev / 8 held-out split and the R752 category definitions are unchanged. The R756 measurement overlay (`qa/r756-labels-add.mts`, 72 labels for terms the gold never listed) is used only to see category movement; it is not the gold.

## Question

R756 promoted capitalised words inside the requirements block so that single-mention names (GAAP, Figma, WCAG, DEA, English) reach the top-30. It listed the cost: under the overlay, G false positives 123 → 133 and E 44 → 52. Which of the new entrants are real names the ad states as requirements, which are something else, and is there a rule that removes the latter without touching the former?

## Evidence (before any code)

`qa/r757-why.mts` diffs the R755 tree against the R756 tree over the 24 labelled ads, keeps every entrant whose label is G / E / D, and prints the requirement line it sits on (after `normalizeAd`) with whether the capitalised-term route (`NAMED`) or a rank side-effect (`side`) admitted it.

| class | entrants | verdict |
|---|---|---|
| real requirement names the gold files as E / G by the R752 rules (a device, a product, a standard, a compliance item is metadata unless the ad asks for skill in it) | `gpu` (Reddit "GPU-based systems"), `npi number individual malpractice insurance` (Headway heading), `erp datev microsoft` / `one stop shop` (Tiens), `web` (Solace), `latin america` (Truelogic) | correct extraction, label disagreement or genuine metadata; no rule should remove them by shape |
| the sentence's own capital after a full stop the line contains | `finances` ("…with clients. Finances can be a difficult topic"), `devices` ("(*Please Note: Devices such as Chromebooks…"), `schedules` ("Must be available on the weekend. Schedules may include…"), `additional` (U-Haul prose) | a capital after `.` `?` `!` names nothing |
| where the candidate must live | `united states` (Solace), `latin` (Truelogic "Latin America"), and across the 84 ads `european` (neoshare), `germany` (Tiens), `american` (Think Academy), `europe` (Ashby) | location metadata (R752 rule: E even under a "Requirements" heading) |
| rank side-effects of the ceiling, not the named route | `teach`, `customer`, `community`, `class`, `virtual`, `machine`, `flows` (n ≥ 2 words that moved into the top-30 as others left) | not addressable by the named route |

Tally over the labelled G / E entrants: E named 10 / side 2, G named 12 / side 6.

Where else a capital is *not* a name — measured on the 84 ads' requirement lines:
- after `:` — 37 cases, 14 are label-led lists of real tools (`Frontend: Typescript, Vue 3`, `Database: PostgreSQL`, `Familiarity with our stack: Rippling, Ramp, Carta`, `AI : Claude Cowork`) against 8 sentence-starts (`Devices`, `Ability`, `Skilled`, `Independently`) → a colon is not a sentence end here;
- after `;` — 11 cases, 8 are names (`ERP; NetSuite strongly preferred`, `German and English…; Chinese`, `WFP; macOS`, `field; MBA`) against 3 sentence-starts (`This`, `Here`, `Parlons-en`) → neither is a semicolon;
- after `.` (followed by whitespace) `?` `!` — 83 cases: `You` 31, `This` / `In` / `We` / `The` / `It` / `Bonus` / `Experience` …; the only names are the second half of an abbreviation (`U.S. GAAP`, `U.S. Elementary`, `Sr. Manager`) and one genuine sentence-start (`…and you write. PRDs, decision memos…`) → a full stop is a sentence end only after a lower-case letter that is not itself an abbreviation.

Places: `qa`-side probe over the 84 top-30 lists — country / region words entering through the named route: `european germany american europe united states latin` (7 entries, 6 ads); US states and cities enter through repetition, not the named route (`london` n=3, `texas` n=7, `arizona` n=3; only Consultport `berlin` n=1), so a city / state gazetteer would remove one entry in 84 ads and is not added.

## Candidate rules measured (`R757=` measurement env var in `capitalizedRequirementTerms`, removed before commit)

Overlay metrics, dev set, STRICT fp (tp constant 168 unless stated):

| rule | dev fp | G / E | held-out | note |
|---|---|---|---|---|
| R756 as deployed | 154 | 79 / 44 | fp 86, tp 95 | baseline |
| **S** — split the line at sentence ends before applying "not the line's own capital" | 150 | 77 / 42 | unchanged | no tp change |
| S + Q — skip a Title-Case question heading ("Up for the Challenge?") | 149 | 76 / 42 | unchanged | one ad; not adopted |
| **S + P** — place words are not names | 147 | 77 / 39 | unchanged | no tp change |
| S + Q + R + P — runs of ≥ 2 capitalised words followed by "(ACRONYM)" are one name | 144, tp 167 | 74 / 39 | unchanged | loses `ethereum` ("Ethereum Virtual Machine (EVM)"); not adopted |
| S + Q + R3 + P — any run of ≥ 3 capitalised words is one name | 142, tp 161 | 73 / 38 | fp 83, tp 89 | −6 held-out tp; rejected |

Sentence-end set: `.` `?` `!` `;` `:` `(` `)` quotes → 147 / 39; `.` `?` `!` `;` → 148 / 40; **`.` `?` `!` → 148 / 40** — the last is kept because `:` and `;` open lists of real tools on the 84 ads (above) and the one extra E they remove (`devices`) is not worth losing `NetSuite` / `Rippling` / `Chinese`-class names in ads the gold does not cover.

## Fix (`src/lib/ats.ts` only)

`capitalizedRequirementTerms()`:
- splits each requirement line at `CLAUSE_BREAK_RE` — `?`, `!`, or a `.` followed by whitespace / end that comes after a lower-case letter and not after `e.g` `i.e` `etc` `sr` `jr` `vs` `approx` `incl` `min` `max` — and treats the first word of every clause as the clause's own capital (previously only the first word of the line). `U.S. GAAP` and `e.g. Excel` stay one clause;
- skips `PLACE_WORDS` — countries, regions and demonyms an ad uses to say where the candidate must live (`united states usa america american americas canada canadian mexico brazil argentina latam latin europe european emea union kingdom britain british england ireland germany france spain portugal italy netherlands switzerland austria poland sweden norway denmark finland india australia asia apac africa singapore japan`). A demonym that is also a language (German, French, Spanish, Dutch, English) is not in the set — "Professional German & English language skills" stays a requirement.

Everything R756 introduced stays: Title-Case line guard, ≥ 3 characters, letter-initial, calendar words, `NAMED_TERM_WEIGHT = 1` < `SKILL_WEIGHT = 3`, the parser openers, whole-word dedupe, the 30-keyword ceiling. No document-frequency gate.

## Result (R756 tree → this tree, STRICT)

Original R752 gold (unchanged): dev 147 / 132 / 10 → 147 / 132 / 10 (F1 0.67), held-out 82 / 79 / 8 (0.65), all 229 / 211 / 18 (0.67) — **identical**, because the gold never labelled the words that leave (`united states latin finances schedules additional`); they exist only in the overlay.

Overlay (measurement only): dev fp 154 → **148** (G 79 → 77, E 44 → 40), tp 168 unchanged; held-out unchanged (95 / 86 / 9); all fp 240 → 234.

84 ads (`qa/r757-measure84.mts`): lists change in 8 ads, 10 terms leave — `european latin united states success clarity finances american schedules additional` — 9 enter as the ceiling refills (`performance-driven network break things mdm gtm annually assessments attentive`), High 1703 → 1697. R709 / R715 / R753 probes unchanged.

## Boundaries

- The named route is English-capitalisation-based; `:` / `;` remain inside a clause by choice, so "Please Note: Devices such as Chromebooks" still yields `devices`.
- `PLACE_WORDS` is a hand list of the country / region words seen on the 84 ads plus the obvious neighbours; a city or a US state named once ("based in Berlin") still enters — 1 case in 84 ads.
- The remaining G false positives (fixed gold 117 / 240 overlay) are repeated generic nouns inside correctly found blocks (`teach customer community class`), which the named route neither adds nor can remove — the next lever is the ranking of repeated block words, not capitalisation.
- 24 ads / one annotator; ±0.02 F1 ≈ one ad.
