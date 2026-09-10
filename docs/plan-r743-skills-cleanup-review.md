# R743 — function benchmark refresh (10 rounds after R738) + "AI clean up skills" reviewed before it is applied

## 1. Benchmark (first-hand, 2026-09-07)

### Rezi public pages (`qa/r743-rezi.mjs` → `qa/r743-rezi.json`, server-side fetch, headings only)

| URL | Status | Advertised |
| --- | --- | --- |
| `/` | 200 | Build / Score / Target, 16 templates, 900+ examples, job search, "AI-powered resume agent", mock interview, Pro / Free |
| `/ai-resume-builder` | 200 | tailoring to a JD, keyword customisation, instant AI scoring, AI summary writing, MCP connectors (Claude / Codex / Grok / Lovable / Gemini / Cursor), dark mode, "any file format" |
| `/pricing` | 200 | Free / Pro / Enterprise |
| `/resume-checker` | 200 → `/tools/resume-checker` | upload → analysis → review, "ATS score vs resume score" |
| `/job-search` | 200 → `/tools/job-search` | "1.3M jobs sourced from company websites", hourly, tracking by stage, bulk actions |
| `/ai-cover-letter-builder` | 200 → `/tools/cover-letter-generator` | "tailored cover letter in seconds" |
| `/ai-interview` | 200 → `/tools/ai-interview-practice` | upload resume + JD → mock interview → feedback report |
| `/resume-keyword-scanner` | 404 | — |

Headings identical to the R738 snapshot. Marketing claims only — nothing here proves how Rezi's AI behaves.

### Production (`qa/r743-prod.mjs` → `qa/r743-prod.json`; `qa/r743-prod.cjs` → `qa/r743-prod-1280.json`)

