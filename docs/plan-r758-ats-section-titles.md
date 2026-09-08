# R758 — function benchmark refresh + ATS reads the section titles ads actually use

Chain: R757 (#975) → this PR. Corpus (`qa/r751-rows.json`, 84 real ads), gold labels (`qa/r752-labels.mts`, 247 STRICT terms), 16 dev / 8 held-out split, the R752 category definitions and the 30-keyword ceiling are unchanged. The R756 overlay (`qa/r756-labels-add.mts`) is measurement only.

## Benchmark refresh (5 rounds since R753)

- Rezi public pages (`qa/r758-rezi.mjs` → `qa/r758-rezi.json`): the 8 URLs of R753 return the same titles, redirects, byte counts and extracted headings; the keyword-scanner URL is still a 404. No new public feature to benchmark against.
- Production (`qa/r758-api.mjs`): `/`, `/ats-checker`, `/pricing`, `/jobs`, `/sitemap.xml` 200; `/api/jobs/search` for engineer / nurse / data analyst London / barista Chicago / product manager 200 in 0.9–2.1 s, 4–150 rows, per-row `source` present, 0 rows with residual HTML / entities / Arbeitnow footer (R724 / R752 / R754 hold), `/api/ai/quota` 200 `freeRemaining 12`.
- Fresh out-of-sample ads (`qa/r758-oos.mts` → `qa/r758-oos.json`): 12 production descriptions for accountant / nurse / product manager / data analyst / engineer / designer, none in the fixed corpus (title + company excluded), ≥ 1500 chars, source-diverse, run through the production `extractKeywords` / `highPriorityKeywords`.

P0: none. P1 found on the fresh ads (`qa/r758-why.mts` prints the source line of every suspicious High term): GE Vernova High contains `ge inc employee assistance benefit plan` (a benefits paragraph under "Benefits Include"), Juniper Square High contains `annual family leave` (benefits under "The Salary" / "Benefits"), Primer High contains `interview challenge` ("✅ A typical interview process"), Reka repeats `ai model infrastructure` across "Reka's Mission", Klaviyo High contains `range cost base` ("Base Pay Range For US Locations", "Massachusetts Applicants"). Every one of these sits under a section title the parser did not recognise as employer / package / process boilerplate, so the words counted as job vocabulary and as repetition.

## Evidence (before any code)

`qa/r758-heads.mts` lists heading-like lines (≤ 6 words, ≤ 60 chars, no bullet, not sentence-ended) that neither `BOILERPLATE_HEADING_RE` nor `REQUIREMENTS_HEADING_RE` matched, across the 84 + 12 ads. Recurring unmatched titles, by kind:

| kind | titles the ads use | today |
|---|---|---|
| package | Benefits Include, Competitive salary and equity, Wellness benefit, Total Rewards, US Pay Range, Pay Transparency, Pay Grade - M, Supplemental Pay, Base Pay Range For US Locations, The Salary, Time Off & Flexibility, Health & Wellbeing, Vacation/Paid Time Off, Flexible Working, Work-Life Balance, Show me the benefits, What we offer colleagues / you / (US + Canada), We offer US-based employees, Remote Compensation Philosophy, Location and Compensation, Perks of joining the U-Haul team, Retention Bonus | counted as job text |
| employer | Why you'll like working here, Why you should join SumUp, Why top talent chooses YipitData, What It's Like to Work Here, Get to Know Klaviyo, An Introduction to Primer, Reka's Mission, Our Company Values, Mirakl in numbers, Benefits while working at Planet, Learn more about our culture > | counted as job text |
| process / legal | Recruitment Process, The Interview Process, ✅ A typical interview process, Application Deadline, Apply Now, Job Application Tip, Privacy Statement, Equal Opportunities for everyone, Canonical is an equal opportunity employer, Massachusetts Applicants, San Francisco Fair Chance Ordinance, Useful Links, Relocation Assistance Provided: No | counted as job text |
| requirements | What We Are Looking For, What We Look For (In You), Attributes we're looking for, What Makes You Stand Out, Desired Characteristics | not a requirements block — Tailscale's 12-line qualification list, OKX's and Truelogic's candidate lists scored as duties |
| duties | Responsibilities, Key Responsibilities, What You'll Do, What you'll be doing, Roles and Responsibilities | not recognised, and **must not** become STRICT requirements — the R752 rules file duties as D |

Two shapes explain most misses: the title carries a leading symbol (`✅`, `🏥`) that the exact-match regex never sees, and the title is a variation the closed list does not contain ("Benefits **Include**", "**Why you should** join …", "**Base** Pay Range **For US Locations**"). A closed list cannot keep up with the variations; a cue-word test on the title can, provided a title that also names requirements is left alone.

`qa/r758-headdiff.mts` — the classification change this PR makes, baseline tree vs this tree, over every heading-like line: 84 ads 573 lines, **48 reclassified** (43 distinct titles); 12 fresh ads 76 lines, **17 reclassified**. All 65 are listed in the script output; 60 go `-` → boilerplate (all of the package / employer / process titles above), 5 go `-` → requirements (`what we are looking for`, `what we look for in you`, `attributes we're looking for`, `what makes you stand out`, `what we look for`, `desired characteristics`). No title leaves either class.

## Fix (`src/lib/ats.ts` only)

- `headingLabel()` strips leading non-alphanumerics (emoji, `•`, `»`) and trailing `:` `!` before a title is classified; used by `splitBoilerplate()` and `requirementsBlockLines()` (heading branch and inline-label branch alike).
- `BOILERPLATE_HEADING_CUE_RE` + `isBoilerplateHeading(label)`: a title is boilerplate if the closed list matches **or** it contains a package / employer / process cue (`benefits`, `perks`, `salary`, `pay range`, `compensation`, `total rewards`, `interview|recruitment|hiring|application process`, `how to apply`, `apply now`, `privacy`, `equal opportunity`, `applicants`, `our|company culture|values|mission`, `get to know`, `introduction to`, `why (you should) join|work`, `what it's like`, `working here|at`, `life at`, `we offer`, `time off`, `wellbeing`, `wellness`, `work-life balance`, `flexible working`, `relocation`, `useful links`, `in numbers`, `fair chance`) **and** does not also match `REQUIREMENTS_HEADING_RE` ("Skills & Benefits" stays a requirements title). The closed list gains `bonus eligibility` and `referral|signing|sign-on|retention bonus`.
- `REQUIREMENTS_HEADING_RE` gains the generalised looking-for family — `(what|who|attributes|skills) we('re| are) look(ing) for`, `we look for` — plus `desired characteristics` and `(makes you) stand out`. Duty titles (Responsibilities / What you'll do) are deliberately **not** added: the fixed gold files them as D, and a STRICT block must stay the candidate profile.
- `REQUIREMENTS_SENTENCE_RE` gains `you'll thrive|succeed|be great`, `you should apply if`, `we'd love to hear from you if` (SumUp "You'll be great for this role if:").
- Inline-label lists (`Requirements: a, b, c` followed by bullets) now close at the first following paragraph, the way sentence-opened blocks do; previously they ran to the next heading, so "This posting is expected to remain open…" counted as requirements.
- `METADATA_LABEL_RE` gains `Year 1 OTE:` / `On-target earnings:` and `Relocation Assistance Provided:` (Pmmalliance, GE Vernova metadata lines).

Measured and **not** adopted: a tie-break that ranks a capitalised name above an equally-scored repeated word (would have kept Tailscale's `html/css` / `saas`, see Cost) — fixed-gold tp 230 → 226 (`designing designers customer` and other gold generics left the top-30 in favour of `ks de ia id mt sd` state abbreviations, `diversity equity inclusion belonging`, `u.s.-based`, `asia-pacific`); F1 unchanged, so the change was withdrawn and the ranking question stays open for a later round. Also not adopted: a duty-title class that feeds the block (conflicts with the gold), and any document-frequency gate (rejected in R755 / R756 for cutting gold R words at the same rate as generics).

## Result (baseline = R757 tree, this tree)

Fixed R752 gold, STRICT:

| set | before tp/fp/fn | P / R / F1 | after tp/fp/fn | P / R / F1 |
|---|---:|---:|---:|---:|
| dev (16) | 147 / 132 / 10 | 0.53 / 0.94 / 0.67 | 147 / **129** / 10 | 0.53 / 0.94 / **0.68** |
| held-out (8) | 82 / 79 / 8 | 0.51 / 0.91 / 0.65 | **83** / **77** / **7** | 0.52 / 0.92 / **0.66** |
| all (24) | 229 / 211 / 18 | 0.52 / 0.93 / 0.67 | 230 / 206 / 17 | 0.53 / 0.93 / 0.67 |

DUTY policy, all: 279 / 161 / 43 → 279 / 157 / 43 (F1 0.73 → 0.74). The new held-out tp is Reddit `targeting` (reaches the top-30 once `base` — "Base Pay Range" — leaves); Remote loses one fp.

Overlay (measurement only), STRICT: dev 168 / 148 / 11 → 166 / 145 / 13; held-out 95 / 86 / 9 → 96 / 84 / 8; all 263 / 234 / 20 → 262 / 229 / 21.

84 ads (`qa/r758-measure.mts` → `qa/r758-measure.txt`): lists change in 25 ads, 61 terms enter, 90 leave; High 1697 → **1672** (31 enter, 56 leave). Leaving High, read line by line: `privacy statement data materials information application` (Phantom privacy paragraph), `equity benefit` (benefits lists), `interview` (DiliTrust / Pleo process sections), `annual travel colleagues recognition` (Canonical "What we offer colleagues" ×3), `commission` (Credit Wellness "Supplemental Pay"), `merchant` (Affirm — company-intro repetition), `retention teachers class` (Think Academy "Retention Bonus" heading). Entering: Tailscale's qualification list (`campaigns visual feedback production-ready minimal`), OKX's candidate list (`design senior visual global support`), Spreedly (`fraud lean improvement automation` as `ai handling accounts open` leave), Planet Labs (`lead training english` as `san francisco offerings reimbursement` leave), SumUp (`product design retention measurable stakeholders …` under "You'll be great for this role if:"). Entrants under the refilled ceiling are still mostly repeated generics (`times growing assist`, `priorities strengthen execution`) — the ranking-under-the-cap question of R755 / R757 is unchanged by this round.

12 fresh ads: 8 change; GE Vernova High loses `ge inc employee assistance benefit plan`, Juniper Square loses `annual family leave`, Primer loses `interview challenge` (and company-intro repetition `payments infrastructure`), Reka loses `ai model infrastructure` (mission repetition), Klaviyo loses `range cost base`.

R709 / R715 / R734 probes byte-identical to the baseline tree; R753 compound spellings 12/12 for all three forms.

## Cost, stated

- Tailscale (dev, overlay): the block grows from 8 to 20 lines; two single-mention names the overlay labels (`html/css`, `saas`) are pushed out of the top-30 by newly in-block n = 2 words (`campaigns`, `feedback`) that tie on score and win on reading order. This is the −2 overlay tp above. It is a ranking-under-the-cap question (R756 set `NAMED_TERM_WEIGHT` so one mention *ties* two repeats), measured and left for its own round — see "not adopted".
- A benefits list whose items look like headings ("Competitive salary and equity", "401(k) retirement plan") still toggles section state item by item; items without a cue word (`401(k) retirement plan`) re-open the job section until the next cue item. Phantom's privacy paragraph now falls after a cue item and is excluded; an ad whose last benefit item has no cue word would not be.
- Cue words are English; a title that is only a company name ("Reka's Mission" is caught by `\w+'s mission`, "About Tailscale" by the existing `about …` rule, but "Tailscale" alone is not).
- 24 labelled ads, single annotator; ±0.02 F1 is about one ad.
