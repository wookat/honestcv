# R42 — Workspace entry + quick-task parity for the resume assistant

Date: 2026-08-30 · Round: R42 · Status: planned

## Gap (first-hand evidence, `~/audit-r1/shots-r42/`)

Logged-in re-audit of app.rezi.ai (2026-08-30):

- Rezi's AI Resume Agent is a *first-class workspace destination*: a sidebar
  entry at `/dashboard/agent` with its own recent-chats list. Our assistant is
  reachable only via an icon button inside `/builder` — invisible from the
  dashboard and jobs board where users actually start sessions.
- Its empty-state quick tasks are `IMPROVE MY REZI SCORE`, `TARGET MY RESUME`,
  `FIND JOBS`. Ours cover score/summary/skills but nothing maps to job
  targeting or the jobs board.
- Its free tier caps agent conversations and upsells Pro ($29/mo); deeper
  probing of post-reply suggestion chips is behind that paywall — honestly
  out of evidence this round.

## Scope

1. **Deep link**: `/builder?assistant=1` opens the builder with the assistant
   panel already open (same `useState` initializer + `history.replaceState`
   URL-cleanup pattern as the existing `?doc=`/`?company=` deep links).
   Opening the panel still makes zero AI calls.
2. **Workspace entry**: WorkspaceNav (on `/dashboard` and `/jobs`) gains an
   "AI assistant" item linking to `/builder?assistant=1`, next to the existing
   tool destinations.
3. **Quick-task parity**: empty-state quick tasks gain
   "Tailor my resume to my target job" (prompt asks how to tailor toward the
   stored JD; the assistant already knows the JD context and points at the
   in-editor "Tailor to job" tool). Keep the list at 4 — do not add a
   FIND JOBS chat task; `/jobs` is one click away in the nav and a chat
   round-trip for navigation would waste a paid AI call.

Not doing (unchanged decisions): a standalone full-screen agent route,
recent-chats list (single local conversation stands), server persistence,
agent-driven navigation.

## QA (production, 1440 + 375)

1. `/builder?assistant=1` lands with the panel open, URL cleaned, zero AI
   calls and unchanged quota.
2. WorkspaceNav "AI assistant" visible on /dashboard and /jobs, navigates to
   the open panel.
3. New quick task sends only on click and yields a JD-grounded reply.
4. Regression: R40/R41 chat + Apply flows, 375px layout, console clean,
   localStorage restored.
