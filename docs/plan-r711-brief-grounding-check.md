# R711 — Deterministic grounding check for the interview brief / cover letter (follow-up to R705)

## Why

R705 made the interview brief, questions, feedback and cover letter prompts cite the resume and computed tenure server-side. That is prompt-level: one production sample looked right, but nothing proves a given output honoured the rules, and the user has no way to tell a cited angle from an invented one without re-reading the resume. R705's honest-limits section named the gap: "no deterministic post-check strips unsupported claims yet".

## Evidence (labelled samples, `qa/golden-diagnostics.json` + `qa/r705-brief-after.txt`)

Same Alex Morgan resume / Lemon.io JD, two real production briefs:

| Sample | Manual labels (R705 table) | `briefGrounding` | `unsupportedClaims` |
| --- | --- | --- | --- |
| R703 golden (before R705) | Q5 "I use AI tools…" invented; Q7 "I already work remote-style" invented; Q3 "SSR concepts are familiar" invented; Story 1 code-splitting / backend coordination invented | uncited angles **5, 7**; stories **1, 2, 3** quote no resume bullet | terms **SSR** |
| R705 after | none | 0 uncited of 8; 0 unquoted of 3 | terms MTTR, Copilot, Cursor (all inside GAPS advice "tools like Copilot or Cursor", i.e. suggestions, not experience — the banner says so) |
| interview template (`insertTemplate`) | n/a | `null` (not the brief's shape → no banner) | none |
| synthetic cover letter with Datadog / MTTR / 45% / GraphQL added | 4 invented | n/a | terms Datadog, MTTR, GraphQL; figure 45% — Redux, 120, Alex Morgan (in the resume) not flagged |

Q3 is caught by the term check, not the angle check: its angle says "Not in commercial projects listed", which the check accepts as naming a gap. The R703 cover letter had 0 flagged terms/figures (it paraphrased duties rather than inventing names).

## Design — `src/lib/grounding.ts` (client-side, no AI call, no server change)

- `briefGrounding(text, resumeText, anchors)` checks the contract the R705 prompt sets. Parses the brief's own headings (`LIKELY QUESTIONS`, `YOUR STORIES`); returns `null` when either heading is missing (template, user-written, older output). Per question: the angle (after the `?`, else after the first line break / " — ") must name an employer or school (`anchors` = `resume.experience[].company` + `resume.education[].school`, full name or distinctive first word ≥ 5 letters), quote a resume line, or use gap language (`no direct evidence`, `gap`, `honest`, `not stated / listed / in the resume`, `has not`, `would need to`…). Per story: some quoted span ≥ 20 chars must be in the resume (punctuation/case-folded substring) or share ≥ 70% of its words with a single resume line (tolerates "3.2 seconds" vs "3.2s").
- `unsupportedClaims(text, sources)` for both brief and cover letter: capitalised runs (`GitHub Actions`, `Node.js`, `AWS`) minus sentence-initial ordinary words and a generic-caps stoplist (months, STAR letters, headings), and figures that read as evidence (%, $, decimals, counts ≥ 10; not tenures / durations / list indices / years) — flagged when in none of resume text, job description, the user's highlights, company, addressee, target role. Loose containment folds punctuation so "Node.js" matches "NodeJS".
- Builder `BundleToolDialog`: `useMemo` over the result text, so the banner updates as the user edits (a flagged story disappears once it quotes a real bullet). Amber banner "Check against your resume before you rely on this:" with one line each for uncited angles, unquoted stories, unsupported terms ("— a suggestion, not your experience"), unsupported figures. Interview briefs that pass get a green "Grounded: all N answer angles cite your resume or name a gap, and all M stories quote a resume bullet." Cover letters show nothing when clean (the check cannot see paraphrased duties, so a positive claim would overreach). Resignation letters are not resume-grounded and are skipped. `role=status` (WCAG 4.1.3, same pattern as the placeholder banner).

## Honest limits

- Token-level. Invented **lower-case** claims ("applied code-splitting", "I use AI tools") are only caught indirectly — via the story-quote rule or when the angle cites nothing — never as terms. A brief that cites an employer and then invents a duty at that employer passes the angle check.
- Gap-language and anchor matching are regex heuristics validated on two real briefs + one template + one synthetic letter; no larger labelled set exists yet. Expect some false "uncited" on angles that paraphrase a bullet without naming the employer.
- Terms inside GAPS advice (Copilot / Cursor) are flagged although they are legitimate suggestions; the banner wording accounts for that rather than trying to tell advice from claims.
- Companies/schools come from the structured resume; a resume imported as free text with empty company fields falls back to quote / gap matching only.

## Production evidence (index-DO7eryVq.js, `qa/r711-evidence.cjs 1280|375`, `qa/shots/r711/*`)

Both real briefs pasted into the result box of `/builder?doc=interview` (zero generation calls; only `GET /api/ai/quota`):

- R703 brief → "Answer angles 5, 7 cite nothing from your resume and don't name a gap… / Stories 1, 2, 3 don't quote a bullet from your resume… / Not in your resume or the job ad: SSR — fine as a question or a suggestion…"
- R705 brief → green "Grounded: all 8 answer angles cite your resume or name a gap, and all 3 stories quote a resume bullet." + note for MTTR, Copilot, Cursor
- R703 brief with story 1 given a real quoted bullet → live update to "Stories 2, 3"
- `/builder?doc=cover&company=Lemon.io` synthetic letter → "Datadog, MTTR, GraphQL / Figure not in your resume or the job ad: 45%"; with those sentences removed → no banner
- empty and template states → no banner; identical at 1280 and 375; 0 console errors; storage back to baseline.
