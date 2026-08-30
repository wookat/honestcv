# R86 — Sort by date for Experience/Education (bundle index-Dk1vrizl.js / Builder-B7Q0SKT6.js, commit 83f449a, PR #299, ZERO AI)

Code: Builder.tsx L1428+ / L1660+ render an outline "Sort by date" button (h-10 mobile / sm:h-7 desktop) at top-right of Experience/Education only when section length > 1; onClick setResume with sortEntriesByDate (resume.ts L461+): ongoing (end matches present|current|now|ongoing) first by startDate desc, then end??start desc, unparseable dates keep relative order at end. Goes through setResume → autosave + undo history.

Setup: backup honestcv.* → qa.r86.backup, clear, hard reload (verify chunk B7Q0SKT6), load example resume. Record.

## T1 Sort correctness (primary)
- Arrange 4 Experience entries in order: d=Freelance Consultant/SelfCo, dates EMPTY (first); a=Data Analyst/OldCorp "Jan 2018"–"Mar 2020"; c=QA Engineer/MidCo "May 2021"–"Aug 2022"; b=Software Engineer/Brightlane "Jun 2023"–"Present".
- Click "Sort by date" → resume.experience order must be exactly [b, c, a, d]; preview shows Brightlane first, SelfCo last; screenshot before+after.
- Reload (F5) → order persists [b, c, a, d] (autosave).
- FAIL if any other order (esp. d not sinking or b not first).

## T2 Idempotence
- Click "Sort by date" again → order identical [b, c, a, d].

## T3 Undo
- Ctrl+Z (after refocusing page; note: reload in T1 clears in-memory undo, so do T2+T3 BEFORE reload — adjust: T1 sort → T2 second click → T3 Ctrl+Z returns pre-sort [d, a, c, b] → redo sort → then reload persistence check).
- PASS: Ctrl+Z restores exact pre-sort order [d, a, c, b].

## T4 Drag reorder after sorting
- Real mouse drag (hold, move, screenshot mid-drag) of one entry's drag handle to a new position → order changes accordingly.

## T5 Education + gating
- Education has 1 entry: Experience-style button ABSENT in Education section (DOM count 0).
- Add a 2nd education "M.S. ..." with dates "2015"–"2017" placed AFTER the 2021 B.S.? (B.S. is 2017–2021) → actually place M.S. newer: use "Jan 2022"–"Present" added second-to-last? Simpler: add older entry FIRST via move-up so order is [old 2015–2017, B.S. 2017–2021] → Sort → [B.S., old]. Button appears once ≥2 entries.
- Single-entry gating for Experience: proven by Education 1-entry absence (same guard); also after example load Experience has 2 → button present.

## T6 Regression (no AI clicks)
- Both "Suggest a bullet" + "…with key numbers" present & enabled on filled entries (DOM, not clicked).
- Mono click → preview font-family "Courier New", ui-monospace, monospace → revert Auto.

## T7 Mobile 375
- Held CDP 375: both Sort by date buttons (Experience+Education) visible, height ≥40px, scrollWidth=375, scrollX=0.

## T8 Hygiene + cleanup
- Instrumented reload: 0 console/page errors; resource log has ZERO /api/ai/* except /api/ai/quota.
- Restore honestcv.* byte-for-byte (diffs:[], extra:[] before deleting qa.*), kill hold separately, desktop 1600, baseline Jordan Reyes score 100.
