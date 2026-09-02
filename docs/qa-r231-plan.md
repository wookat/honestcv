# R231 QA plan — "Highlight in preview" matched-keyword paint (CSS Custom Highlight API)

Code evidence: src/lib/keywordHighlight.ts (word-boundary regex for single words `(?:^|[^a-z0-9])(kw)(?=$|[^a-z0-9])`, substring for phrases, ranges per text node, registry name 'kw-match'); Builder.tsx:817 session-only `highlightKw` state (not persisted), 1146-1160 effect (150ms debounce, deps resume/matched/previewView, clear on unmount/off/no-JD/no-matches), 6177-6187 checkbox `Highlight in preview` under Matched in Target job panel (only when CSS.highlights supported; Matched block itself needs JD + matches); index.css:302 `::highlight(kw-match)` amber rgb(254 240 138/.85) both themes. Bundles: index-DT29Pyuv.js / Builder-BrWJrSfo.js.

Fixture: sample resume + appended bullet "Maintained Java and JavaScript services for order tracking." (via UI edit); JD text: "We need React, TypeScript, Java and GraphQL experience with order tracking systems." → expect matched to include React, Java, GraphQL, order tracking (verify actual chips).

## K0 Bundles + checkbox appearance
Bundles live. No JD → no "Highlight in preview" checkbox. Paste JD → "Matched (N)" heading + checkbox appears. Screenshot.

## K1 Paint on (Pages view)
Check the checkbox → within ~500ms `CSS.highlights.get('kw-match')` defined with size>0. Pixel proof: zoomed clip of a preview line containing "React" shows amber background behind the word vs white elsewhere (screenshot). Count ranges; verify a range text equals each expected keyword.

## K2 Word boundary + phrase
Enumerate ranges: for keyword "Java", every range must be exactly "Java" and NOT inside "JavaScript" (check each Java-range's following char in its text node ≠ [a-z0-9] — i.e. no range with start offset equal to the "Java" inside "JavaScript"). Phrase "order tracking" painted as one range spanning the phrase (range.toString()==='order tracking', case-insensitive). Zoomed screenshot of the "Java and JavaScript … order tracking" bullet: Java amber, JavaScript's first 4 letters NOT amber, phrase amber.

## K3 Flow view + debounce edit + inline editing
Toggle preview to Flow view → highlights still present (registry re-applied; pixel screenshot). Edit resume via UI (append text containing "GraphQL" to a bullet) → after >150ms range count increases. Inline preview click-to-edit still works with highlight on (click a preview paragraph, it becomes editable/focused).

## K4 Off/clear semantics
Uncheck → `CSS.highlights.get('kw-match')` undefined; pixel amber gone. Re-check, then clear JD → checkbox block disappears AND registry undefined. Refresh with JD present → checkbox unchecked (session-only state).

## K5 Zero mutation
`honestcv.resume` byte-identical before/after toggle on/off; ATS score identical with toggle on vs off.

## K6 Dark mode
html.dark: preview paper still white, keyword amber visible; text-on-amber contrast ≥4.5:1 via lightest/darkest-core-pixel method (text is near-black on amber-200). Zoomed clip.

## K7 375px
Checkbox visible + tappable (rect ≥ ~14px, within viewport), scrollWidth 375 with Matched panel open. Screenshot.

## K8 Regressions (labelled)
R230 Show in editor: injected bullet turn → locate ring-flash still works. R225 chips smoke: LinkedIn break→fix shows Fixed chip. Keyword triage card (missing-keyword Add bullet dialog) still opens.

## K9 Cleanup
Zero /api/ai generation calls; light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].
Screenshots r231_*.png; results appended below.

## Results (executed live on production, bundles index-DT29Pyuv.js / Builder-BrWJrSfo.js)
- K0 passed: no checkbox without JD; with JD → Matched (6) + "Highlight in preview" checkbox (r231_checkbox.png)
- K1 passed: check on → CSS.highlights 'kw-match' size 12; range texts {React:3,TypeScript:3,order:2,tracking:2,Java:1,GraphQL:1}; amber pixels rgb(254,242,155) in preview (r231_preview_painted.png). Note: "order tracking" tokenizes to two single words — expected, phrases come only from KNOWN_PHRASES (ats.ts:33).
- K2 passed: bullet "Maintained Java and JavaScript…" → exactly ONE Java range with space neighbors (not painted inside JavaScript, r231_boundary_zoom.png); KNOWN_PHRASE "machine learning" painted as one phrase range (r231_phrase_zoom.png)
- K3 passed: Flow view keeps highlights (size 13, r231_flow_painted.png); textarea edit adding "GraphQL" → ranges 1→2 after ~150ms debounce; inline contentEditable preview edit with highlight on committed "Extra React work" to localStorage and React ranges 3→4
- K4 passed: uncheck → registry undefined + 0 amber px (r231_toggle_off.png); JD cleared → registry undefined + checkbox gone; refresh with JD → checkbox unchecked, registry undefined (session-only)
- K5 passed: honestcv.resume byte-identical across off/on toggles; visible score 93/100 unchanged
- K6 passed: explicit html.dark → app chrome dark, preview paper white, amber visible; text-on-amber contrast 14.43:1 (core-pixel method) (r231_dark_zoom.png, r231_dark_wide.png)
- K7 passed: 375px — Target job panel is in the preview pane (hidden lg:block); via bottom "Preview" pane switcher checkbox is visible 14x14, real tap → checked + registry 15, scrollWidth 360 ≤ 375 (r231_375_checkbox.png)
- K8 regression passed: R230 Show in editor ring flash True (r231_reg_locate.png); keyword triage card "Is this missing keyword relevant… Yes — draft a bullet / Add to Skills / No" present, "+ kubernetes" chip added to skills → chip flipped to matched ✓ (r231_reg_triage.png); R225 Fixed chip on "Professional summary present" after break→fix (r231_reg_fixed_chip.png)
- K9 done: only /api/ai/quota (zero generation calls); light theme; final localStorage exactly ["honestcv.clientId","honestcv.qa"]

Notes: regression screenshots (locate, triage panel, Fixed chip, desktop checkbox panel) were retaken at an explicit 1600px viewport after the first captures came out under leftover 375px emulation / with broken clips; the R230 ring-flash watcher returned true in both runs. r231_375_checkbox.png shows the mobile Preview pane with checkbox checked (Target job panel lives in the preview pane, reachable via the bottom Edit/Preview switcher); the painted resume itself is below the fold in that frame, so mobile paint is proven by registry size 15 + scrollWidth 360, not pixels.
