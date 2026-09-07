# R709 — Short job ads no longer score the resume against boilerplate, company and city names

## Evidence

Probing `extractKeywords` (after R708) with five realistic ~60–90-word ads (`/tmp/r709-probe.mts`, Go backend / data analyst / growth marketing / registered nurse / payments PM):

- `counts.size < 40` was a cliff: every single-mention token of a short ad became a keyword, capped at 30 **in reading order**. The nurse ad scored the resume against `anne, hospital, leeds, compassionate, 32-bed, coordinate, planners …` while `IV therapy`, `wound care` (last line) were cut by the cap; the data-analyst ad produced `turn, messy, ll, against, write, run, present, 4+`.
- `you'll` → tokenize dropped the apostrophe and emitted `ll` as a keyword although `you'll` is a stop word; `4+`, `1+`, `5+` passed the `^\d+$` digit filter.
- `REQUIREMENTS_HEADING_RE` treated the whole heading line as the heading, so an inline `Requirements: active RN license, BLS and ACLS …` list contributed nothing to the requirements block (also why `highPriorityKeywords` never flagged `rn / bls / acls`); ads whose requirements start with `You bring 4+ years …` had no block at all.
- Line 2 of nearly every ad is `Company — City, Country`; its tokens (`bluebird manchester`, `fernway`, `lumen bank london`) entered the keyword list and the match score.
- Removing one noise token could flip an ad across the 40-token cliff: the Go ad went 15 → 30 keywords (`acme, berlin, equity, learning, budget …`) when `4+` was filtered.

## Design (`src/lib/ats.ts` only; interfaces unchanged)

- `tokenize`: strip English contraction suffixes (`'ll 're 've 's 'd 't 'm`, straight or curly apostrophe) before splitting; keyword filter drops tokens without a letter (`4+`).
- Stop words gain JD boilerplate verbs/connectors (`turn run write present bring ship reduce against comfort(able) hands-on welcome fundamentals own expect fluency solid grasp expertise`).
- `requirementsBlock(lower)` (shared by `extractKeywords` and `highPriorityKeywords`): heading regex also accepts `about you | what you bring | you('ll) bring | ideal candidate | your profile | your background`; the block starts after the colon of an inline list, includes the heading line itself when it is a >60-char sentence, and starts after a short heading line otherwise.
- `headerLineTokens(jd)`: tokens of line 2 (≤12 tokens, ad has ≥3 lines) are excluded from the single-mention top-up.
- Ranking replaces the cliff with a floor:
  ```ts
  core = tokens with n ≥ 2 or looksLikeSkill  → score (n, +2 skill, +0.5 in requirements block)
  fill = remaining single-mention tokens, requirements block first, then reading order
  keywords = phrases + core, topped up from fill only until MIN_KEYWORDS (15)
  ```
  Long ads are unchanged (golden JD still 18 keywords, 88 %, missing `graphql, next.js`); short ads now yield ≤15 requirement-led keywords instead of up to 30 reading-order words.

## Before → after (same five ads)

| ad | before | after |
| --- | --- | --- |
| nurse | `care patient registered nurse medical/surgical anne hospital leeds compassionate 32-bed med-surg unit administer medications document epic coordinate physicians discharge planners active rn license bls acls certification 1+ acute assessment therapy` (30) | `care patient active rn license bls acls certification acute assessment therapy wound registered nurse medical/surgical` (15); high-priority now includes `rn bls acls` |
| data analyst | `… turn messy decisions merchandising marketing teams ll dashboards power write against run a/b tests present findings stakeholders` (30) | `sql analytics python pandas dbt airflow tableau snowflake data retail advanced excel attention detail analyst` (15) |
| payments PM | `… lumen bank london roadmap merchant platform engineering design compliance ship features reduce checkout friction bring 4+ fintech writing prds running discovery interviews` (30) | `product management mixpanel psd2 pci sql jira payments fintech prds discovery interviews analysing funnels amplitude card` (15) |
| Go backend | 15 (unchanged set) | 15 (unchanged set) |
| golden frontend | 18 / 88 % | 18 / 88 % |

## Verification

- `tsc` / `eslint src/lib/ats.ts` / `build` / `verify-dist`.
- Production `/builder` seeded with the nurse ad and a nurse resume that lists RN / BLS / ACLS / wound care but not IV therapy: missing-keyword panel lists requirement terms (no `leeds` / `anne` / `compassionate`), score row and Health dialog agree; zero AI calls, zero console errors, storage restored.
