# R108 — Score-grounded opening in the resume assistant

## First-hand evidence (2026-08-29)

Rezi's AI Resume Agent (`~/audit-r1/shots-r108/agent.png`,
`https://app.rezi.ai/dashboard/agent/chat/…`) opens the conversation
proactively, grounded in the live score:

> "Your current Rezi Score is 5/100, primarily because essential sections like
> your phone number, work experience, and skills are currently missing from
> the workspace. To start building out your professional experience and
> raising your score, what is your phone number and most recent job title?"

plus a SUGGESTIONS chip ("Provide my phone number and job title…").

## Gap

HonestCV's assistant (R40–R42/R77/R78) is grounded in the ATS report *once the
user asks*, but its empty state is a generic "How can I help with your
resume?" — it never volunteers the diagnosis. The panel already receives the
full `AtsResult` upstream (`atsScoreSummary(ats)` is computed in Builder), so
the proactive opening costs zero AI calls.

## Design

Pure client-side empty-state upgrade in `AssistantPanel`:

1. Pass the live `AtsResult` into the panel (new `ats` prop next to the
   existing `scoreSummary` string).
2. When the chat is empty, render a diagnosis card above the quick-task
   buttons: "Your ATS score is S/100" plus up to 3 failing structure checks
   (`label` only) — or an "all checks pass" line when none fail.
3. Quick tasks and everything else unchanged; the card is display-only and
   recomputes live as the user edits (same `ats` the score panel uses).

## Non-goals

- No AI call, no new endpoint/prompt/quota/storage key.
- No auto-sent first assistant message (would spend quota without consent).
- No change to chat history shape (`honestcv.assistantChat`).
