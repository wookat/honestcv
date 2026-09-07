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
| **P1 (found R710)** | Matching was exact-string after extraction: `dashboards` ≠ `dashboard`, `analysing` ≠ `analyzed`, `PostgreSQL` ≠ `Postgres`, `Kubernetes` ≠ `K8s`, `Node.js` ≠ `Node`, `GCP` ≠ `Google Cloud`, `machine learning` ≠ `ML` — a resume stating all 15 requirement terms in ordinary wording scored **27 %** with 10 "high-priority" gaps that were all on the page | Rezi Keyword Scanner credits synonyms/variants | **R710**: Porter stem (`stemmer`) + UK→US fold + curated alias groups, tried exact → stem → alias; 27 % → 93 % (`data` the only true gap); Matched chips / ATS-checker badges say `as "postgres"`, preview highlight paints the resume's wording. See docs/plan-r710-keyword-variants.md. |
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

---

## R713 refresh (10 rounds after R703) — function-oriented SOP-10 benchmark

Evidence is first-hand and dated 2026-09-06: Rezi public pages fetched server-side (`qa/r713-rezi.mjs` → `qa/r713-rezi.json`, HTTP 200 for 7 of 8 URLs; `/resume-keyword-scanner` is a 404 and was dropped), our production probed directly (`qa/r713-prod.mjs` → `qa/r713-prod.json`, `x-qa: 1`), plus the real-fixture golden path in `qa/r714-evidence.cjs` / `qa/r714-mobile.cjs`. Rezi numbers ("4.3M users", "1.3M jobs", "updated hourly") are **vendor claims** read off the page, not measured.

### Dimension by dimension

| # | Dimension | Rezi (public page, first-hand read) | HonestCV production (first-hand) | Verdict |
|---|---|---|---|---|
| 1 | Workbench / entity operations | "Integrated job tracking … categorized by stage", "utility-first bulk actions" (`/tools/job-search`) | `/jobs` tracked board with statuses, reminders, notes, linked copy / cover letter / brief per job, undo on untrack/delete; dashboard folders, bulk move, duplicate (R586–R702) | parity; ours additionally discloses orphan/superseded relationships — no gap |
| 2 | AI writing | "powered by frontier LLMs", bullet writing, "Integrated AI resume summary writing", cover letter "in seconds" | 13 Worker AI routes (rewrite, summary, skills, keyword-bullet, suggest-bullet, tailor, cover letter, resignation, brief/questions/feedback, assistant); grounded prompts (R705) + deterministic post-checks (R711/R712); malformed-output retry (R706); `/api/health` `llmConfigured:true` | parity; ours is stricter on provenance — no gap |
| 3 | Scoring | "Instant AI resume scoring with feedback and suggestions", "Real-time content analysis", "ATS-compatibility guardrails" | live score + Health dialog + keyword match with curated skills, floors, stems/aliases (R708–R710); `/ats-checker` upload → "91 out of 100" on the Alex Morgan fixture | parity — no gap |
| 4 | Tailoring / targeting | "Tailor your resume to any job description", "Customize your resume keywords to match job requirements", "automatically create a targeted resume in a few clicks" | Tailor-to-job suggestions with per-line grounding flags (R712); targeted copies per tracked job; missing-keyword chips with "+ kw" | **P1 residual**: R712's production sample stayed 60 % → 60 % because suggestions did not address the missing keywords (see priority table) |
| 5 | Cover letters | "Write a tailored cover letter in seconds" | `/api/ai/cover-letter` grounded + post-check, saved as career document linked to the job (R601–R607) | parity — no gap |
| 6 | Interview prep | "mock interview … detailed AI feedback report", "Behavioral interview mastery" (`/tools/ai-interview-practice`) | brief + question set + practice loop with timer, per-answer STAR/keyword score, AI feedback, running score, end report (R707) | parity — no gap |
| 7 | Job search | "1.3M jobs sourced directly from company websites", "sourced from all leading ATSs" (vendor claim) | `/api/jobs/search`: `frontend engineer` → 71 relevant jobs (top 5 all frontend), `registered nurse` → 3, `data analyst london` → 7 with 2/5 in London; three free feeds, no location filter | **P1**: coverage is thin outside tech and there is no location filter; needs Adzuna/JSearch credentials (**resource request**, unchanged since R707) |
| 8 | Import | "Can I upload my existing resume" (FAQ) | PDF/DOCX/TXT → `parseResumeText`; R703 fixed wrapped bullets + GitHub URL; **found this round**: categorised skills (`Languages: …` / `Frontend: …` / `Testing and tools: …`) were flattened to one comma line, so the preview and DOCX lost the categories and a wrapped `GitHub\nActions` could split | **P1 → fixed in R714 (this PR)** |
| 9 | Landing / homepage UI | hero → templates (17 named) → examples by category → job search → AI agent → mock interview → plans → FAQ; social-proof counters | hero upload → score, suite cards, samples, pricing, FAQ; 114 prerendered example/template pages | P2 — parity on structure; Rezi adds social-proof counts we cannot honestly show yet |
| 10 | Architecture | accounts + cloud sync; "Connect Claude/Codex/Grok/Gemini/Cursor MCP" | localStorage-first, Worker + KV, share links server-side, Lemon Squeezy (free mode `checkoutEnabled:false`) | P2 — deliberate choice; MCP connectors are a new Rezi differentiator, not a user-pain gap for our target |

