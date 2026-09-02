# R192: row track toggle reflects current status (no silent demotion)

## Evidence (first-party, public)

- Rezi changelog 2026-08-20 — "Improved Application Tracking — We have refined the
  application agent cards and tracker interface to provide clearer visibility into your
  active job applications and their current status."
- Our own R191 production QA surfaced the concrete defect: for a job tracked as
  Applied/Interviewing, the row button still reads "Save"; clicking it silently demotes
  the status back to `saved` and appends steps to the R190 timeline (observed history
  `saved → applied → saved → applied` from one stray click). Now that the timeline is
  user-visible, this pollutes real application history.
- Protected Rezi app remains inaccessible (OTP 403); claims limited to public surface.

## Current behavior (`src/pages/Jobs.tsx` row button)

```tsx
aria-pressed={status === 'saved'}
onClick={() => setStatus(j, status === 'saved' ? 'none' : 'saved')}
...
{status === 'saved' ? 'Saved' : 'Save'}
```

- status none → "Save" → saves (good)
- status saved → "Saved" (pressed) → untracks via R191 guard (good)
- status applied/interviewing/offer/rejected → button reads "Save" (unpressed),
  click demotes to `saved` and writes a timeline step (bad)

## Design (minimal, Jobs.tsx only; zero AI/Worker/schema)

The row button becomes a pure track/untrack toggle for every tracked status:

```tsx
aria-pressed={status !== null}
onClick={() => setStatus(j, status ? 'none' : 'saved')}
...
{status ? (status === 'saved' ? 'Saved' : 'Tracked') : 'Save'}
```

- Untracked → "Save", saves as before.
- Saved → "Saved" (pressed ring), untrack via R191 guard — unchanged.
- Any advanced status → "Tracked" (pressed ring), click = untrack request routed
  through the R191 confirmation guard (these entries have ≥2 timeline steps, so the
  dialog fires); it can never demote the status or append timeline steps.
- Status changes remain the job of the adjacent row select and detail-pane buttons.

## Acceptance criteria

1. Untracked job row shows "Save"; click saves (status saved, targeted copy prepared) —
   unchanged.
2. Saved job row shows "Saved" pressed; click untracks (guard applies per R191 rules).
3. Applied/Interviewing/Offer/Rejected row shows "Tracked" pressed with ring styling;
   click opens the R191 confirm dialog; Cancel keeps status/timeline/notes; Confirm
   removes the entry.
4. No path exists in the row button that writes a `saved` demotion step to history.
5. Row select and detail-pane status buttons unchanged; R188 chips, R190 timeline/notes,
   R191 guard regressions green.
6. Desktop 1440 + mobile 375, dark mode, no horizontal overflow, ≥40px touch target
   (existing min-h-10 preserved).
7. Zero AI quota; no Worker or storage changes.

## QA matrix (production)

- Fresh job: Save → Saved → advance to Applied via select → row button now "Tracked"
  pressed; click → dialog; Cancel intact; Confirm removes.
- Saved-only job: Saved click → immediate untrack (1 step, no notes → no dialog).
- Verify localStorage history never gains a demotion step from row-button clicks.
- Dark + 375px screenshots; restore baseline ["honestcv.clientId","honestcv.qa"].
