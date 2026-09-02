# R287 — instant local "Target my job" assistant reply

## Evidence (first-party Rezi)

- AI Resume Agent guide (rezi.ai/rezi-docs/ai-resume-agent, updated 2026-07-16): the
  agent's three built-in prompts are **Improve My Rezi Score**, **Target My Resume**
  and **Find Jobs**. "If you select Target My Resume, the AI compares your resume
  with a job description and recommends edits that improve alignment."
- AI Keyword Targeting guide (ai-keyword-targeting-explained): the targeting tool
  shows "Keywords you've already included", "Missing keywords that appear in the job
  posting" and suggests bullets per missing keyword — this comparison is instant,
  not an AI chat round trip. "If you entered a job description at the beginning …
  Rezi automatically uses that information. If not, you can add a job title and
  description directly within the keyword targeting tool."
- Rezi Score guide: positions resume feedback as "instant feedback".

## Current HonestCV behavior

- The assistant's four quick tasks: "Improve my ATS score" (local since R265),
  "Draft my summary", "Suggest skills", and **"Target my job"** — the last one still
  sends an AI chat request even though `matchReport(resumeToPlainText(r), jd)`
  (ats.ts) already computes pct / covered / missing / highPriorityMissing locally,
  and the panel itself renders that report in its empty-state card and footer.
- With no JD pasted, the AI round trip burns one free call to say it can't compare.
- "Find jobs" (R240) and "Improve my ATS score" (R265) established the local-reply
  pattern (`findJobsReply`, `improveScoreReply`).

## Gap

The only remaining built-in prompt whose answer is fully computable locally still
costs a quota-gated AI round trip (and fails at 0 quota), unlike Rezi's instant
keyword-targeting comparison.

## Design (Builder-side only)

- guidance.ts: new pure `targetJobReply(report: MatchReport | null, hasJd: boolean): string`
  - no JD → point at the Target job panel to paste one (mirrors Rezi's "add a job
    title and description directly within the keyword targeting tool").
  - report → `You match N% of the target job's keywords (X of Y).` +
    `High priority to work in: …` (cap 5) + `Also missing: …` (cap 5, only
    non-high-priority) + pointer to the Target job panel's keyword triage which
    suggests a bullet per missing keyword; fully covered → congratulation line.
- AssistantPanel.tsx: "Target my job" quick task composes the local reply
  synchronously (same shape as `improveScore`), reusing the `report` already
  computed in the component. Free-text questions still go to the AI.

## Compatibility

Zero worker/prompt/api/schema/scoring/export/persistence changes; the other two
AI quick tasks and free-form chat are untouched.

## QA (production, mocked AI where needed)

1. JD pasted: click "Target my job" → instant reply, byte-identical to oracle,
   no /api/ai request (CDP network assert), no quota change.
2. High-priority + remaining split matches the Target job panel numbers.
3. No JD: instant guidance reply, no request.
4. Fully covered JD: congratulation form.
5. "Draft my summary" still POSTs to /api/ai (regression).
6. 375px; chat persistence; localStorage/theme restore.