Golden paths walked on production (`index-Bi9Ceaw9.js`, 1280 and 375): `/ats-checker` upload real PDF → score → "Fix in builder" → builder preview/score; `/jobs` search three queries; all ten routes 200 (`/pricing` 307 → `/pricing/`), 0 console errors, only `GET /api/ai/quota` as AI traffic.

### Refreshed P0/P1 list (ordered by value)

| Priority | Gap | Basis | Plan |
|---|---|---|---|
| **P1 (fixed R714)** | Structured skills flattened on import | `qa/r714-probe.mts` on the real fixture: `"Languages: …, Frontend: …, Testing and tools: …"` as one line before; three labelled lines after; wrapped `GitHub Actions` / `performance profiling` kept whole | `joinSkillLines()` in `src/lib/importText.ts` (this PR) |
| **P1 (fixed R715)** | Tailor suggestions ignore the job's missing keywords (60 % → 60 % on the R712 sample) | `qa/r712-tailor-1.json`: 5 rewrites, none mentions `graphql` / `next.js` — by design: the prompt forbids adding facts the item lacks, so a prompt change would invite the R712 inflation | **R715** (docs/plan-r715-tailor-missing-keywords.md): the report's "Still missing" pills open the grounded `KeywordBulletDialog` for that keyword (guarded while suggestions are unreviewed); prompt / API / R712 flags unchanged. Side fixes: `ideally`-class stop words, role filter keeps skills named in the title (`Python Developer` → `python` stays) |
| **P1 (resource)** | Job search coverage / location filter | `qa/r713-prod.json`: nurse 3 results, London query 2/5 London | **R716** once Adzuna/JSearch keys exist; until then keep aggregate fallback (no code change) |
| P2 | Import: DOCX skills with tab/`|` separators, non-Latin category labels | not sampled | **R717** if a real fixture shows it |
| P2 | Landing social-proof / template gallery parity | Rezi homepage | no round planned |
| P2 | Accounts / cloud sync / MCP connectors | Rezi architecture | no round planned |

**Selected next item**: R714 = structured-skill import (done in this PR, highest certainty and zero AI cost); R715 = Tailor missing-keyword coverage.

### R714 — categorised skills survive import (`src/lib/importText.ts` only)

```ts
const SKILL_LABEL_RE = /^([A-Za-z][^:,]{0,39}):\s+(.+)$/
function joinSkillLines(lines): string
  // no labelled line → old behaviour: one comma-joined line
  // labelled lines → one line per category; a line that starts lowercase,
  //   follows a trailing comma, or follows a ≥45-char label line is a visual wrap
  //   and is appended to the previous category
```

Renderer (`skillLines()` in `src/lib/resume.ts`), preview and DOCX exporter already understand `Label: items` lines, so no other file changes and the API/storage contract is unchanged.

Probe results (`npx tsx qa/r714-probe.mts`): fixture → 3 labelled lines; wrapped → `performance profiling` and `GitHub Actions` rejoined; bulleted `• Languages: …` → 2 labelled lines; flat newline list and `TypeScript, React • Node.js | PostgreSQL` → unchanged comma line; mixed labelled + unlabelled → 2 lines; `https://example.com` not mistaken for a label (regex requires `:` followed by whitespace).

Production QA (`qa/r714-evidence.cjs` 1280, `qa/r714-mobile.cjs` 375; `index-Bi9Ceaw9.js`): skills field holds the three categories verbatim, preview shows three rows with bold `Languages:` / `Frontend:` / `Testing and tools:`, 6 bullets, website `github.com/alexmorgan-example`, ATS 91/100, `scrollWidth === clientWidth` at both widths, 0 console errors, AI traffic = `GET /api/ai/quota` only. Mobile preview reached via `getByRole('button', { name: /Preview & score/ })` (the first probe used `/^Preview$/`, which does not exist — script error, not product). The first mobile probe printed rows with `.slice(0, 60)`, which looked like clipping — probe artefact, not product. `qa/r714-mobile-geom.cjs` then measured the three rows in the scaled preview at 375: each spans x 42–318 of a 360px viewport, `scrollWidth ≤ clientWidth`, `white-space: normal`, bold label spans present, page overflow 0 (`qa/shots/r714-skills-375.png`).

Known limits: heuristic wrap detection (a genuinely unlabelled second line starting lowercase after a labelled line is treated as a wrap); one real fixture; DOCX/TXT import paths share the parser but were not re-run on production this round.
