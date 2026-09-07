# R703 — function-oriented SOP-10 benchmark vs Rezi (workbench / core AI features / landing / architecture) + P1 fix: PDF import split every wrapped bullet in two

The last ~30 rounds were accessibility sweeps (forced-colors, live regions, focus). This node re-benchmarks the *product* against Rezi's public offering and re-audits RezUp's own golden paths with a realistic resume, so the next rounds go to functional P0/P1 gaps.

## Evidence

### Rezi public product (`qa/r698-rezi.json`, rezi.ai homepage + /ai-resume-builder + /tools/ai-interview-practice + rezi-docs)

Surface Rezi advertises: AI Resume Builder (Build → Score → Target), AI Resume Agent (conversational edits), Resume Checker, Keyword Scanner, Bullet Point Writer, Summary Generator, Cover Letter + Resignation Letter generators, Job Search (search / filters / structured details / Apply / Target Resume / tracking), AI Interview (role-specific questions, STAR practice, per-answer feedback, performance score, missing-keyword feedback), 900+ samples, templates, Chrome extension, MCP.

### RezUp production golden-path audit (testing agent, `qa/golden-plan.md`, `qa/golden-shots/*.png`, `qa/golden-imported.json`, `qa/golden-diagnostics.json`; bundle index-CvWx9zag.js at start)

Realistic one-page PDF (`qa/alex-morgan-resume.pdf`: 2 roles × 3 bullets, education, 3 skill lines, LinkedIn + GitHub).

| # | path | result | severity |
| --- | --- | --- | --- |
| 1 | Landing / `/ats-checker` upload → score | works; score + fixes shown | — |
| 2 | `Fix in builder` import fidelity | **6 wrapped bullets → 12 bullets** (`…from 3.2` / `seconds to 1.8 seconds.` as separate achievements); ATS then raises false punctuation / verb / metric warnings on the fragments; `github.com/…` in the header dropped (no `website`) — name / email / phone / roles / employers / dates / education / skills preserved (`golden-shots/05-import-split-bullets.png`) | **P1 — fixed in this round** |
| 3 | `/api/jobs/search` | Remotive upstream now returns **18 jobs total for every query and category** (`?search=frontend engineer`, `?category=software-dev`, `?search=react` → same 18); "frontend engineer" = 0 results on our board, "product manager" = 1 unrelated Head of Marketing, London filter = 6 "Worldwide" | **P0 — R704** |
| 4 | Tailor to job | first POST 502 ("The AI service is having trouble…"), retry produced one truthful rewrite; Apply changed preview | P1 (reliability, see below) |
| 5 | AI assistant "improve my summary" → Apply | works, grounded | — |
| 6 | Interview brief for a tracked job | brief **asserts facts not in the resume** (AI-tool usage, code-splitting / payload work, remote-work claims) and mis-computes tenure ("July 2020 is ~4 years" with a Sept-2026 clock) | **P1 — R705** |
| 7 | Save job → targeted copy → cover letter → interview pipeline | works end-to-end | — |
| 8–10 | exports / share link / mobile / documents | pending in the testing agent's final report; added to `docs/handoff-context.md` when it lands | — |

### Direct reproduction of #2 (this session)

`pdftotext -layout qa/alex-morgan-resume.pdf` gives one line per visual line; the generic parser's experience branch had no wrapped-line logic (only the LinkedIn-export branch did): every marker-less line that `looksLikeBodyLine` (ends in `.` or is >60 chars) became a new bullet. Custom sections (Awards, Publications…) had the same behaviour. `contact.website` was never populated by the generic parser at all (only `linkedin`).

## Gap list (P0/P1, function-oriented; accessibility only when incidental)

