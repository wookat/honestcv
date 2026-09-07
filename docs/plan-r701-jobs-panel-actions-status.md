# R701 — /jobs tracked-job panel: "Mark as followed up", reminder set / clear and Notes autosave are silent; "Clear reminder" drops keyboard focus to body

## Evidence (production index-D4Ovm76k.js, `qa/r701-evidence.cjs 1280`)

MutationObserver over every live region + 100 ms `activeElement` poll, keyboard `Enter` / typing on the control. Real first result on the jobs board, pipeline seeded empty, no resume (so the Save side effect that mints a targeted copy does not fire).

| action | visible change | live-region mutations | focus afterwards |
| --- | --- | --- | --- |
| list card **Save** | button label Save → Saved, `aria-pressed` false → true | none | stays on the button |
| panel chip **Applied** | chip `aria-pressed` → true, timeline gains "→ Applied · Sep 7" | none | stays on the chip |
| **Mark as followed up** | timeline gains "→ Followed up · Sep 7" (off-focus, above the button) | none | stays on the button |
| **Remind me to follow up** date → 2026-12-01 | "Clear reminder" button appears next to the input | none | stays in the input |
| **Clear reminder** | button unmounts, reminder gone | none | **body** |
| **Notes** blur after typing | notes persisted to `honestcv.jobPipeline` | none | next tabbable (the Next-step link) |

Assessment: Save and the status chips carry their own state (`aria-pressed`) on the focused control, so a screen reader hears "pressed" — not a gap. The other four are genuine WCAG 4.1.3 silences: the only outcome of "Mark as followed up" is a new list item the user is not on; the reminder date input's own value is the only cue that a reminder exists (nothing says one was *set*, and clearing it is both silent and loses focus — WCAG 2.4.3); Notes autosave on blur has no "saved" feedback anywhere (the builder's own autosave has a `role=status` "Saved" indicator, so the jobs board is the odd one out).

## Fix (Jobs.tsx only)

- Add the same `actionNote` + `announce(text)` (1.8 s self-clear) pair used by Dashboard since R699, rendered as an always-mounted `<p role="status" className="sr-only">` inside the fixed bottom status stack (so it lives alongside the Undo toast, which already has `role=status`).
- `Mark as followed up` → after `applyPipeline` succeeds: `announce('Marked as followed up — added to the timeline.')`. Focus stays where it is (the button remains mounted).
- Reminder date `onChange` with a value → `announce(\`Reminder set for ${shortDay(value)}.\`)`; with an empty value (native clear) → `announce('Reminder cleared.')`.
- `Clear reminder` → `announce('Reminder cleared.')` + `focusAfterRender('job-remind')` so focus lands back on the (now empty) date input instead of body.
- Notes `onBlur` → after `applyPipeline(setPipelineNotes(...))` succeeds: `announce('Notes saved.')`. No announcement when nothing changed (`notesDraft` for another job / untouched).
- `applyPipeline` returning `false` (storage full) keeps the existing `role=alert` path and announces nothing.

No data / storage / layout / visible copy changes. The status text is sr-only.

## QA (`qa/r701-verify.cjs 1280|375`)

Same six-step sequence; expect exactly one substantive `role=status` mutation for steps 2–5 with the texts above, focus terminal `#job-remind` after Clear reminder (inView), and unchanged `aria-pressed` behaviour for Save / chips. Storage restored in `finally`, 0 console errors.
