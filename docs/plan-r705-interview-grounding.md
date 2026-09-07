# R705 — Interview brief / questions / feedback grounded in the resume; tenure computed, not guessed (P1 from R703)

## Evidence (golden path, `qa/golden-diagnostics.json`, production before this change)

Interview brief for the Alex Morgan fixture (Northstar Digital Jan 2022 – Present, Harbor Analytics Jul 2020 – Dec 2021) against the Lemon.io "Senior Node & React" JD:

| Brief said | Resume says | Verdict |
| --- | --- | --- |
| "I use AI tools to scaffold components, generate test cases…" (Q5 angle) | no AI tooling anywhere | invented |
| "I already work remote-style with product, design, and backend teams" (Q7 angle) | no work arrangement stated | invented |
| Story 1: "applied code-splitting … coordinated with backend on payload changes" | bullet only says "Led a React and TypeScript checkout redesign that reduced median page load time from 3.2s to 1.8s" | invented method/detail |
| "Your listed commercial experience starts July 2020 (~4 years)" | Jul 2020 → Sep 2026 = 6 years 3 months | wrong arithmetic — the model has no clock |

Root causes in `worker/prompts.ts`: `buildInterviewBriefMessages` had one line ("Never fabricate experience") and no date; the model estimated "Present" from its training cut-off and filled STAR gaps with plausible-sounding specifics. `buildInterviewQuestionsMessages` / `buildInterviewFeedbackMessages` shared the same weakness; `buildCoverLetterMessages` likewise.

## Design

`worker/prompts.ts`:

- `tenureFacts(resumeText, today)` — deterministic arithmetic for every `(start – end|Present)` heading in the plain-text resume (the shape `resumeToPlainText` emits: `Title at Company (Jul 2020 – Present)`). Accepts `Mon YYYY`, `Month YYYY`, `YYYY-MM`, `MM/YYYY`, `YYYY` (year-only end counts through December). Emits `- <heading> (<start> – <end>): N years M months[, ongoing]`, max 12 lines.
- `groundingRules(resumeText, today)` — shared block appended to the three interview system prompts: today's date + pre-computed tenures ("never do the date arithmetic yourself"), the ban on attributing tools / technologies / methods / employers / team sizes / remote-hybrid work / metrics / certifications / duties the resume does not state ("a JD requirement the resume lacks is a gap, not experience"), and bracketed placeholders for unknowns.
- Brief prompt: each LIKELY QUESTION angle must cite the employer/bullet or say "no direct evidence — position it as a gap"; each STAR story is built from one quoted bullet with placeholders for what the bullet does not give.
- Questions prompt: behavioral questions may only reference employers / projects / tools / dates in the resume.
- Cover letter prompt: every skill / tool / employer / metric / duty must appear in the resume or the user's "details to highlight".
- All builders take `today = new Date()` so tests can pin the clock; the Worker endpoints are unchanged (the default is request time).

No client change, no schema change, no quota change.

## Verification

- Unit (tsx, clock pinned to 2026-09-07): `Jul 2020 – Present → 6 years 3 months, ongoing`; `2017 – 2020 → 4 years`; `2016-06 – 2016-09 → 4 months`; `06/2014 – Sept 2015 → 1 year 4 months`.
- tsc / eslint / build / verify-dist green; deployed (Workers Routes code 10000 as before, upload succeeded).
- Production after (`qa/r705-brief.cjs`, same request body as the golden run, fresh `x-client-id`, 1 AI call, `qa/r705-brief-after.txt`): AI tooling → "no direct evidence — position it as a gap"; remote work → "no direct evidence on remote/hybrid arrangement"; Story 1 quotes the bullet verbatim and uses `[add details on profiling tools used, team size, …]` instead of inventing code-splitting; tenure line reads "senior role at Northstar Digital ongoing for 4 years 9 months" (Jan 2022 → Sep 2026, correct); Node/Next/AWS/AI listed under GAPS. Latency 65s (model-side; the golden run was comparable).

## Honest limits

- One production sample after the change (quota discipline); the improvement is prompt-level, not a guarantee — no deterministic post-check strips unsupported claims yet (candidate for a later round: flag capitalised tech tokens absent from resume+JD).
- Interview questions / feedback / cover letter received the same rules but were not re-run in production this round (each is one more AI call); they are verified by tsc only.
- `tenureFacts` only parses the `(start – end)` heading shape; resumes pasted in other layouts get the date + rules without computed tenures.
