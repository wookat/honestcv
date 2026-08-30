# R78 — Persistent quick-task suggestions in the resume assistant

## First-party evidence (Rezi, 2026-08, ~/audit-r1/shots-r78/)

- `rezi-agent-newchat-task-chips.png`: the Rezi AI Agent home shows task chips
  (IMPROVE MY REZI SCORE / TARGET MY RESUME / FIND JOBS) above the composer.
- `rezi-agent-midchat-suggestions.png`: **mid-conversation**, Rezi keeps a
  "SUGGESTIONS" row pinned directly above the reply input with contextual
  next-step chips ("Provide my phone number and job title… ADD DETAILS").
  Guided next actions never disappear once the chat has started.
- Also audited this round (deliberately not copied):
  - `rezi-review-paid.png`: Review My Resume is a paid human review
    ($0.15–0.23/word) — business-model difference.
  - `rezi-interview-video-setup.png`: AI Interview is a live 20-minute
    WebRTC video interview (camera/mic setup). Cloning realtime video
    interviewing is a large product, and our Interview Prep already covers
    question practice with AI feedback. Out of scope for a small cycle.

## Gap in HonestCV

`src/components/AssistantPanel.tsx` renders the four QUICK_TASKS buttons only
when `turns.length === 0`. After the first send the chips are gone for good
(the chat persists in `honestcv.assistantChat`), so the guided tasks are a
one-shot affordance — our own R77 QA had to type the quick-task prompt text by
hand to re-run a task. Rezi keeps suggestions available throughout the chat.

## Design

Frontend-only change in `AssistantPanel.tsx`:

- Keep the existing empty-state block unchanged.
- When `turns.length > 0`, render a compact horizontally-wrapping
  "Suggestions" chip row pinned above the composer (outside the scroll area),
  one pill per QUICK_TASKS entry, clicking sends the same prompt through the
  existing `send()` path.
- Chips are disabled while `busy` (same as the composer), 40px touch targets
  on mobile via the established `min-h-10 sm:min-h-*` pattern.

## Non-goals

- No multiple chat threads / recent-chats list (our single persistent chat +
  Clear chat covers reset; thread management is a separate decision).
- No AI-generated contextual suggestions (would cost an extra AI call per
  turn; the deterministic task chips are the honest equivalent).
- No API/Worker/storage changes; zero new AI requests.

## Validation

- npm run lint / npx tsc -b / npm run build / git diff --check.
- Production QA: chips visible mid-chat, click sends the exact prompt and
  consumes exactly 1 request/quota, disabled while busy, empty state
  unchanged, 375px no overflow + 40px targets, console clean, localStorage
  restored byte-identical.
