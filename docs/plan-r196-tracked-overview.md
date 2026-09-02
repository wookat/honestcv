# R196 — "Tracked" overview tab: the whole application queue in one list

## First-party evidence

Rezi public changelog:

- August 21, 2026 (Rezi Web App): "Streamlined Application Management — We have improved
  the auto-apply drafting process and application queue, making it easier for you to
  track and manage your job applications efficiently."
- August 20, 2026 (Auto Apply): "Improved Application Tracking — We have refined the
  application agent cards and tracker interface to provide clearer visibility into your
  active job applications and their current status."

Rezi frames tracked applications as one *queue* the user manages in a single place.

## Current gap

Our /jobs pipeline can only be viewed one status at a time: the Saved / Applied /
Interviewing / Rejected tabs each show a single slice. There is no way to see the whole
queue at once — a user with 3 applied, 2 interviewing, and 4 saved jobs has to click
four tabs to review their pipeline. Every tracker product (and Rezi's queue language)
treats "all my applications" as the primary view.

## Design (local-first, zero AI/schema)

Add a **Tracked (n)** tab between "All jobs" and the per-status tabs:

- Shows every pipeline entry, grouped by status in pipeline order
  (saved → applied → interviewing → rejected), each group under a muted in-list
  header `{Status label} ({count})` — same visual as the R195 divider row.
- Within a group, entries sort by `updatedAt` desc (most recently touched first).
- Empty groups render no header; empty pipeline shows the existing empty-state message
  ("Nothing tracked yet …" wording).
- Rows reuse the existing row renderer unchanged (R194 recency + stale pill, R188
  chips, R192 toggle, R190 notes icon all apply automatically).
- The search form and "Hide" filters stay All-tab-only; the tab count is the pipeline
  size and live-updates like the per-status counts.

## Non-goals

No kanban/drag-drop, no Worker/API change, no schema change, no AI.

## Acceptance

- Tracked tab shows all entries grouped saved → applied → interviewing → rejected with
  correct group headers/counts; groups with zero entries show no header.
- Within-group order is most recently updated first.
- Selecting a row opens the detail pane (R193 next step + R190 timeline work).
- Status change from the row select moves the job between groups immediately.
- Untracking from the Tracked tab goes through the R191 guard.
- Empty pipeline shows a helpful empty state.
- 1440 + 375px, dark mode, no horizontal overflow; zero AI quota during QA.
- R188–R195 regressions pass.
