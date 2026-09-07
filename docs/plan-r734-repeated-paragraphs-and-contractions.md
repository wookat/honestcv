# R734 — ATS: a paragraph the ad pastes twice counts once; "don't / won't" no longer become keywords

## Evidence (first-hand, 2026-09-07)

- R733 left the Perk ad (Arbeitnow, `qa/r733-perk-jd.json`) with `broader shaping spend` as **High priority** missing terms and 16 duty nouns (`book providers coordinate attendees multi-sided spanning corporate planners specialists suppliers participants …`) in the 30-keyword pool. The ad states no technology at all, so the pool can only be soft — but those specific words got in because the feed pasted the 71-word "You'll own building the experiences of our group travel and events product…" paragraph **twice**, so every word in it was "repeated" (≥ 2 → core pool) and three of them crossed the ≥ 3 "repeated in the posting" line for High priority (`shaping` = 2 paste + "shaping how millions", `broader` = 2 + "broader organisation", `spend` = 2 + "spend management").
- Corpus (`qa/r734-dup.mts`, 84 R723 ads + Perk): 6 ads repeat at least one ≥ 8-word paragraph verbatim (Perk 71w×2, Remote 64w×2 + 50w×2, Mural 12w×2 + 13w×2, Proton 8w×4, Samsara 8w×2). Only Perk's pool depends on it materially (16 keywords), Mural swaps one (`visual` → `acquisition`), Proton drops a leaked `hr` markup token.
- While reading the pool: `won` (from "You won't just build features") was a Perk keyword, and in the saas.group Senior Accountant ad `don` (four "don't") was a **High priority** keyword. `tokenize()` strips `'t` and keeps the stem — the R709 fix covered `you'll → ll` but not `n't`.

## Change (`src/lib/ats.ts`)

```ts
function withoutRepeatedParagraphs(jd)   // lines normalised to [a-z0-9 ]; a line of ≥ 8 words is kept the first time only
extractKeywords(jdRaw, …)     { const jd = withoutRepeatedParagraphs(jdRaw); … }   // pool
highPriorityKeywords(jdRaw, …){ const jd = withoutRepeatedParagraphs(jdRaw); … }   // "repeated ≥ 3" test
tokenize: .replace(/\b[a-z]+n[’']t\b/g, ' not ')   // don't / won't / isn't → the stopword "not"
```

`matchScore` and the Builder / `/ats-checker` / Instant questions / practice all go through these two functions, so they agree. Lines under 8 words (headings, bullets such as "• React") are never deduplicated; a skill listed in two short bullets still counts twice.

## Measured (`qa/r734-measure.mts` vs the pre-R733 baseline; R733 numbers in brackets)

| metric | before | after |
|---|---|---|
| high-priority terms, 85 ads | 2 160 | 2 041 (R733: 2 047) |
| ads whose pool changed | — | 7 (R733: 4) — Perk, Mural, Proton, saas.group + R733's three |
| Perk high | `event social media product platform … shaping` (17) | `events travel squad` (R733: `event travel events broader shaping spend`) |
| Perk pool | 30, incl. 16 pasted-paragraph nouns + `won` | 23, no `won`; fill words are single mentions in reading order (`goals beyond solution manager pairing bar reviews success`) — still soft, honestly so: the ad names no skill |
| `don` high-priority (saas.group) | yes | gone |

R709 / R715 probes byte-identical before and after (`/tmp/r709*.txt`, `/tmp/r715*.txt` diff empty); R725 company-leak list unchanged (only the known `vml`).

## Limits

- `squad` is now Perk's third High-priority word (3 genuine mentions). The "repeated ≥ 3" rule is only as good as the ad; a labelled precision/recall set for the whole pool is still the P2 follow-up recorded in R733.
- Dedup is verbatim-line based. A paragraph pasted with a changed word, or split differently across lines, still counts twice.
- Contractions: only `…n't`. "Let's", "what's" already reduce to their stem via the existing `'s` strip.

## Verification

tsc (app + worker), eslint on `src/lib/ats.ts`, build, verify-dist; deploy; production `/ats-checker` with the Perk ad at 1280 and 375: High priority = `events travel squad`, pool without `won` / `shaping` / `spend`; 0 console errors; storage back to baseline; 0 AI calls.

## Result (production, bundle `index-CqnRPKku.js`, 2026-09-07)

`/ats-checker` with the Perk ad and the R733 sample resume at 1280×900 and 375×812 (`qa/r734-verify-ats.cjs`, `qa/shots/r734/ats-{1280,375}.png`): pool 23 (11 matched incl. `events travel squad`, 12 remaining), no `won` / `shaping` / `spend` / `social media`, no High-priority-missing block because the three high terms are all in the resume; 0 console errors, 0 page-wide overflow, localStorage back to baseline, 0 AI calls. The `don't → don` case (saas.group ad) is verified by the local probe only; it runs through the same `tokenize()` in the deployed bundle.
