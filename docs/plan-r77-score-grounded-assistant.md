# R77 — Score-grounded resume assistant

## Evidence (first-party, 2026-08-29)

- `~/audit-r1/shots-r77/rezi-agent-home.png` — Rezi AI Resume Agent home
  (`app.rezi.ai/dashboard/agent/new`) with quick tasks IMPROVE MY REZI SCORE /
  TARGET MY RESUME / FIND JOBS.
- `~/audit-r1/shots-r77/rezi-agent-score-aware-reply.png` — after attaching a
  minimal resume and running IMPROVE MY REZI SCORE, the agent's first reply is
  grounded in the computed score: "Your current Rezi Score is 5/100, primarily
  because essential sections like your phone number, work experience, and
  skills are currently missing" — it cites the exact number and the concrete
  failing checks.

## Gap

HonestCV's assistant (`/api/ai/assistant`, `AssistantPanel`) receives only the
raw resume text, JD and target role. The editor already computes a full ATS
report client-side (`scoreResume`: total score, structure checks with
pass/fail + hints, keyword coverage, missing/excluded keywords) — but none of
it reaches the assistant. The "Improve my ATS score" quick task therefore gets
generic advice: the model re-guesses what might be wrong instead of citing the
actual score and the actual failing checks, and its notion of "score" can
contradict the number the user sees in the preview.

## Design

Smallest change that closes the gap — pass the existing client-side report
through as context; no new scoring, storage, or UI:

1. `src/lib/ats.ts`: `atsScoreSummary(ats)` — deterministic plain-text report
   (total score, structure sub-score + failing checks with hints, keyword
   coverage + missing/excluded keywords, bounded length).
2. `src/lib/api.ts` / `AssistantPanel`: send `scoreSummary` with every
   assistant call (recomputed from the live draft at send time).
3. `worker/index.ts` + `worker/prompts.ts`: accept optional `scoreSummary`
   (bounded), include it in the assistant context, and instruct the model to
   ground score questions in this report — cite the real number and the real
   failing checks, never invent its own score.

Non-goals: server-side scoring (report stays client-computed, same source of
truth as the preview ring), new quick tasks, agent-style resume preview pane,
job-search chat tabs (separate candidates).

## Validation

`npm run lint`, `npx tsc -b`, `npm run build`, `git diff --check`; deploy;
production QA: "Improve my ATS score" quick task must cite the exact score
shown in the preview and name real failing checks; regression on apply
actions, quota, and mobile 375px.