- Bundle `index-BBDkW0np.js` (R742) on `/`, `/builder`, `/dashboard`, `/jobs`, `/documents`, `/ats-checker`, `/samples`, `/examples/`, `/templates/`; `/pricing` 307 (static page redirect as before).
- `/api/health` `{ok, llmConfigured}`, `/api/billing/status` free mode / checkout off, `/api/ai/quota` `freeRemaining: null` for an anonymous probe — all truthful.
- Job search 71 / 3 / 11 rows for `frontend engineer` / `registered nurse` / `data analyst london` (R738: 72 / 3 / 9). The probe could not read a per-row source field (`source` / `feed` / `provider` absent from the JSON) — a probe limitation, not evidence that attribution is missing.
- Golden path, 3 real AI calls, Northstar resume (`qa/r711-fixture.json`) + Perk ad (`qa/r736-jd.txt`), 0 console errors, storage restored:
  - **AI polish summary** (26.8 s): three takes in the picker; two flagged by R739's post-check (`real impact, shaping` + `Drives`; `why, behind` + `architecting`) — review-before-apply intact.
  - **Cover letter** (15.6 s, streamed): facts grounded (all figures are the resume's); prose still frames the ad's language as the candidate's purpose ("Perk Events' move from start-up to scale-up…", "maps to leading across boundaries") — the R742 stop-list candidate stands.
  - **AI clean up skills** (`qa/r743-skills.cjs`, 12.1 s, 1 call): input three labelled lines (`Languages: …` / `Frontend: …` / `Testing and tools: …`, 14 skills). Output one plain comma line, **saved without any dialog** (`dialogSeen false`, status "Saved", `linesBefore 3 → linesAfter 1`, labels 3 → 0). Item diff: nothing added or dropped, three renames (`responsive design → Responsive Web Design`, `accessibility → Web Accessibility`, `REST APIs → REST API`). The same click on a resume with a JD would let the prompt "group related skills" and "order by relevance", with no check that the list stayed the user's.

### Refreshed gap list

| Prio | Gap | Evidence | Disposition |
| --- | --- | --- | --- |
| **P1** | **Skills cleanup is the only AI write in the builder that mutates the resume with no review** — summary / bullets / suggest / keyword drafter / assistant / Tailor all show a draft first (R712, R739–R742). The prompt allowed "group related skills" and produced no structure guarantee; R714 spent a round *keeping* labelled skill lines on import and one click flattens them. | `qa/r743-skills.json`, `qa/r743-skills.cjs` | **this round** |
| P2 | Cover-letter prose borrows the ad's framing as the candidate's motivation | R743 cover letter, R742 probe | needs stop-list + own UI, next |
| P2 | Metric re-attribution in key-number rewrites (R738) | R738 | prompt-level only so far |
| P2 | Boston / on-site inventory (Adzuna / JSearch key request) | R717 | resource request open |
| P2 | ATS keyword precision / recall labelled set; `titled` 3 / 5 % threshold | R708–R710, R721 | no labelled set yet |
| P2 | Per-row job source not in the API JSON (if true) | probe | verify in code before calling it a gap |

No P0. No accessibility findings this round.

## 2. Design

Principles carried from R739–R742: nothing is written before the click; the check is deterministic and advisory; it says what it compared and what it cannot know.

### Prompt (`worker/prompts.ts`, `kind === 'skills'`)

- Cleanup = remove duplicates, canonical names, relevance order. **Keep every skill, add none** ("this is a cleanup, not a suggestion").
- Labelled lines in → one line per label in the same order, cleaned within each line; else one comma list.
- JD present → order by relevance and *prefer the ad's name for a skill the list already has*; **do not add skills from it**. (Other kinds keep the "mirror its keywords where truthful" instruction.)
- `/api/ai/rewrite` contract unchanged (`{text, freeRemaining}`).

### Deterministic comparison (`src/lib/grounding.ts`, `skillListChanges(before, after)`)

Items = labelled or plain lines split on commas. Two items are the same skill when their normalised keys match, or one item's word set is contained in the other's (`REST APIs` / `REST API`, `responsive design` / `Responsive Web Design`), or the ATS matcher (`keywordHit`: stems, UK/US spelling, alias table) matches them either way (`TS` / `TypeScript`, `JS` / `JavaScript`).

```ts
interface SkillListChanges {
  added: string[]      // in after, never in before (renames excluded)
  dropped: string[]    // in before, gone from after (renames excluded)
  renamed: [before, after][]
  categoriesLost: boolean  // before had ≥ 2 labelled lines, after has none
}
```

Renames are not warnings — that is the cleanup. Additions, drops and category loss are (`skillFlagGroups` in `src/components/DraftFlagList.tsx`: "Not in your skills list" / "Dropped from your skills list" / "Category lines flattened").

Offline probe (`qa/r743-skills-probe.mts`, 0 AI calls): production reply → `added [] dropped [] renamed ×3 categoriesLost true`; faithful reorder → nothing; `+GraphQL, Next.js` → added; `−Jest, Cypress` → dropped; `CI/CD pipelines → CI/CD` → rename; `TS → TypeScript` inside labelled lines → rename, categories kept; plain list → labelled lines is not a loss; empty reply → everything dropped (and the picker refuses an all-empty reply anyway).

### Builder (`src/pages/Builder.tsx`)

- `runRewrite` no longer has an `else apply(out)` branch: every usable reply opens `variantPick`; an all-blank reply throws "The AI returned nothing usable."
- `variantPick.kind` — `skills` candidates are checked with `skillListChanges` against `variantPick.original`; prose keeps `draftClaims`. Titles: "Review the cleaned-up skills" / "Review the polished summary" / "Review the rewrite" for one candidate, the existing "Pick a summary / Pick a rewrite" for several.
- Copy states what was compared: "compared item by item with your list — nothing added, dropped or flattened" vs "Anything added, dropped or flattened is marked below".
- Single-candidate label "Cleaned up" / "Rewritten"; Regenerate button reads "Regenerate" / "Regenerate avoiding this one" when there is one option.
- Picking a flagged **skills** candidate does **not** call `recordAppliedAnyway` — R742's exclusion is for borrowed prose; recording a whole skills line would remove every listed skill from later grounding evidence.
- Existing "AI suggest related skills" (additive, chip-based) unchanged.

## 3. Verification

- Gates: `tsc -p tsconfig.json`, `tsc -p worker/tsconfig.json`, eslint on changed files (0 errors; pre-existing `exhaustive-deps` + `only-export-components` warnings), `npm run build`, `node scripts/verify-dist.mjs` — green.
- Local Worker replay (`wrangler dev --local --port 8791` + `qa/r743-mock-llm.cjs`, an OpenAI-compatible SSE fake that records the prompt and answers a fixed string; **0 real AI calls**), `qa/r743-verify.cjs` at 1280 and 375:
  - Prompt received by the relay contains "Keep every skill the input lists and add none", the labelled-line rule, and "do not add skills from it" after the JD.
  - Real production reply as answer (1280): dialog "Review the cleaned-up skills", one flag "Category lines flattened", renames highlighted in the candidate, `localStorage.skills` unchanged while the dialog is open and after Escape; picking the candidate writes exactly the reply; 0 overflow, 0 console errors, storage back to baseline.
  - Reply that keeps the labels but adds `Next.js` and drops `Jest` (375): flags "Not in your skills list: Next.js" / "Dropped from your skills list: Jest", no category flag, `accessibility → Web Accessibility` treated as a rename; same storage discipline; `scrollWidth 375`.
  - Mock pitfall fixed on the way: the fake split the answer with `/.{1,16}/g`, which drops newlines and made every labelled line run together (a first run showed a bogus `CSS` drop) — `[\s\S]` now.
- Production after deploy: `qa/r743-verify.cjs` against `https://cv.zalize.com` (1 real call) — see handoff-context for the recorded result.

## 4. Limits

- Item comparison is lexical: a rename the matcher cannot pair (`k8s` vs `Kubernetes` is in the alias table; an unknown abbreviation is not) shows as one drop + one addition — the user sees both and decides. Lists in languages other than English get key-equality and word containment only.
- The prompt is a nudge; the comparison is the guard. n = 1 production sample of the new prompt (quota discipline).
- "Category lines flattened" only fires for ≥ 2 labelled lines → 0; a single `Skills: …` label becoming plain is not reported.
