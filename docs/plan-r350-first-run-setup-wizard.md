# R350 — First-run guided setup wizard for empty drafts

## Evidence (first-hand)

- R348 SOP-10 audit recorded the depth gap: Rezi onboards new users through a multi-step wizard (target position → experience → starting point) before dropping them in the editor; our first run is a passive dashed box ("Load an example… / import…") plus the Getting started checklist. A brand-new visitor lands on an empty form with no guided capture of the two fields that drive the product's tailoring features (`targetRole`, `experienceLevel` — used by score verdicts, section-order recommendations (R263), summary drafts, skill chips, /jobs seeding).
- Production check (R348/R349 QA): with an empty draft nothing prompts for the target role; users who skip the Target job panel get generic suggestions.

## Design

A dismissible two-step dialog shown once, only when the draft is truly empty:

- Open condition: `!contact.fullName && !summary && experience.length === 0`, no `?example=` deep link, and `honestcv.setupDone` unset. Any close path sets `honestcv.setupDone=1` (no nagging; the dashed box and checklist remain as before).
- Step 1 — "What job are you targeting?": target role text input + experience-level select (existing `EXPERIENCE_LEVELS`/labels). Continue writes both onto the draft via the existing `set()`; both optional (Skip).
- Step 2 — "How do you want to start?": three options — Import your resume (opens the existing import dialog), Start from an example (role select reusing `examples`, pre-narrowed to entries whose role matches the typed target role; applies via existing `applyExample`), or Start from scratch (just closes).

No new storage shape, no worker changes, no removal of existing entry points.

## Non-goals

Multi-page account-style onboarding, AI-generated first drafts, dashboard changes.

## Verification

tsc/eslint/build; production QA: wizard appears once on a clean profile, seeds targetRole/experienceLevel, each start path works, Esc counts as done, never reappears with content or after dismissal, 375px + dark, baseline restore, zero AI.
