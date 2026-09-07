# R595 — Jobs actions replace an unsaved standalone draft without saying so

## Evidence (production, 2026-09-06, bundle `index-DW8pJ9nt.js`, real job 2091088, `qa/r595-evidence.cjs`)

Seed: job A tracked with a linked targeted copy `qa-linked`; the editor draft is a **standalone**
resume with content (`activeVersionId = null`, summary `STANDALONE DRAFT — never saved as a copy`).

| Entry on /jobs | Dialog text | Result |
|---|---|---|
| Open targeted resume | "This job already has a targeted copy of your resume — the editor opens that copy. Your other resumes keep their own target jobs." | draft → `Tailored copy for this job`; standalone draft gone, no copy of it anywhere |
| Cover letter | "This opens the resume copy targeted at this job in the editor, then opens the cover letter tool…" | same loss |
| Open interview prep (status Applied) | **no dialog** | same loss, silently |

The builder's edit history (`honestcv.resumeHistory`) only checkpoints every 10 min of builder
edits, so it is not a recovery path for recent work.

`/dashboard` already handles the identical situation for "Open" on a copy: when the draft is not
synced to any copy it shows *Open "X"? — This replaces what's currently in the editor…* with
**Save draft as copy, then open** / **Open and replace draft**. The jobs board does not.

## Scope

Loss happens only when all three hold:

1. `getActiveVersionId() === null` (draft is not synced to any copy);
2. `resumeHasContent(draft)`;
3. the action opens an **existing** copy (`linkedVersion(job) ?? orphanTargetedCopy(job)`).

When no copy exists the draft is cloned into the new copy (nothing is lost); when the draft is
empty the aim-draft path runs (nothing to lose); when the draft is synced to a copy it already
lives in that copy.

## Fix (`src/pages/Jobs.tsx`)

- `draftAtRisk(job)` = the three conditions above.
- `confirmTarget.intent` gains `'interview'`; the tracked-job next step **Open interview prep**
  routes through the dialog only when `draftAtRisk(job)` (otherwise unchanged direct open).
- Dialog, when at risk: description gains *"Your current draft isn't saved as a copy, so opening
  that copy replaces it."* and an extra outline button **Save draft as copy, then open**
  (`saveResumeVersion(targetRole || fullName || 'Untitled copy', draft)` — same naming as the
  dashboard — then the normal action). Storage failure surfaces via the existing storage error.
- `targetResume(job, 'interview')` → `openInterviewPrep(job)`.

## Acceptance (production, 1280 + 375)

- target / cover / interview with standalone draft: dialog carries the warning; **Save draft as
  copy, then open** leaves a new copy `Product Designer` with the standalone summary and then
  opens the targeted copy; **Open targeted copy** still replaces (explicitly).
- Interview prep with a synced draft (`activeVersionId` set): no dialog, behaviour unchanged.
- No page overflow at 375; storage restored; zero console errors; zero AI.
