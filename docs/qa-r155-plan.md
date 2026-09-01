# R155 QA plan — audit chip on expanded cards (PR #370, bundles index-ZjY0_dBF.js / Builder-lFpo5OSa.js)

Code evidence (Builder.tsx diff on devin/1788240647-r155-live-audit-chip): `EntryAuditChip` now renders unconditionally on Experience (~L2149), Education (~L2528), Projects (~L2868) headers with new `expandable={collapsedEntries.has(id)}`. When `expandable=false` the warning chip is `<span tabIndex={0} aria-label="Role N: N suggestion(s)">⚠ N</span>` inside a `group relative` span (popover on hover/focus via group classes) — no button, no onExpand. Collapsed path unchanged (button + pointerdown expand, R150). Green ✓ span unchanged. Findings derive from live resume state → recompute while typing.

Fixture: standard full resume (/tmp/r1371_before.json). Its Role 1/2 bullets are clean-ish; to get findings on an EXPANDED entry, blank Role 1's start date via UI and/or degrade a bullet (e.g. prepend "worked on stuff" line). Cards default to expanded on load only for entries?? — R148 note: reload re-expands every card; collapsed set is React state. So after reload all cards are expanded → perfect for expanded-chip tests.

## A1 Bundle: cache-busted fresh load; assert exactly index-ZjY0_dBF.js + Builder-lFpo5OSa.js (Builder via performance resources). Baseline storage clean before seed.

## A2 Expanded Experience chip + popover
After reload (all cards expanded), degrade Role 1 via UI: clear start date (June 2023 → empty) and edit bullet 2 to "worked on various stuff". PASS: header shows amber `span[tabindex="0"]` "⚠ N" (NOT a button; verify tagName SPAN) while the card body (inputs) is visible; keyboard focus (Tab/focus()) opens the grouped popover showing "Dates are missing" + its explanation, weak/filler categories with "line 2" refs, and green "N best practices applied" rollup with names. Screenshot proves chip + popover + expanded inputs simultaneously visible. FAIL if chip absent on expanded card (old behavior) or popover missing content.

## A3 Live recompute while typing
With popover state noted (count X incl. Dates are missing): type a start date into Role 1 start-date input. PASS: chip count drops by 1 within ~1s without collapsing/reloading, "Dates are missing" gone from popover. Then restore bullet 2 to original clean text → all findings resolved → chip flips to green ✓ (span, title "Best practices applied"), focus popover names passed checks. FAIL if count static (no live recompute) or chip stays amber when clean.

## A4 Click does nothing on expanded chip
Real mouse click on the expanded ⚠ chip (re-degrade date first so chip is amber). PASS: card remains expanded (inputs still visible), no collapse/expand toggle, no navigation; chip still present. FAIL if card collapses or any toggle occurs.

## A5 Collapsed regression (R148–R150)
Collapse Role 1 via its collapse button. PASS: chip becomes a BUTTON; pointerdown/click expands the card again (inputs reappear). 

## A6 Education + Projects expanded chips
Education 1: clear start date via UI → expanded header shows ⚠ 1 (span) whose popover has only "Dates are missing" + explanation; restore date → green ✓ "1 best practice applied". Projects: expand Projects optional section; project with description lines shows chip per bullet checks (amber or green; assert presence + span tag). FAIL if either section lacks the expanded chip.

## A7 Mobile 375
Emulate 375, reload (expanded). Focus/tap the expanded Role chip. PASS: popover uses fixed bottom-sheet placement (position fixed, rect within 16..359, bottom above the Edit/Preview tab bar), docScrollWidth ≤ 375, chip visible in header. FAIL on horizontal overflow or anchored-clipped popover.

## A8 Regression R154 (quick)
Desktop: paste short JD → keyword triage card renders in ATS panel with "1 of N" and 3 buttons (no interaction needed beyond render + one Add to Skills). 

Cleanup: restore localStorage to exactly ["honestcv.clientId","honestcv.qa"], fresh desktop tab innerWidth 1600, no AI/share/payment/export/delete. Use precise selector for excluded restore if needed (title includes 'keyword pool').
