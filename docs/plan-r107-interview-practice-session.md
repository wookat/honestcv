# R107 — Guided interview practice session (text-based)

## First-hand evidence (2026-08-29)

- Rezi's sidebar promotes **AI INTERVIEW** as a first-class surface
  (`~/audit-r1/shots-r107/interview-page.png`): a Recent Interviews table with
  per-interview lifecycle (Name / Resume / Started / Finished, "In progress"
  status) and a NEW AI INTERVIEW entry.
- Opening an interview leads to a **20-minute live video/mic session**
  (`~/audit-r1/shots-r107/interview-session.png`: mic/speaker/camera pickers,
  "The interview will last 20 min.", JOIN INTERVIEW). The interview is a
  *sequential session* against your resume + target job, not a one-off Q&A.

## Gap

HonestCV's Interview Prep (R26/R27) has the ingredients — AI-suggested
questions tailored to the resume + JD, and per-answer AI coaching — but only as
a one-question-at-a-time manual loop. There is no *session*: nothing walks the
user through the full question list, nothing accumulates a transcript, and the
practice work is lost unless the user copies text out by hand.

## Design

Text-based guided session inside the existing Interview Prep dialog (video
interviewing is deliberately out of scope — WebRTC/STT is a multi-round build).

1. After "Suggest questions" returns questions, show **Practice all N** next to
   the list. Clicking enters session mode.
2. Session mode shows "Question i of N", the current question, the existing
   answer textarea and "Get AI feedback" (same `aiInterviewFeedback` call, same
   1-credit cost per feedback). Buttons: **Next question** (records the Q/A and
   any feedback into the transcript, advances), **Skip**, **Finish session**.
3. Finishing assembles a plain-text transcript (`Q1… / Your answer… / AI
   coaching…` per entry) into the existing result textarea, so the existing
   PDF / DOCX / "Save to My resumes" (interview career doc) buttons work
   unchanged.
4. Leaving the dialog resets session state (same reset block all bundle-tool
   state already uses).

## Non-goals

- No video/audio (mic/camera), no timers.
- No new Worker endpoint, prompt, quota or storage key — session state is
  React state; persistence is the existing career-docs store.
- No change to one-off practice: typing your own question still works exactly
  as before.
