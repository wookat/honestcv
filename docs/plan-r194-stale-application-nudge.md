# R194 — Stale-application visibility: days-in-stage + follow-up nudge

## First-party evidence

Rezi public changelog:

- August 20, 2026 (Rezi Web App): "Improved Application Tracking — We have refined the
  application agent cards and tracker interface to provide clearer visibility into your
  active job applications and their current status."
- August 21, 2026 (Rezi Web App): "Streamlined Application Management — We have improved
  the auto-apply drafting process and application queue, making it easier for you to
  track and manage your job applications efficiently."

Rezi's tracker cards surface how active each application currently is. Our pipeline
records every status change (R190 history) but the UI barely uses recency:

- The list row shows "{Status} N days ago" **only inside a status tab** — on the
  default All tab a tracked job gives no hint of how long it has been sitting.
- Nothing anywhere flags an application that has gone quiet (applied/interviewing with
  no status change for a week+), which is exactly the "current status visibility" a
  tracker exists for.

## Design (local-first, zero AI, zero schema)

All derived from the existing entry timeline (`timelineOf(entry)` last step's `at`).

1. **Row status recency on every tab** — drop the `tab !== 'all'` restriction so a
   tracked row always shows "{Status} N days ago" in the meta line.
2. **Stale chip** — helper `staleDays(entry)`: for `applied`/`interviewing` entries
   whose last status change is ≥ 7 days old, return the day count (else null). Stale
   rows show an amber `No update · Nd` chip after the status recency text.
3. **Detail-pane nudge** — in the tracked card, stale entries render one amber line
   under the Application timeline: "No update in N days — consider following up."
   (plain text; the R190 Notes box right below is where the user records the follow-up).

Saved and rejected entries never nudge (nothing is pending). Fresh applied/interviewing
entries (< 7 days) are unchanged. Thresholds: 7 days, deterministic, no configuration.

## Non-goals

- No AI, no Worker, no schema/storage change, no scoring change.
- No reminder scheduling/notifications — visibility only.

## Acceptance

- All tab: tracked rows show "{Status} N days ago"; status tabs unchanged.
- An applied entry with last change ≥ 7 days ago shows the amber "No update · Nd" row
  chip and the detail-pane follow-up line; an interviewing entry behaves the same.
- Saved/rejected entries and fresh (< 7d) applied entries show no nudge anywhere.
- R188 chips, R190 timeline/notes, R191 guard, R192 toggle, R193 next-step unchanged.
- 1440 + 375px, dark-mode readability, no horizontal overflow.
- Zero AI quota consumed during QA.
