# R604 — Job card says "Reconnect targeted copy" when the job's copy is orphaned, not "Create a resume"

## Evidence (production index-C6BOe8aU.js, qa/r604-evidence.cjs)

Tracked job `qa-j1` whose `resumeVersionId` points at a deleted copy while an orphan copy
targeted at the job (`copyTargetsJob` match) still exists:

```
tracked panel: ["Next step:","Create a resume targeted at this job.","Target my resume", ...]
primary button: Target my resume
dialog: [..., "You already saved a copy of your resume targeted at this job — the editor opens that copy and links it to this job again.", "Cancel", "Reconnect targeted copy"]
```

Control (no copy at all) renders the identical card. Only after clicking does the dialog
(R589/R590) tell the truth: nothing is created, the existing copy is reconnected. So the card
claims a copy will be created and hides that one already exists — the same class of gap R603
closed for documents (`forJob`), here for the targeted resume copy.

## Root cause

`nextStep()` and the primary action button in `Jobs.tsx` branch only on `linkedVersion(job.id)`;
`orphanTargetedCopy(job)` is consulted by the dialog and by `prepareTargetedCopy`, but not by
the card copy.

## Fix

```ts
// nextStep(entry)
if (!linkedVersion(job.id)) {
  const orphan = orphanTargetedCopy(job)
  if (orphan) return {
    text: `Reconnect the copy you already targeted at this job — “${orphan.name}”.`,
    label: 'Reconnect targeted copy',
    onClick: () => setConfirmTarget({ job, intent: 'target' }),
  }
  return { text: 'Create a resume targeted at this job.', label: 'Target my resume', ... }
}
// primary button
linkedVersion(id) ? 'Open targeted resume' : orphanTargetedCopy(job) ? 'Reconnect targeted copy' : 'Target my resume'
```

Behaviour on click is unchanged (dialog → explicit reconnect); only the card stops
misdescribing it. No storage changes.

## Acceptance

- orphan mode: card says "Reconnect the copy you already targeted at this job — “<name>”." with
  button "Reconnect targeted copy"; dialog unchanged.
- none mode: unchanged ("Create a resume targeted at this job." / "Target my resume").
- linked mode: unchanged.
- 1280 + 375, no page overflow, storage restored, 0 console errors, no AI calls.
