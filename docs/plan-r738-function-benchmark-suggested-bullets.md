# R738 — function benchmark refresh (10 rounds after R733): refreshed P0/P1 list, top item = inline AI bullets borrow job-ad duties with no post-check

R738 is an audit/prioritisation round. It changes no product source; the selected item is implemented in R739.

## Benchmark evidence (first-hand, 2026-09-06)

- **Rezi public pages** re-fetched server-side (`qa/r738-rezi.mjs` → `qa/r738-rezi.json`, same 8 URLs as R713/R723/R733): 7 of 8 HTTP 200 (`/`, `/ai-resume-builder`, `/pricing`, `/resume-checker` → `/tools/resume-checker`, `/job-search` → `/tools/job-search`, `/ai-cover-letter-builder` → `/tools/cover-letter-generator`, `/ai-interview` → `/tools/ai-interview-practice`); `/resume-keyword-scanner` still 404. Headings byte-identical to the R733 snapshot: "Build / Score / Target", "Tailor your resume to any job description using AI", "Instant AI resume scoring with feedback and suggestions", "Integrated AI resume summary writing", "Connect Claude/Codex/Grok/Lovable/Gemini/Cursor MCP", "Over 900 sample resumes", checker "Upload → Analysis → Review / Real-time content analysis / ATS-compatibility guardrails", job search "1.3M jobs sourced directly from company websites / Updated hourly / This is not a job board", cover letter "in seconds", interview "Data-driven AI interview feedback". Marketing copy only — it says what Rezi sells, not how honest its output is. The table compares *our* production behaviour against those advertised capabilities.
- **Our production** (`qa/r738-prod.mjs` → `qa/r738-prod.json`): bundle `index-Cmsbwu6M.js` (= R737) on `/`, `/builder`, `/dashboard`, `/jobs`, `/documents`, `/ats-checker`, `/samples`; `/pricing` 307 to the static page; `/examples/`, `/templates/` 200. `/api/health` `{ok:true,llmConfigured:true}`; `/api/billing/status` `{checkoutEnabled:false, provider:lemonsqueezy, freeMode:true}`; `/api/ai/quota` `{freeRemaining:null}` (QA header). Search: `frontend engineer` 72 jobs (top: Staff Frontend Engineer @ ClickUp, Senior Full-Stack Engineer @ Soda Data, Senior Frontend Engineer @ ClickUp), `registered nurse` 3, `data analyst london` 9 — multi-source, not remote-only.
- **Inline AI writing on production, 4 real AI POSTs, all 200, no retry** (`qa/r738-ai-writing.cjs` → `qa/r738-ai-writing.json`, `qa/shots/r738/01…04.png`; R733's Alex Morgan resume + the Perk "Senior Frontend Engineer - London" ad seeded as the target job; 0 console errors, 0 HTTP ≥ 400, storage cleared afterwards). This is the first round to exercise the builder's per-entry buttons ("AI rewrite bullets", "…with key numbers", "Suggest a bullet", "…with key numbers") on production instead of Tailor / cover / brief:

  | Call | Wall | Output (verbatim) | Grounded? |
  |---|---|---|---|
  | `rewrite` bullets, Harbor Analytics (3 bullets) | 6.8 s | three faithful paraphrases; every figure (120 accounts, 35 %, two designers, three engineers) preserved | yes |
  | `rewrite` "…with key numbers", same | 29.8 s | numbers preserved, but "Improved dashboard **rendering performance** by 35%" became "Reduced dashboard **load times** by 35%" (same figure, different metric) and "reviewing code" became "**leading** code reviews"; "architecting", "platform" are JD words | wording drift, no invented figure |
  | `suggest-bullet` "…with key numbers", Northstar Digital | 4.4 s | "Authored **technical design documents** for a **multi-sided booking experience** across [number] internal teams, aligning product managers and engineers on scope and reducing implementation rework by [add %]." | **no** — `multi-sided`, `booking`, `design documents` occur only in the Perk ad; the resume's Northstar bullets are a checkout redesign, a component library and Playwright tests |
  | `suggest-bullet` plain, Northstar Digital | 7.4 s | "Authored frontend design documents for [project name], aligning product, design, and backend teams on a **multi-sided** experience spanning [user types] and reducing rework by [add %]." | **no** — same borrowed duty |

  The "Suggested bullet" dialog showed each draft with *Apply to entry / Regenerate / Cancel* and the description "Review the draft before it lands on your resume" — no note that the activity is not on the resume. The rewrite picker's description reads "Three honest takes on your text — nothing invented" unconditionally; nothing checks it.

- Replaying the four outputs through the existing R712 check (`qa/r738-probe.mts`, `tailorClaims(original, line, resumeText, jd)`): `figures` and `terms` are empty for all 22 lines (no invented numbers or names — the prompts' placeholder rule held); `mirrored` names `multi-sided, booking, technical, internal, teams, aligning` for the first suggestion and `aligning, teams, multi-sided, spanning` for the second — i.e. the signal exists — but on the rewrites it also lists generic verbs (`using`, `building`, `applying`, `Supported`) that happen to be in the ad. `extractKeywords(jd)` ∩ suggestion catches nothing (the Perk pool is `engineering senior technical events product platform design lead …`, all of which the resume already hits), so the ATS pool is not the right denominator.

### Dimension by dimension (delta vs R733)

| # | Dimension | R738 first-hand result | Verdict |
|---|---|---|---|
| 1 | Workbench (entities) | routes + bundle current; R735 dashboard fix live (R735 QA); relationship/undo model unchanged since R733's byte-identical Undo | parity |
| 2 | AI writing | Tailor / cover / brief now carry deterministic post-checks (R711/R712/R736/R737). **The per-entry bullet paths do not**: "Suggest a bullet" returned a Perk duty as Northstar experience in 2/2 production calls; key-number rewrite re-attributed a figure (rendering → load time) and escalated "reviewing" → "leading" | **P1 → R739** |
| 3 | Scoring / keywords | R733/R734 pool fixes live (R734 QA: Perk pool 23, no `social media` / `don`); no new corpus this round | parity; labelled precision/recall set still open |
| 4 | Tailoring | review-protected accept unchanged; the only unchecked route into the resume is now #2 | see #2 |
| 5 | Cover letters | R736 wording rules + `preferenceClaims` live; JD-framing "purpose" additions still uncaught (R736 limit) | parity; P2 |
| 6 | Interview prep | R736/R737 grounding verdict live (Grounded 8/8 + 3/3 on both kept briefs); second-person inferences prompt-only | parity; P2 |
| 7 | Job search | 72 / 3 / 9 rows for the three probes, three sources + Muse for cities; R733 place-race fix live; Boston on-site inventory = Muse employer base | parity vs advertised set minus inventory; P2 |
| 8 | Import | unchanged since R714 (categorised skills, wrapped bullets, GitHub) | parity |
| 9 | Landing / funnel | routes 200, `/pricing` static; upload → score → builder unchanged; email gate on download is a product decision | P2 (unchanged) |
| 10 | Architecture | health/billing/quota endpoints truthful; streaming + h2/h3 cancellation (R728–R732) unchanged; this round's 4 buffered calls 4.4–29.8 s wall | P2 latency (upstream) |

### Refreshed P0/P1 list (ordered by value)

| Priority | Gap | Basis | Plan |
|---|---|---|---|
| **P1** | "Suggest a bullet" / "…with key numbers" / "Complete line" and the rewrite picker put text on the resume with no deterministic grounding check; production drafts borrowed the job ad's duties (`multi-sided booking experience`, `design documents`) as the candidate's own, and the picker asserts "nothing invented" without checking | `qa/r738-ai-writing.json` calls 3–4 (2/2), call 2 wording drift; `qa/r738-probe.mts` shows `mirrored` already separates the borrowed terms | **R739**: post-check in `bulletSuggest` dialog and `variantPick` — job-ad terms the resume never states named per draft ("From the job ad, not your resume: …"), Apply relabelled to acknowledge, picker copy conditional; low-noise `mirrored` for drafts without an original (drop generic verbs / function words, keep hyphenated, capitalised and multi-word ad terms); fixtures: R712 Tailor, R733/R736 outputs, these four calls |
| P1-design | The suggest prompt is self-contradictory: "describe a typical, checkable achievement for that kind of role … cover a different responsibility" vs "ground only in what the resume already shows" — a new bullet is by definition not on the resume | `worker/prompts.ts` `buildSuggestBulletMessages` | R739 (same PR): prompt asks for a *candidate* bullet the user must confirm, JD used for vocabulary only when the existing bullets support it; dialog says the draft is a suggestion to confirm, not a fact |
| P2 | Key-number rewrite re-attributes an existing figure to a different metric ("rendering performance" → "load times") | call 2 | prompt line for key-numbers mode ("keep each figure attached to the same measure"); deterministic catch would need a metric-noun map — not planned |
| P2 | Cover letter borrows JD purpose framing for a real bullet | R736 limit | `mirrored`-style check on the letter (R740 candidate) |
| P2 | Boston / on-site inventory limited to The Muse employers | R717/R723/R733 | Adzuna/JSearch key request stands |
| P2 | `titled` 3 / 5 % thresholds and ATS keyword pool have no labelled set | R721/R725/R734 | corpus work when a functional round is free |

No P0 found: every route, API and AI call succeeded, nothing was lost or overwritten, quota/payment safety unchanged.

## Why the top item is #1

Rezi's advertised writer generates bullets from a title ("AI bullet point writer"), so on *features* the two are at parity. Our differentiator is that AI text reaching the resume is grounded and *checkable* — that promise is kept for Tailor (R712), cover/brief (R711/R736/R737) and keyword bullets (R715 guard) but not for the four per-entry buttons, which are the most visible AI actions on every experience/project/involvement card. The production drafts show the failure is real, cheap to reproduce (2/2), and would ship a fabricated duty under a dialog that says "Review the draft" and a picker that says "nothing invented".

## R739 scope (implementation round)

1. `src/lib/grounding.ts`: `draftClaims(text, resumeText, jobDescription, own?)` — reuse `unsupportedClaims` for figures/names and a filtered `mirrored` for job-ad terms; unit-style probe over the R712 Tailor fixture, R733/R736 kept outputs and `qa/r738-ai-writing.json` (expected: suggestions 3–4 flagged on `multi-sided`, `booking`, `design documents`; rewrite call 1 clean; call 2 at most `leading`).
2. `src/pages/Builder.tsx`: `bulletSuggest` dialog and `variantPick` show the note per draft, highlight the terms, Apply reads "Apply anyway" while flagged; picker description conditional.
3. `worker/prompts.ts`: suggest prompt framed as a candidate the user confirms; JD vocabulary only where existing bullets support it.
4. Gates (tsc app + worker, eslint changed files, build, verify-dist), deploy, production QA 1280 + 375 with ≤ 2 real AI calls plus zero-call replay of the four kept outputs via route mock, storage back to baseline, PR via builtin tooling.

## Limitations of this audit

- Rezi evidence is public marketing copy; no Rezi account was used, so Rezi's own grounding behaviour is unknown.
- 4 production AI samples (quota discipline); the borrowed-duty failure reproduced 2/2 for one resume/ad pair — R739 must add fixtures from other pairs before tuning thresholds.
- Landing, import, workbench and job-search rows in the table rest on R733–R737 production QA plus this round's route/API probe, not a fresh full golden path.
- Deterministic checks remain token-level: a duty invented in resume vocabulary still passes (R711 limit unchanged).
