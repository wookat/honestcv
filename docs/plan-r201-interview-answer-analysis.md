# R201 — Instant local answer analysis in interview practice (Rezi AI Interview counterpart)

## Evidence (public, first-party)

Rezi tools page https://www.rezi.ai/tools/ai-interview-practice (fetched 2026-09-01):

> **Data-driven AI interview feedback** — Receive detailed analytics and a performance score
> based on your response. Rezi highlights missing keywords from the job description and
> suggests improvements to optimize your AI interview performance.
>
> **Behavioral interview mastery** — Practice and perfect your answers using the STAR method
> with our AI mock interviewer. Receive specific feedback to improve your behavioral question
> responses.

## Gap

RezUp's interview practice (Builder → Interview Prep Brief → "Practice an answer") already has
AI question suggestion, session mode and AI coaching (aiInterviewFeedback). But between typing
an answer and spending an AI call, the user gets nothing: no performance score, no STAR
structure signal, no JD-keyword coverage on the answer. Rezi's public pitch is precisely
"detailed analytics and a performance score based on your response" plus STAR guidance.

## Design (zero AI, zero schema)

New `src/lib/interviewAnalysis.ts` — deterministic `analyzeAnswer(answer, jobDescription, ignored)`:

- **Length**: word count, banded — <40 words "too short (aim for 60–200 words, ~30–90s spoken)",
  40–250 ideal, >250 "trim — interviewers lose the thread past ~2 minutes".
- **STAR coverage**: four boolean signals detected from the text:
  - Situation/Task: context openers (`when|while|at (the time)?|last (year|quarter)|my (team|role)|we (were|had)|the (project|problem|challenge)`),
  - Action: first-person past-tense action verbs (reuse ACTION_VERBS-style list: led, built, designed, migrated, negotiated, …) with `I` subject,
  - Result: outcome markers (numbers/%, `result(ed)?|increased|reduced|cut|saved|improved|grew|delivered|shipped|launched`),
  - each shown as a check chip S · T/A · R with a one-line hint when missing.
- **JD keyword coverage**: `extractKeywords(jobDescription)` (existing ats lib, minus ignoredKeywords);
  chips for covered vs top missing keywords in the answer (mirror of the R180 report styling).
- **Delivery flags**: filler/hedge phrases counted (`kind of, sort of, I think, maybe, basically,
  stuff, things, you know, honestly`), plus "we-heavy" flag when `we` count > `I` count
  (interviewers want your part).
- **Score 0–100**: 25 length band + 30 STAR (10 context / 10 action / 10 result) + 30 keyword
  coverage ratio + 15 delivery (fillers ≤1 and not we-heavy). Labeled "Practice score — instant,
  local" to keep it distinct from AI coaching and from the resume ATS score.

UI: analysis card renders under the answer textarea automatically once the answer has ≥10 words
(recomputed on change — pure function, no debounce needed at this size), above the AI feedback
area. Works with or without a JD: without one the keyword row is hidden and the score renormalizes
(length+STAR+delivery over 70 → scaled to 100). Session entries keep storing only question/answer/
AI feedback (no schema change).

## Not in scope

- No new AI endpoints or prompt changes; AI coaching button unchanged.
- No resume schema, scoring, export, ATS changes.
- No changes to cover/resignation flows.

## Acceptance

- Typing a short vague answer shows low score, missing STAR chips, missing keywords.
- Pasting a strong STAR answer with JD terms scores high; chips flip; zero network calls.
- With empty Target job JD, panel still works minus keyword row.
- 1440 + 375px, dark mode, no overflow; R200 sidebar template + prior regressions green.
- lint/tsc/build green; deployed and production-verified.
