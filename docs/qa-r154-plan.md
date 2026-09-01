# R154 QA plan — guided keyword triage card (PR #369, bundles index-DuXTbS80.js / Builder-BZ2beTaa.js)

Code evidence (Builder.tsx @db18962, lines 5788–5840): when `ats.missing.length > 0`, a `bg-muted/40` card renders above the "Missing (N)" list with question "Is this missing keyword relevant to your experience?", a rounded chip showing `ats.missing[0]`, counter "1 of {missing.length}", and three buttons: "Yes — draft a bullet" (`setKwBulletFor(missing[0])` → keyword-bullet AI dialog, line 6137), "Add to Skills" (appends to `resume.skills`), "No — not relevant" (appends to `ignoredKeywords` → Excluded list at line 5898 with per-item restore removing it, line 5912). No index state → card always shows current missing[0]. Buttons `h-10 text-xs sm:h-7` (40px < sm).

Fixture: standard full resume (/tmp/r1371_before.json) + JD "We are hiring a Software Engineer with React, TypeScript, Node.js, PostgreSQL and AWS experience to build customer-facing web applications and REST APIs." (known to yield 2 missing: "hiring", "build" — if fewer than 3 missing, extend the JD with extra terms e.g. "Docker, Kubernetes" to get N ≥ 3).

## T1 Bundle + card appears
Cache-busted fresh load, assert exactly index-DuXtBS80/Builder-BZ2beTaa (exact strings from user: index-DuXTbS80.js / Builder-BZ2beTaa.js). Seed fixture from /, go to /builder, paste JD via Target job textarea. PASS: triage card visible above "Missing (N)" with question text, first missing keyword chip, counter "1 of N" where N == Missing (N) count. FAIL if card absent, wrong keyword, or counter ≠ missing count.

## T2 Add to Skills
Click "Add to Skills" (real UI click). PASS: keyword appended to Skills input value (comma-separated), keyword moves to Matched list, card now shows the NEXT keyword with "1 of N−1", Missing (N−1), ATS score changed/recomputed. FAIL if keyword not in skills field, counter unchanged, or card keyword unchanged.

## T3 No — not relevant
Click "No — not relevant". PASS: keyword appears under "Excluded (M)" with a restore control; card advances to next keyword, counter decrements. Then click restore on that excluded keyword → PASS: it returns to Missing pool and the triage card shows it again (it re-enters missing order) / counter increments. FAIL otherwise.

## T4 Yes — draft a bullet
Click "Yes — draft a bullet". PASS: existing keyword-bullet dialog opens showing the SAME keyword as the card chip; close it WITHOUT generating (no AI call). FAIL if dialog missing, wrong keyword, or any generation triggered.

## T5 Pool empties
Triage remaining keywords via Add-to-Skills / No until missing == 0. PASS: triage card disappears entirely; Matched list remains populated; no "Missing" header. FAIL if card lingers with empty chip.

## T6 Regressions
- Per-chip micro-buttons under Missing list (+ / sparkles / ×) still render and + works (spot check before pool empties).
- R153: Score breakdown dialog still shows Guide links on rows.
- R152: nav score chip present, equals Full health report link.

## T7 Mobile 375
Emulate 375, with ≥1 missing keyword. PASS: three triage buttons computed height ≥ 40px; docScrollWidth ≤ innerWidth (360 quirk OK); card contained. Tap "Add to Skills" works.

Cleanup: restore localStorage to exactly ["honestcv.clientId","honestcv.qa"]; no AI generation/share/payment/export/delete; fresh desktop tab innerWidth 1600.
