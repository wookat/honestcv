# R240: "Find jobs" built-in assistant prompt bridging to the job board

## Rezi evidence (first-party)

Rezi User Guide "AI Resume Agent" (rezi.ai/rezi-docs/ai-resume-agent):

> Once you've uploaded your resume, you can choose from three main options:
> If you choose **Improve My Rezi Score** … If you select **Target My Resume** …
> **If you choose Find Jobs, the AI uses your resume, experience, skills, and
> location to surface relevant opportunities through Rezi's AI Job Search tool.**

and among the agent's core abilities:

> Recommend job opportunities that align with your skills and career goals

## Current HonestCV behavior

- The Resume assistant (`src/components/AssistantPanel.tsx`) has four quick
  tasks: Improve my ATS score, Draft my summary, Suggest skills, Target my job.
  There is no job-finding entry point — the third of Rezi's three built-in
  prompts has no equivalent, and the assistant never bridges to the existing
  `/jobs` board.
- `/jobs` (`src/pages/Jobs.tsx`) seeds its search box from the draft's target
  role but supports no deep link: there is no way to arrive with a prepared
  query.

## Design

1. `/jobs?q=<query>` deep link: when a `q` search param is present, it seeds
   the initial query state and the mount-time search instead of the draft's
   target role. No other Jobs behavior changes.
2. New quick task **Find matching jobs** in the assistant (both the empty-state
   list and the chip row). Unlike the other four it is deterministic and local
   (zero AI calls, zero quota): it appends a user turn plus a locally composed
   assistant turn that
   - names the search it recommends (target role, falling back to the most
     recent visible experience role; generic board otherwise),
   - mentions the resume signals used (top skills, contact location) the way
     Rezi's Find Jobs describes ("uses your resume, experience, skills, and
     location"),
   - carries a persisted `jobsQuery` field rendered as a **Search jobs →**
     button linking to `/jobs?q=<query>`.
3. Chat persistence (`loadChat`) keeps the optional `jobsQuery` string across
   reloads; schema, scoring, AI worker, and all other assistant flows are
   untouched.

## Validation

- Quick task with role → assistant card names the role query; button lands on
  /jobs with the query prefilled and searched.
- No target role → falls back to newest visible experience role; empty resume →
  generic message + unseeded board link.
- Zero network calls to `/api/ai/*` for the whole flow; existing quota flow for
  the other four quick tasks unchanged.
- Reload keeps the card and its button (persistence).
- 375px + dark mode on the new card; regression: R230 locate, R227/228 apply
  cards, Jobs board default seeding unchanged when no `?q=`.
