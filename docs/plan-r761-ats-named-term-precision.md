# R761 — ATS named requirement terms: places, Title-Case value labels, prose after a colon, question headings

Chain: R760 (#978) → this PR. Corpus (`qa/r751-rows.json`, 84 real ads) + 12 fresh out-of-sample ads (`qa/r758-oos.json`), gold labels (`qa/r752-labels.mts`), 16 dev / 8 held-out split, the R752 category definitions and the 30-keyword ceiling are unchanged. Numbers below are from `qa/r761-named.mts` (single-mention capitalised entrants with their source line), `qa/r761-dump.mts` + `qa/r759-cmp.cjs` + `qa/r761-diff.cjs` (before/after keyword and High lists against a debug copy of the R760 `ats.ts`, deleted afterwards) and the R752 harness.

## The question

R759 made single-mention capitalised requirement names win ties at the cap, so R756/R757's *named-term precision* now decides which words fill the last places of the top-30. R759/R760 saw `boston`, `diversity equity inclusion belonging` and a glued `Additional Information` heading enter that way. How many single-mention capitalised entrants are there, what are they at their source line, and which shapes can be excluded without a broad rule?

## Evidence (before any code)

96 ads, `extractKeywords(text, 30)`: **220 single-mention capitalised entrants across 64 ads**, each read at its source line. The large majority are requirement names — `ngrx html/css chromium vivliostyle princexml weasyprint sile rest microfrontends tailwindcss ethereum llvm advancedmd hapi sagemaker mlflow gaap erp excel qgis arcgis claude chatgpt cuda slurm sentinel mitre iso …` — which is why every broad rule (capitalisation, document frequency, "one mention") stays rejected (R755–R759). The non-requirements fall into five shapes:

| shape | examples (source line) |
|---|---|
| a place the candidate must live in / the office | `berlin` ("Available to work onsite at our Berlin office"), `boston` ("onsite role … in Boston"), `asia-pacific` ("Experience working with global teams across Asia-Pacific") |
| a Title-Case value label before a colon | `commercial` ("Proven Commercial Leadership: 7+ years"), `negotiation` ("Exceptional Communication and Negotiation Skills:"), `skilled` ("Data-Driven Decision Making: Skilled at…"), `thrive` ("Adaptability: Thrive in a start-up"), `individual` / `malpractice` ("NPI Number and Individual Malpractice Insurance:") |
| prose that starts after a colon | `devices` ("(*Please Note: Devices such as Chromebooks…") |
| a boilerplate title the parser never saw | `equity` / `inclusion` ("How we feel about Diversity, Equity, Inclusion and Belonging:" — 9 words, too long for a heading line), `additional` (glued "Additional Information • …"), `performance-driven` (glued "What You Can Expect • Performance-driven…") |
| a closing question heading | `challenge` ("Up for the Challenge?" — a `?` line was never a heading, so Solace's requirements block ran on into the sign-off) |

Question headings measured over the 96 ads: 17 short `?` lines, **17/17 title a section** (`What is PerfectServe?`, `Why Join Us?`, `Why Reka?`, `Interested?`, `What will I be doing?`, `What's the culture like at Primer?`, `Don't meet every single requirement?`), none is a requirement.

## Fix (`src/lib/ats.ts` only)

- `capitalizedRequirementTerms`: a Title-Case label before a colon contributes only its acronyms (`NPI` stays, `Individual Malpractice` does not); a colon followed by prose (`: Devices such as`) starts a new clause like a sentence end; a colon that opens a list of names (`Frontend: Typescript, React`) does not — measured in R757, 37 colon cases in the requirement lines are mostly tool lists.
- Place words: `pacific asia-pacific nordics benelux dach oceania scandinavia` join the closed list; the word before `office(s)` / `HQ` / `headquarters` / `hub` is a place for that line (`our Berlin office`).
- Headings: a short line ending in `?` is a heading; in the requirements parser a question never *opens* a block (`Don't meet every single requirement?` would otherwise open one on the EEO paragraph) and closes the running one. `What is Acme?` / `Who is acme?` / `Why Acme?` / `The culture` join the boilerplate titles. A non-list line ending in `:` of ≤ 12 words whose label is a boilerplate title (`How we feel about Diversity, Equity, Inclusion and Belonging:`) closes the block. `Additional Information` / `What You Can Expect` join the glued-heading list, and a glued heading is also recognised when a bullet glyph (not only a capital) follows it.

## Results

Fixed R752 gold, STRICT (baseline = R760):

| set | baseline tp/fp/fn (P / R / F1) | R761 |
|---|---|---|
| dev | 144/122/13 (0.54 / 0.92 / 0.68) | **145/120/12 (0.55 / 0.92 / 0.69)** |
| held-out | 82/75/8 (0.52 / 0.91 / 0.66) | 82/75/8 (unchanged) |
| all | 226/197/21 (0.53 / 0.91 / 0.67) | **227/195/20 (0.54 / 0.92 / 0.68)** |
| all + R759 overlay (post-hoc, reported separately) | 260/218/23 (0.68) | 260/212/23 (**0.69**) |

No gold term is lost on any set. Single-mention capitalised entrants 220 → **205** (ads 64 → 63); the 15 leavers are exactly the table above (`additional asia-pacific berlin boston challenge commercial devices equity inclusion individual malpractice negotiation performance-driven skilled thrive`), no requirement name leaves.

84 fixed ads: 15 lists change (kw +31 −64), High 1697 → **1660** (+5 −42). The two ads with the largest change are PerfectServe (×2): `What is PerfectServe?` is now a boilerplate title, so its self-description (`clinical care klas physician scheduling million+ …`) leaves the keyword pool; saas.group (`What is saas.group?`) likewise loses `global grow brands` / High `software portfolio`; Solace loses `challenge`; Ineratec (`Why us?`) loses High `tasks`. Entrants are ordinary repetition words that take the freed places (`supporting executive leaders cloud` are in-block n ≥ 2 words; `enterprise` is the role title "Enterprise Growth Lead"; Headspace's `ks de ia id` are the states the ad twice requires licensure in). 12 fresh ads: 2 lists change — Klaviyo `boston` → `strategy`, iwoca (`The culture` now boilerplate) loses High `decisions value`. Without a company (the `/ats-checker` path) the same 15 + 2 ads change, High 1702 → 1664.

Measured and not adopted: excluding two-letter state abbreviations (they are the ad's own licensure requirement, and they enter by repetition, not by this path); any rule on `Title-Case` words inside a clause (R757 rejection stands — `Ethereum`, `Earth Observation` would leave).

## Boundaries

- English heading and cue vocabulary; a `?` heading that names requirements (`What do you bring?`) would close the block rather than open it — 0/17 such lines in the corpus, chosen fail-closed.
- The colon rule needs `Capital lower-case lower-case` after the colon; `Note: SQL required` stays a list.
- Place detection is a closed list plus the `office/HQ/hub` context; a bare `Boston, MA` line is metadata only if `Location:`-labelled.
- 24 labelled ads / one annotator; ±0.02 F1 ≈ one ad.