| pri | gap | Rezi reference | plan |
| --- | --- | --- | --- |
| **P0** | Job search source is effectively dead (18 jobs worldwide, no relevance) | Job Search with real listings, search, filters, Apply, Target Resume | **R704**: aggregate keyless feeds — Jobicy (`tag`/`geo` honoured, 50/request), Arbeitnow (250/page, EU on-site + remote), Remotive (kept) — normalise, dedupe by URL/title+company, enforce query tokens locally (already done), cache per query in KV. Adzuna/JSearch (location-aware, non-remote) need API keys → resource request to the boss, stub-free fallback stays the aggregate. |
| **P1** | Import corrupts wrapped bullets, drops GitHub | Rezi imports PDF/DOCX into structured sections | **R703 (this PR)**: `continuesPrevious()` joins a marker-less line that starts in lowercase / a currency sign to the previous bullet when that bullet has no terminal punctuation and the line is not a date range; applied to experience + custom sections. `contact.website` ← first GitHub URL, else first non-LinkedIn URL in the 6-line header (emails masked first). |
| **P1** | Interview brief invents facts / wrong tenure arithmetic | Rezi AI Interview is grounded on resume + JD | **R705**: pass `today` into the interview prompts, add the same "never invent employers / tools / metrics" clause used by `buildAssistantMessages`, and post-check the brief against the resume text (drop claims whose key nouns are absent). |
| **P1** | AI endpoints surface a raw 502 on first call | — | **R706**: one automatic retry with backoff in `callLLM` for 5xx / network errors before surfacing the error; status text "Retrying…". |
| **P1 → downgraded P2 in R707** | ~~Interview prep is a static brief + Q list with one-shot feedback, not a practice loop~~ **Correction (R707 code + production check):** the builder already has "Practice all N" (one question at a time, 2-minute timer, per-answer local STAR/keyword/pace score, AI coaching per answer, session report with per-question scores). The only Rezi element missing was a *running* score visible during the session. | Rezi AI Interview: ask → answer → STAR feedback → score, per question | **R707**: running average shown in the session header; no new endpoint. |
| **P1 (confirmed R708)** | Keyword match reports 100% on a realistic JD while GraphQL / Next.js (named once, "is a plus") are missing from the resume — `extractKeywords` kept only tokens repeated ≥2× once the JD had ≥40 distinct tokens, so a ~100-word ad yielded 5 keywords (`rest api, design system, frontend, applications, product`) and dropped React / TypeScript / Storybook / Playwright / Jest / GraphQL / Next.js | Rezi Keyword Scanner lists every hard skill in the ad, missing ones first | **R708**: curated `KNOWN_SKILLS` vocabulary + `TECH_SHAPE_RE` (`*.js`, `c++`, `c#`, `html5`) keep single-mention skills and rank them above frequency words; golden JD → 18 keywords, 88%, missing = `graphql, next.js`. |
| **P1 (found R709)** | Short ads (~60–90 words) fell under the `counts.size < 40` cliff: every single-mention word became a keyword in reading order (company, city, `compassionate`, `32-bed`, `ll`, `4+`) while the requirements list at the end was cut by the 30 cap; inline `Requirements: …` lists never counted as the requirements block | Rezi Keyword Scanner lists the ad's requirement terms | **R709**: floor instead of cliff — repeated/skill tokens first, then top-up to 15 from the requirements block; contraction/digit tokens filtered; `Company — City` line excluded; nurse ad 50% with 14 noise gaps → 77% with `acls, therapy, medical/surgical`. |
| P2 | Landing UI — parity: hero upload → score, feature suite, samples; Rezi adds social proof counts and template gallery on the homepage | — | no round planned |
| P2 | Architecture: localStorage-first, Worker + KV, no accounts — a deliberate choice, not a defect; share links already server-side | Rezi: accounts + cloud sync | no round planned |

## Fix in this PR (`src/lib/importText.ts` only)

```ts
const continuesPrevious = (prev, line) =>
  !!prev && !/[.!?:;]$/.test(prev) && !isBullet(line) &&
  /^[a-zà-ÿ$€£]/.test(line) && !DATE_RANGE_RE.test(line)
```

- experience: `isBullet` → push; else if `continuesPrevious(lastBullet, line)` → append `" " + line` to the last bullet; else the existing date / header / body logic.
- custom sections: same join before `push(stripBullet(line))`.
- `contact.website`: header (first 6 non-empty lines, emails blanked) → `GITHUB_RE` match, else first `URL_RE` match that is not LinkedIn and has a scheme / `www.` / common TLD.

Not changed: LinkedIn-export branch (already merged wrapped lines), education, projects, skills, summary, ATS scoring.

## QA

- Local: `pdftotext` text through `parseResumeText` before/after — 12 → 6 bullets, all six identical to the source sentences, `website: github.com/alexmorgan-example`, roles / companies / locations / dates / education unchanged.
- Production (`qa/r703-import-verify.cjs 1280|375`, fresh incognito context each, index-MCZ4b8OR.js): `/ats-checker` upload → "Your ATS match score — 91 out of 100" → `Fix in builder` → `honestcv.resume` has 6 bullets, `website` set, both roles with location + dates, builder shows 95/100, 0 console errors.
