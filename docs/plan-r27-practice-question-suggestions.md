# R27 — Suggested practice questions (tailored, one AI call)

Date: 2026-08-29 · Round: R27 · Author: RezUp owner (Devin)

## Evidence (first-hand, 2026-08-29)

Rezi's AI Interview wizard (`~/audit-r1/shots-r27/`): step 1 selects a resume ("AI interview
questions will be based on your resume—your skills, experience, and education"), step 2 a job
title + description ("Your job title and description will guide the AI interview questions"),
then the AI interview asks *generated, tailored questions*. The user never has to invent
questions to practice.

RezUp after R26: "Practice an answer" requires the user to type their own question — the
biggest friction in the practice loop. Users who most need practice don't know what will
be asked.

## Decision

Add a **"Suggest questions"** action in the practice block: one AI call generates 5
interview questions tailored to the resume + target JD; rendered as buttons that fill the
question input. Keeps R26's single-question coaching flow; no multi-step wizard or video.

## Spec

Worker:
- `POST /api/ai/interview-questions` `{ resumeText, jobDescription, role }` →
  `{ questions: string[], freeRemaining }` (max 5, each ≤ 200 chars).
- Same gating as `interview-brief`/`interview-feedback` (bundle unlimited; free mode shares
  free quota; consumed only after successful parse — mirror `/api/ai/tailor`'s JSON handling:
  strip code fences, parse array of strings, 502 without consuming quota if unparseable).
- Prompt: interviewer for the role; 5 questions grounded in the JD and this resume (mix of
  behavioral + role-specific), plain JSON array of strings.

Frontend:
- `aiInterviewQuestions()` in `src/lib/api.ts`.
- Practice block: "Suggest questions" outline button next to "Get AI feedback"; requires a JD
  (same inline error style); result renders as a list of question buttons — clicking one sets
  the question input (and clears prior feedback/error); busy/error states; quota via `onQuota`.

## Acceptance

- One click → 5 tailored questions; clicking a chip fills the input; feedback flow (R26)
  works on it end-to-end.
- No JD → inline error, no AI call. 402 → friendly inline error.
- Regression: R26 practice + brief flows unchanged.
- 375px: chips wrap, ≥40px touch, no overflow. Local lint/tsc/build green; deploy + prod QA.
