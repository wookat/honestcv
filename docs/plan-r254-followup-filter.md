# R254 — "Needs follow-up" filter on the Tracked tab + ?attention=1 deep link

## First-party evidence (Rezi changelog, retrieved 2026-09-02)

- Aug 21, Rezi Web App: "Streamlined Application Management — We have improved the auto-apply drafting process and application queue, making it easier for you to track and manage your job applications efficiently."
- Aug 14, Mobile App: "Clearer Job Notifications — We've updated the notification badge colors on your job matching tab, making it easier to spot new opportunities at a glance." (basis for R253's nav badge)

## Current HonestCV state

- R253 surfaces `attentionCount()` (applied/interviewing entries with `staleDays(e) !== null`, i.e. no status change in ≥7 days) as an amber badge in the workspace sidebar, desktop header, and mobile hamburger.
- Clicking those Jobs links lands on `/jobs` default view (All tab). The stale entries are only discoverable by scanning Tracked rows for "No update · Xd" chips — the badge tells you *how many* but not *which*.

## Gap

The attention state has no queue view: no way to filter the application queue down to exactly the entries that need a follow-up.

## Design

1. `src/pages/Jobs.tsx`: new session state `followUpOnly: boolean` (default from `?attention=1` in the URL, mirroring the existing `?q=` seed pattern; when seeded, `tab` initializes to `'tracked'`).
2. Tracked tab toolbar (next to the existing Select… toggle): a toggle chip `Needs follow-up (N)` where `N = attentionCount(pipeline)` — rendered only when `N > 0` or `followUpOnly` is on. Amber styling matching the R253 badge (`bg-amber-100 text-amber-800` when active), `aria-pressed`.
3. When on, `trackedQueue` is filtered to entries with `staleDays(e) !== null` (grouping/order semantics otherwise unchanged). Off = today's behavior, byte-identical.
4. Empty-filter state: if the toggle is on and nothing matches (e.g. statuses updated), show the standard empty message and keep the toggle so it can be switched off.
5. The filter is Tracked-tab-only; All and per-status tabs unchanged. Switching tabs does not clear it (it simply doesn't apply elsewhere), matching how skills/type filters persist.

## Non-goals

- No changes to staleDays/attentionCount semantics or the 7-day threshold.
- No new persistence, notifications, polling, worker/schema/scoring/AI changes.
- Nav badges stay non-interactive (they sit inside the existing Jobs links; nested anchors are invalid HTML) — the deep link is available for future affordances and direct navigation.

## Validation

- Seed a pipeline with stale (7d/8d applied/interviewing) and fresh/ineligible entries; `/jobs?attention=1` opens Tracked with the toggle on showing only the stale entries; count matches the tsx oracle (`attentionCount`).
- Toggle off restores the full queue (grouped order identical to pre-R254).
- Toggle hidden when `attentionCount() === 0` and not seeded.
- Empty-match state renders with the toggle still visible.
- Bulk select, status dropdowns, notes, detail pane work on the filtered list.
- 375px no overflow; light+dark contrast of the active chip; zero /api/ai/* calls; cleanup baseline restored.
