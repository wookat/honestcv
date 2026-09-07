# R733 — function benchmark refresh (10 rounds after R723) + two P1 fixes: boilerplate phrases out of the keyword pool, stale search after a place change

## Benchmark evidence (first-hand, 2026-09-06/07)

- Rezi public pages re-fetched server-side (`qa/r733-rezi.mjs` → `qa/r733-rezi.json`): 7 of 8 pages HTTP 200 (`/`, `/ai-resume-builder`, `/pricing`, `/resume-checker`, `/job-search`, `/ai-cover-letter-builder`, `/ai-interview`); `/resume-keyword-scanner` now 404. Advertised set unchanged versus R723 (builder, score, targeting/keywords, AI summary and bullets, templates and downloads, cover letter, AI interview, job search + tracking + bulk actions, "AI resume agent", dark mode, free/pro/enterprise). Marketing copy only — none of it proves Rezi's workflow quality, so the table below compares *our* production against the advertised capability, not against measured Rezi behaviour.
- Our production (bundle `index-CzG8yu9Q.js`, i.e. R732) walked end-to-end by the testing agent at 1280×900 and 375×812 with exactly 4 real AI POSTs (`qa/r733-plan.md`, `qa/r733-testing-report.md`, `qa/r733-diagnostics.json`, `qa/shots/r733/`, recording `screencasts/r733-functional/`). Quota 12 → 9; the stopped cover letter spent nothing. 0 console errors, 0 HTTP ≥ 400, no page-wide horizontal overflow at 375 (scrollWidth = visualViewport.width on 7 screens).
- Extra R724–R732 acceptance on production: 150 `engineer` + 107 `developer` descriptions scanned — 0 raw tags (R724); Tailor one POST / 4 suggestions / "Accept the 1 unflagged" (R712/R727); cover letter and brief streamed (first words 4.5 s / 4.9 s, done 9.5 s / 28.4 s) and followed the newest line until the reader scrolled up (R729/R730); Stop kept nothing and the quota pill stayed 11 after reload (R731); Tailor busy-close showed Keep waiting / Stop and close (R732).

### Dimension by dimension (delta vs R723)

| # | Dimension | R733 first-hand result | Verdict |
|---|---|---|---|
| 1 | Workbench (entities) | import → copy → target → Applied → note → reminder → cover → brief → practice doc all persisted through reload on both widths; Duplicate → Delete → Undo restored byte-identical `resumeVersions` | parity; P2: `/dashboard` says "No resume yet" above two saved copies (distinguishes unsaved master from copies without saying so) |
| 2 | AI writing | 4/4 POSTs 200, no retry; Tailor flagged 3/4 rows before Accept; cover and brief grounded except one inferred preference each ("quarterly goals and long-term vision", "lacked consistent, accessible components") | parity; P2 wording (post-check `mirrored` false positive on stories that paraphrase a bullet) |
| 3 | Scoring / keywords | **P1 (reproduced twice, builder and `/ats-checker`)**: the Perk ad's *recruitment-scam notice* ("only communicate via our verified **social media** channels…") put `social media` in the **High priority** missing list; the same term then drove Instant questions ("a project using social media") and the local practice report ("High Priority Words still missing: social media"). Employer name (25 mentions) and domains were correctly absent (R725 held) | **P1 → this PR** |
| 4 | Tailoring | one request, review-protected accept; denominator quality = #3 | see #3 |
| 5 | Cover letters | stream, stop, save, link, PDF/DOCX one page each with real contact details | parity |
| 6 | Interview prep | streamed brief, 6-question practice, local score, saved report reopened | parity; #3 pollutes question generation |
| 7 | Job search | **P1**: nurse + Boston settled → clear Location → type barista → Search: URL and input say barista, rows / header / detail stay nurse; second Search recovers. Boston nurse still 0 on-site rows (Muse inventory, R723 known) | **P1 → this PR** |
| 8 | Import | six whole bullets, three categorised skill lines, GitHub as website — desktop and mobile | parity |
| 9 | Landing / funnel | upload → score → builder continuous; Download asks for an email | P2 (product decision, unchanged) |
| 10 | Architecture | local-only storage disclosed; streaming + cancellation observed; AI 9.5–28 s wall | P2 latency (upstream), no action |

### Refreshed P0/P1 list (ordered by value)

| Priority | Gap | Basis | Plan |
|---|---|---|---|
| **P1** | Curated phrases from About-us / scam-notice sections become high-priority keywords | Perk run in builder and checker; `qa/r733-perk-jd.json`; corpus measurement below | **this PR**: `KNOWN_PHRASES` seeded from the job sections only; ad-generic single words no longer promoted by repetition alone |
| **P1** | Stale list after clearing the place and submitting a new query | `09-barista-stale-nurse.png`, request log with overlapping nurse/Boston + nurse fetches | **this PR**: location debounce refetches the *shown* search and stands down when any search was submitted since the place changed |
| P2 | Dashboard "No resume yet" over saved copies | `34-dashboard.png` | R734 candidate |
| P2 | Brief/cover infer preferences; `mirrored` false positives | verbatim outputs in the report | R734+ candidate (prompt + post-check wording) |
| P2 | Boston on-site inventory | Muse inventory | unchanged; Adzuna/JSearch key request stands |

## Defect 1 — boilerplate phrases and ad-generic words in the high-priority pool

### Root cause (code, `src/lib/ats.ts`)

R725 made single-word extraction section-aware (`splitBoilerplate()`: ordinary words count only outside About-us / Benefits / EEO / scam-notice / How-to-apply sections), but the **phrase** seed still scanned the whole ad:

