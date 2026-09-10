# R857 — Tracked-tab bulk checkboxes get a hit box the size of the other row controls

Carried over from R856: measure the Tracked-tab bulk actions at 375 before touching anything.

## 1. Evidence (production, R856 bundle `index-CUXMwpSn.js` / `Jobs-DmV8mTLa.js`)

`/home/ubuntu/qa/r857-evidence.cjs`, fresh cache-disabled contexts at 375×812 and 1280×800; three
real jobs tracked through the pane's `#track-chip-saved`, then `/jobs?tab=tracked&q=<no match>` so
the pipeline is the rows' only source; `Select…` entered with a trusted click.

| control (375 / 1280)            | size                       |
| ------------------------------- | -------------------------- |
| `Select…`                       | 72.8 × 40 / 111.7 × 32     |
| Move-to-status `<select>`       | 104 × 40 / 104 × 32        |
| `Untrack 1`                     | 79.4 × 40 / 79.4 × 32      |
| **row checkbox**                | **16 × 16 / 16 × 16**      |

The checkbox was a bare `<input type=checkbox class="mt-1 size-4">` with no `<label>`: the visible
box *was* the whole interactive area. `elementFromPoint` 12–16 px from its centre returned the
row `<div>`; trusted `mouse.click` 14 px right / above / below the second checkbox left it
unchecked and moved nothing (`activeElement` stayed `main`). The job-card `<button>` starts 10 px
to the checkbox's right (`gap-2.5`). axe `target-size` did not report the input at either width
(the rule accepts a 16 px control when nothing else is within 24 px), so this never showed up in
the SOP-10 scans — the finding comes from the pointer probe, not from axe.

## 2. Options (simulated on the production DOM first — `/home/ubuntu/qa/r857-simulate.cjs`)

1. Leave it — every other control in that row is 40 / 32 px; a 16 px tap target next to them is
   the odd one out on a touch width.
2. Enlarge the input itself (`size-6`) — changes the visual, shifts the card 8 px right at every
   width.
3. **Wrap the input in a `<label>` padded out to the row's own padding, with negative margins so
   the box takes no layout space** — chosen. Simulation at 375 / 1280: label 36 × 44, checkbox
   still 16 × 16 at the same spot, row height and card rect unchanged, label right edge 2 px short
   of the card button (R852: a hit box never covers a neighbouring control), points ±14 px around
   the centre hit the label, clicks on the label corners toggle the box.

## 3. Change (`src/pages/Jobs.tsx`, one element)

```tsx
<label className="-my-3 -ml-3 -mr-2 flex shrink-0 cursor-pointer py-3 pr-2 pl-3">
  <input type="checkbox" … aria-label={`Select ${j.title} at ${j.company}`} className="accent-primary mt-1 size-4 shrink-0" />
</label>
```

`py-3 pl-3` mirror the row's `px-4 py-3` minus the 4 px the row keeps on the left; `pr-2` uses
8 px of the row gap; the three negative margins give the padding back so nothing moves. The
accessible name, native checkbox semantics and the visible box are unchanged.

### 3b. Second deploy — the gap (measured on the first deploy, touch)

The first deploy kept the row gap at `gap-2.5` (label right edge 2 px short of the card). Mouse
passed everywhere, but the independent QA run's CDP touch sweep found taps inside the label's
right 4 px (x 55–57 with checkbox centre 41, label 21..57, card 59) delivered a trusted click to
the card-title `<p>` at x 64–65: the job opened, the URL gained `job=…`, the checkbox did not
toggle — the same on all three rows and at touch radius 1 and 12. My A/B probe
(`/home/ubuntu/qa/r857-touch-ab*.cjs`) showed the identical boundary with the label removed from
the DOM, so this is Chrome's touch adjustment (a tap snaps to a clickable element within a few px
of the touch point; the card button is clickable, the label's padding is not a target of its
own), not the label geometry — the label just made the region a user is invited to tap larger
without moving the card away. DOM simulation: a 16 px gap (card 8 px clear of the label) makes
every in-label tap toggle at both radii. Change: bulk-mode row `gap-2.5` → `gap-4`; the label
is unchanged, the card moves 6 px right in bulk mode only, row height unchanged. Rejected:
shrinking `pr-2` (gives back hit area), `pointer-events` tricks on the card (changes a real
control), `touch-action` (does not affect adjustment).

Tests: `tests/jobs-panes.test.ts` +3 (440 → 443) lock the wrapper classes, the untouched input
classes / `aria-label`, and the 16 px row gap.

## 4. Verification

- Gates: vitest 443, `tsc -b`, `eslint src tests worker` 0 errors / 11 pre-existing warnings,
  build, verify-dist 123.
- Deploy `675db9cf`; production `index-CwpJzz6K.js` / `Jobs-BryAOzmV.js`.
- Native re-measure (`/home/ubuntu/qa/r857-verify.cjs`, 375×812 + 1280×800): label 36 × 44 on all
  three rows, checkbox 16 × 16, row 326 × 144 / 337 × 132 and card rects identical to the R856
  measurements, label → card gap 2 px, ±12/14/16/19 px probes hit the label, corner taps toggle,
  console 0.
- Observation (pre-existing, not changed): at 375 the first tick makes the Move-to-status /
  `Untrack N` controls appear on a second line, so the rows move down 48 px once; the checkbox
  under the pointer is then 48 px lower (`/home/ubuntu/qa/r857-shift.cjs`).
- Independent QA on the first deploy (375 + partial 1280): geometry, mouse, keyboard Space,
  Move-to-status, Untrack 1 → Undo focus, rapid Tab → Dismiss (80.4 / 80.9 / 205.7 ms), Done
  selecting restores exact rects, axe 375 bulk list 0 violations — pass; **touch in-label taps
  at +14 px opened the card** (8 misses at 375, 6 at 1280) → §3b.
- Second deploy `f0912044`; production `index-DGGMRCUQ.js` / `Jobs-Cn_nszOk.js`. Native touch
  sweep (`/home/ubuntu/qa/r857-touch-native.cjs`, 375×812, radius 1 and 12, step 2 from the
  checkbox centre to the card edge): every x inside the label (41 → 57) toggles; x 59 is the
  row gap (toggles via the label at radius 1, opens the card at radius 12); x ≥ 61 opens the
  card (card left 65). Console 0, storage restored.
- Independent QA on the second deploy: see `docs/handoff-context.md` (R857) once complete.
- Limitations: CDP `Input.dispatchTouchEvent` in headless Chromium stands in for a finger — no
  physical device; the adjustment radius it models may differ from a real phone. No screen
  reader.

## 5. Not covered / still open from the R857 candidate list

- Sticky-bar `partiallyObscured` axe findings: still no user-visible case measured.
- Other `onCloseAutoFocus` users (Dashboard delete ×3, Builder copy-delete, Builder final
  download check): located, not yet exercised for the R856 race.
