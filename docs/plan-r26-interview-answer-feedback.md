# R26 — Interview answer practice with AI feedback

Date: 2026-08-29 · Round: R26 · Author: RezUp owner (Devin)

## Evidence (first-hand, 2026-08-29)

Rezi app sidebar features an **AI INTERVIEW** section (`app.rezi.ai/dashboard/video-interviews`,
captured in `~/audit-r1/shots-r26/r26-interview.png`): "NEW AI INTERVIEW · Recent Interviews ·
Start a first interview to see results appear here." Rezi's version is a video interview
simulator (webcam recording + AI evaluation). Rezi also ships an **AI RESUME AGENT** chat
(`/dashboard/agent/new`, `r26-agent.png`).

RezUp today: Interview Prep Brief only — one-shot generated document (likely questions,
STAR stories, gaps). There is no way to *practice*: the user cannot try an answer and get
coaching. That is the core value of Rezi's interview feature.

## Decision

Honest degradation of Rezi's video interview: **text-based answer practice** inside the
existing Interview Prep dialog. No webcam/media pipeline (heavy, new architecture); typing
an answer and getting structured coaching preserves the substance.

Rezi AI Resume Agent (free-form chat) is out of scope — a chat surface is a larger
architecture decision (conversation state, streaming), logged for a future round.

## Spec

Worker (`worker/index.ts` + `worker/prompts.ts`):
- `POST /api/ai/interview-feedback` `{ question, answer, resumeText?, jobDescription?, role? }`
  → `{ text, freeRemaining }`.
- Same entitlement/quota gating as `/api/ai/interview-brief` (bundle unlimited; free mode
  shares the free AI quota; quota consumed only on success).
- Prompt: interview coach; assess the answer against the question (and JD/resume when
  provided); output plain-text sections: WHAT WORKED / WHAT TO IMPROVE / STRONGER ANSWER
  (a suggested improved answer grounded only in the candidate's real resume — bracketed
  placeholders for unknowns, never fabricated experience).
- Input caps: question ≤ 300 chars, answer ≤ 3000, resume/JD slices as elsewhere.

Frontend:
- `src/lib/api.ts`: `aiInterviewFeedback(...)` helper.
- `src/pages/Builder.tsx` `BundleToolDialog` (kind === 'interview'): below the brief area,
  a "Practice an answer" block — Question input + Your answer textarea + "Get AI feedback"
  button; feedback rendered read-only; errors inline; busy state; quota surfaced via
  existing `onQuota`.
- No new routes, storage keys, or nav changes.

## Acceptance

- Free user: feedback works while quota lasts; 402 shows friendly inline error.
- Feedback references the actual answer; STRONGER ANSWER uses placeholders, not invented facts.
- Existing brief generation/save/download unchanged (regression).
- 375px: dialog scrolls, controls ≥40px touch, no horizontal overflow.
- Local lint/typecheck/build green; deploy; production QA at desktop + 375px.
