# R152 QA plan — pinned health-score chip in SectionNav (commit 1330ebf, bundles index-BgmvWfPA.js / Builder-Bu7hDzjK.js)

Code evidence (src/pages/Builder.tsx diff @1330ebf): nav is now `flex items-center gap-1` (no own overflow); section chips moved into inner `div.min-w-0.flex-1.overflow-x-auto`; new trailing button `aria-label="Resume health score ${score} out of 100 — open full report"` with `shrink-0 min-h-10 sm:min-h-8 tabular-nums`, HeartPulse icon + score text; color: emerald ≥80, amber ≥50, red <50. onClick sets healthSeen + `setHealthOpen(true)` → same "Full health report" dialog as strength-card link. Score = `health.score` (same value as "Full health report — N/100" link).

Fixture: standard mixed resume (contact/summary/3 roles/1 education/skills).

## H1 Bundle: hard refresh, assert exactly index-BgmvWfPA.js + Builder-Bu7hDzjK.js; baseline storage clean before seeding.

## H2 Desktop (1600) chip presence + parity + dialog
PASS: button `[aria-label^="Resume health score"]` exists at right edge of `nav[aria-label="Resume sections"]` (chip rect.right ≈ nav rect.right − ~4px, and > all section chips' right); its number equals N in the strength card link "Full health report — N/100"; color class band matches N (e.g. 50≤N<80 → amber-*). Scroll deep into the form (~2000px): nav still sticky at top≈56 and chip still visible in screenshot. Click chip → dialog opens with "Full health report" heading; close (X / Escape) → dialog gone. FAIL if number mismatch, chip scrolls away, or dialog doesn't open.

## H3 Live score update
Record score N0 + chip classes. Clear the Summary textarea via UI → chip number changes to N1 ≠ N0 (lower) and color band matches new value; strength-card link shows same N1. Restore summary text → chip returns to N0. FAIL if chip static while link changes.

## H4 Mobile 375
Emulate 375: PASS: chip visible at right end; inner wrapper scrollWidth > clientWidth (section chips scrollable) while chip stays pinned — scroll inner wrapper to the right, chip's rect unchanged (screenshot before/after); document scrollWidth ≤ 375; chip computed min-height 40px & rect height ≥ 40; touch tap on chip opens the health dialog. FAIL if chip scrolls with the chips row or dialog doesn't open on tap.

## H5 R151 regression with new wrapper
Desktop + mobile: click a section chip (e.g. Education) → smooth jump, ring flash, card top below nav bottom; scrolling still moves aria-current. PASS criteria as R151 S4/S5.

## H6 Strength-card link regression
Click "Full health report — N/100" link in strength card → same dialog opens. PASS: dialog visible.

Cleanup: restore localStorage to exactly ["honestcv.clientId","honestcv.qa"], fresh tab, innerWidth 1600. No AI/share/payment/export/delete.
