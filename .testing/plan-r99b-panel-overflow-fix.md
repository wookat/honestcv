# R99b — Saved-roles panel 375px overflow fix (bundle index-CXX4k6Qo.js, commit 5e175c0)

Change: Builder.tsx panel container gains `min-w-0 overflow-hidden`, each row gains `min-w-0`. Prior bug: long "Software Engineer — Brightlane" row inflated grid column → scrollWidth 396 at 375px.

Setup: backup localStorage → qa.r99b.backup, load example, CDP hold 375×812 + reload under emulation (assert innerWidth===visualViewport.width===375 before measuring).

## T1 P2 re-verify (the exact prior repro)
- Save stock "Software Engineer — Brightlane" role via bookmark; open "From library (1)" panel.
- PASS: `document.documentElement.scrollWidth === 375` with panel open (prior: 396); row `<p>` visibly truncated with ellipsis (p.scrollWidth > p.clientWidth or offsetWidth < full-text width; screenshot shows "Software Engineer — Brightla…"); no element rect right > 376.

## T2 Panel Insert/Delete sanity (still at 375px)
- Tap Insert → role appended with all fields, new id ≠ source. Tap trash → entry gone, button hidden, storage [].

Cleanup: restore qa.r99b.backup byte-for-byte (diffs:[], extra:[]), kill hold, desktop reload → Jordan Reyes ATS 88.