```ts
for (const phrase of KNOWN_PHRASES) if (lower.includes(phrase)) found.set(phrase, 5)
```

`social media` is a curated phrase, so one mention inside "Recruitment scams" survived, and `highPriorityKeywords()` promotes every phrase present anywhere in the ad — high priority by construction. The same path applies to any curated phrase an employer uses about itself ("leader in insider **risk management**", "our **supply chain** division").

Second, repetition alone promoted a keyword (≥ 3 mentions). Ads repeat their own vocabulary — `product`, `platform`, `support`, `engineering`, `teams` — whatever the role; on the Perk ad that made `platform`, `product`, `support`, `teams`, `technical`, `complex`, `lead` high priority without any of them being a requirement.

### Fix

- `extractKeywords()`: phrases are seeded from the job sections returned by `splitBoilerplate()` (the same split that already governs ordinary words). A phrase in the employer's own sections describes the employer, not the job. Curated single-word skills in those sections still count (unchanged, e.g. "we build Next.js").
- `highPriorityKeywords()`: a repeated keyword is promoted only when it is not in `COMMON_AD_WORDS` — 34 words that ≥ 1 in 10 of the 85 measured ads repeat regardless of role (`support product products systems tools engineering engineers design technical teams data growth drive business process complex solutions learning performance development platform workflows senior success personal technology analytics lead global customers customer revenue content market training enterprise`). They are still promoted when the requirements block or the title names them (`analytics` stays high on the data-analyst probe; `marketing manager` stays high on the marketing probe).

Not changed: requirements-block weighting and title parsing still read the whole ad (a requirements heading is never inside a boilerplate section by construction of `BOILERPLATE_HEADING_RE`); short ads (< 40 job tokens after the split) are not split, as before.

### Measurement (`qa/r734-measure.mts`, 84 R723 feed ads + the Perk ad, shipped extractor vs this PR)

| metric | before | after |
|---|---:|---:|
| high-priority terms, all 85 ads | 2 160 | 2 047 |
| ads whose high-priority set changed | — | 43 |
| ads whose 30-keyword pool changed | — | 4 |
| keywords removed from a pool | — | 3 (`social media` Perk — scam notice; `risk management` Teramind — "About Teramind: … leader in insider risk management" for a *Senior Product Manager* ad; `supply chain` Lakeshore — "Company Description: … our supply chain division" for a *Manager of IT Security* ad) |
| Perk high priority (17 → 6) | `event social media product platform engineering travel events design lead senior technical complex support broader teams engineers shaping` | `event travel events broader shaping spend` |

Demoted by the repetition rule (count of ads): product 10, support 6, learning 6, business 6, engineering 5, senior 5, customers 5, growth 5, engineers 4, lead 4, design 4, teams 4, performance 4, solutions 4, … — each still in the pool and still high when the requirements block or title names it. R709 (5 short ads + R708 golden 88 % / graphql, next.js) and R715 probes are byte-identical before and after.

Limits: `COMMON_AD_WORDS` is corpus-derived (85 English tech-heavy feed ads), not a labelled precision/recall set; `event / travel / events` remain high on the Perk ad because they are in the role sections (the product domain) — a domain-vs-skill distinction this round does not attempt; the checker's inferred-company path is what production exercises (no company field on `/ats-checker`).

## Defect 2 — stale results after clearing the place and submitting a new query

### Root cause (code, `src/pages/Jobs.tsx`)

The location debounce effect re-runs only when `locationFilter` changes and calls `fetchJobs(query, category, locationFilter)` from the closure of *that* render — so `query` is whatever the box held when the place changed ("nurse"), not what was typed afterwards. Sequence:

1. nurse + Boston settled; user clears Location → effect schedules a 700 ms refetch closing over `query = "nurse"`.
2. Within 700 ms the user types barista and submits → `runSearch("barista")` → `fetchJobs` seq N.
3. Timer fires → `fetchJobs("nurse", …, "")` seq N + 1 → wins the sequence guard → rows, header (`fetchedQuery = "nurse"`) and selected detail show nurse under a barista URL/input.

The R717 sequence counter only prevents an *older response* from overwriting a newer one; here the stale request was *started later*.

### Fix

- The timer callback reads the search the list currently shows (`fetchedQuery`, `category`) from a ref kept in sync by an effect — the refetch re-runs *that* search for the new place; typing without submitting still does not search (R721 rule).
- The effect records `jobsFetchSeq` when the place changes; if any fetch has started by the time the timer fires, the timer stands down (`lastFetchedLoc` is still updated) — an explicit search submitted after the place changed already carried the new place, because `fetchJobs`' default `loc` is the current `locationFilter`.
- No ref is touched synchronously in `runSearch` (the React Compiler lint `react-hooks/refs` flags that through `nextStep()`'s inline handlers); the module-level counter is the shared identity.

Preserved: 700 ms debounce, "list stays put until the new one arrives" (no loading state), `Clear search & filters` (its own `runSearch('', '')` runs with the old place, then the debounce refetches with the cleared one), selection rules in `fetchJobs`.

## Verification

- Local gates: `tsc` app + worker, eslint on `src/lib/ats.ts` + `src/pages/Jobs.tsx` (only the pre-existing `exhaustive-deps` warning), build, verify-dist.
- Production after deploy: see `docs/handoff-context.md` R733 entry (`/ats-checker` Perk pool at 1280 + 375; nurse/Boston → clear → barista → Search transition with request log; console/network/bundle).
