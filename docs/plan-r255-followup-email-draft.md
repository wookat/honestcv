# R255 — Follow-up email draft for quiet applications

## First-party evidence (Rezi public surface)

- rezi.ai/tools/job-search: "Rezi's job tracking tools let you organize your applications by stage—saved, applied, interviewing, or rejected—so you can focus on what's next and always **follow up at the right time**."
- rezi.ai/rezi-changelog (Aug 21): "Streamlined Application Management — We have improved the auto-apply **drafting process** and application queue, making it easier for you to track and manage your job applications efficiently."

## Gap

R194/R253/R254 built the full "when to follow up" pipeline: stale detection (`staleDays`), the nav
attention badge, and the Needs follow-up queue filter. But the terminal message is still
"No update in N days — consider following up." with no action — the user must leave the app
and compose the email from scratch. Rezi's positioning is that tracking exists so you can
*follow up at the right time*; we surface the right time but not the follow-up itself.

## Design

`src/lib/jobs.ts` — new pure helper (deterministic, zero AI):

```ts
followUpEmail(entry: PipelineEntry, senderName?: string): { subject: string; body: string }
```

- Only meaningful for stale entries; uses `staleDays(entry)` for the day count.
- `applied` → subject `Following up on my <title> application at <company>`, body opener
  "I applied for the <title> position N days ago and wanted to follow up…".
- `interviewing` → subject `…my <title> interview at <company>`, opener "It has been N days
  since we last spoke about the <title> position…".
- Greeting `Hi <company> hiring team,`; polite interest + offer of further info; sign-off with
  `senderName` (resume `fullName`) or `[Your name]` placeholder.

`src/pages/Jobs.tsx` — in the tracked detail pane, under the existing stale message, add a
"Draft follow-up email" button (only when `staleDays(entry) !== null`). It opens a dialog with:

- editable Subject input and editable body textarea, both seeded from `followUpEmail(entry, loadResume()?.fullName)`;
- "Copy email" button → `navigator.clipboard.writeText("Subject: …\n\n…")`, flips to "Copied" briefly;
- session-only state; closing discards the draft.

## Non-goals

- No AI calls, no new persistence/localStorage keys, no worker/schema changes.
- No email sending / mailto integration; copy-to-clipboard only.
- No change to staleDays/attentionCount semantics or the R254 filter.

## Validation

- Fixture pipeline with 7d applied + 8d interviewing entries: subject/body byte-exact vs oracle
  for both statuses, day counts correct, resume name in sign-off (and `[Your name]` fallback
  with empty resume).
- Button absent on fresh/saved/offer/rejected entries.
- Copy button puts the exact subject+body text on the clipboard; edits in the dialog are copied.
- Regressions: R254 filter/deep link, R253 badges, notes/timeline/bulk actions unchanged.
- 375px dialog usable, no horizontal overflow; light/dark contrast of the new controls.
- Zero AI completions; QA localStorage baseline restored.
