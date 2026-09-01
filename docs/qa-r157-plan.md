# R157 QA plan — Score-breakdown findings jump to the offending entry (PR #372, bundles index-jK_7eOZF.js / Builder-BzNh9pPc.js)

Code evidence (diff on devin/1788242322-r157-score-entry-jump):
- guidance.ts: Quantified impact / Action verbs / Brevity / Consistency findings become `richFindings` with `entryId` + `entryLabel` = "role, company". Buzzwords, completeness, summary-too-long and placeholder findings carry NO entry.
- Builder.tsx ~L2143: experience card div gets `data-entry-id={e.id}` and `ring-primary/60 ring-2` while `flashEntryId===id` (1600ms). `jumpToEntry` (~L880): setMobilePane('edit') + un-collapse + smooth scrollIntoView(center).
- HealthDialog (~L7870): findings with entry render `<button aria-label="Go to entry: {label}" class="text-primary ... min-h-10 sm:min-h-0 underline">→ {label}</button>`; click closes dialog then jumps. Section "Fix →" + Guide links unchanged.

Fixture: standard (/tmp/r1371_before.json). Add to Role 2 (Junior Developer, Nova Retail) a weak no-number bullet "Worked on various projects across the retail platform" via UI → Quantified impact + Action verbs findings for that bullet with chip "→ Junior Developer, Nova Retail".

## C1 Bundles
Cache-busted fresh load; assert exactly index-jK_7eOZF.js + Builder-BzNh9pPc.js. Baseline storage clean.

## C2 Desktop 1600: entry chip renders + jump to EXPANDED entry
Add the weak bullet to Role 2; open Score breakdown via sticky health chip. PASS: under Quantified impact, finding `No number: [Junior Developer] "Worked on various projects…"` is followed by an underlined "→ Junior Developer, Nova Retail" button (aria-label "Go to entry: Junior Developer, Nova Retail"); same under Action verbs ("Weak opener: …"). Click the Quantified chip → PASS: dialog closes, page smooth-scrolls so `[data-entry-id]` card for Role 2 is near viewport center, and THAT entry card div (not the Experience Section card) carries `ring-primary/60 ring-2` transiently (screenshot mid-flash). FAIL if chip absent, ring lands on Section card, or scroll goes to Role 1.

## C3 Desktop: jump to COLLAPSED entry expands it
Collapse Role 2 via its collapse button. Reopen dialog, click the "→ Junior Developer, Nova Retail" chip (Action verbs row). PASS: dialog closes, Role 2 card EXPANDS (its inputs visible), scrolled to center with ring flash. FAIL if card stays collapsed or no expand.

## C4 No entry chip on non-entry findings
In the same dialog, PASS: Buzzword-free findings (fixture may need a buzzword — add "responsible for" bullet if none) and Completeness/Consistency-placeholder findings show NO "→ …" button (only text ± Fix →/Guide). At minimum verify zero `[aria-label^="Go to entry:"]` buttons inside the Buzzword-free and Completeness blocks. FAIL if any non-entry finding gains a chip.

## C5 Mobile 375
Emulate 375, Edit tab, open dialog via sticky score chip. PASS: entry chip computed height ≥40 (`min-h-10`); tap → dialog closes, stays/switches to Edit pane, Role 2 card centered in view with ring; `scrollWidth` ≤ 375 (360 quirk OK). FAIL if lands on wrong entry or chip <40px.

## C6 Regressions (quick)
- Dimension-level "Fix →" (e.g. word-count/structure finding) still closes dialog and jumps to the Experience/relevant Section with the old section ring.
- Guide links still present on dimension rows with correct hrefs (spot-check one).
- R156 "Update job description →" still jumps to Target job (needs JD set; or empty-state link).
- R155: expanded Role header still shows span ⚠ chip with focus popover.

Cleanup: restore localStorage to exactly ["honestcv.clientId","honestcv.qa"]; fresh desktop tab innerWidth 1600; no AI/share/payment/export/delete.
