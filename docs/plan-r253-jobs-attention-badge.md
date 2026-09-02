# R253 — Attention badge on the Job search navigation

## First-party evidence (Rezi)

- Changelog Aug 14 (Mobile App): "Clearer Job Notifications - We've updated the
  notification badge colors on your job matching tab, making it easier to spot
  new opportunities at a glance." — Rezi surfaces job-related notifications as
  a badge on the *navigation tab itself*, not only inside the job screen.
- Changelog Aug 21 (Web App): "Streamlined Application Management - We have
  improved the auto-apply drafting process and application queue, making it
  easier for you to track and manage your job applications efficiently."

## Gap in HonestCV

R194 added the stale-application nudge ("No update · Nd" chip and "No update in
N days — consider following up.") — but both live *inside* /jobs. A user who
hasn't opened the job board has no signal that tracked applications have gone
quiet. The workspace sidebar and the site header link to Jobs with only a
neutral total count.

## Design

Pure client-side derivation from the existing pipeline; zero schema / worker /
scoring / AI changes.

1. Move `staleDays(entry)` (unchanged semantics: applied/interviewing, last
   timeline step ≥7 days ago) from `src/pages/Jobs.tsx` into `src/lib/jobs.ts`
   and export it; Jobs.tsx imports it (rendered chips byte-identical).
2. New helper in `src/lib/jobs.ts`:
   `attentionCount(pipeline = listPipeline())` → number of entries with
   `staleDays(e) !== null`.
3. `WorkspaceNav` "Job search" row: when `attentionCount() > 0`, render an
   amber pill badge with the count (`bg-amber-100 text-amber-800`, base tokens
   only — inverted dark palette keeps contrast, per R251 finding) before the
   existing muted total, with
   `aria-label`/`title` "N tracked applications with no status update in 7+ days".
4. `Layout` header "Jobs" link (desktop nav + mobile hamburger): same amber
   count badge when > 0.

## Non-goals

- No new localStorage keys, no polling/live refresh beyond mount-time
  derivation (same as the existing sidebar counts).
- No change to the 7-day threshold or timeline semantics.
- No notification system / toasts.

## Validation

- Oracle: seed `honestcv.jobPipeline` with entries whose last timeline step is
  6/7/8 days old across statuses; badge count must equal the tsx-oracle count
  (saved/offer/rejected never counted; 6d not counted; 7d counted).
- Badge absent with an empty pipeline and with only fresh entries.
- /jobs stale chips byte-identical after the staleDays move.
- 375px hamburger menu badge, dark/light contrast, no overflow.
- Zero /api/ai/* calls.
