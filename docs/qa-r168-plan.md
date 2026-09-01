# R168 QA plan — inline wavy lint underline in bullet editors (PR #383, bundles index-DLKUtRwN.js / Builder-DzEPmtTq.js)

Code evidence (branch devin/1788260312-r168-inline-lint-underline, commit ad256fa):
- src/components/LintedTextarea.tsx: wraps Textarea in relative div; pointer-events-none backdrop (absolute inset-0, px-3 py-2 text-sm, whitespace-pre-wrap, text-transparent) renders one span per line; flagged lines get `underline decoration-amber-500 decoration-wavy underline-offset-4`. UNDERLINED_KINDS = weak-opener, first-person, filler, buzzword, passive, too-long (NOT no-metric / punctuation / too-short). onScroll syncs backdrop.scrollTop.
- Builder.tsx usage: 2493 Experience achievements (`exp-…-bullets`), 3247 Projects description ("What it does and your impact"), 3480 Involvement description ("What you did there — one bullet per line").
- guidance.ts: "worked on" = weak-opener; FILLER_WORDS includes various/stuff → "worked on various stuff" flags weak-opener+filler. "Cut deploy time by 60% by introducing CI caching." trips none of the underlined kinds (only possibly none at all; has metric, active verb).

Assertion technique: pixels are primary (amber wavy underline visible in zoomed screenshot). DOM secondary: backdrop span count/classes; alignment measured by comparing backdrop and textarea client rects and computed font/padding.

## N1 Bundles + fixture
Cache-busted load → exactly index-DLKUtRwN.js + Builder-DzEPmtTq.js. Seed /tmp/r1371_before.json, 1440px.

## N2 Experience: flag appears and disappears (primary)
Type "worked on various stuff" as a bullet line in Experience achievements. PASS iff backdrop span for that line has decoration-wavy classes AND zoomed screenshot shows an amber wavy underline under exactly that text. Replace the line with "Cut deploy time by 60% by introducing CI caching." → span no longer underlined; screenshot shows no underline (no-metric-class issues must NOT underline — this line may still show items in BulletGuidance? it has a metric so likely clean; the assertion is only about the underline).

## N3 Multi-line mix + empty line
Textarea content (3 lines): clean metric line, "", "worked on various stuff". PASS iff only line 3's span is underlined; empty-line span not underlined; screenshot shows underline only under the last line.

## N4 Wrap alignment
Enter one long flagged line (>1 wrapped visual line, e.g. "worked on various stuff across many different projects and teams while helping with lots of things and utilizing synergy to leverage outcomes" — filler+buzzword+too-long). PASS iff underline follows both wrapped visual lines under the text (zoom screenshot), and backdrop metrics match textarea: identical x/y/width of content box (getBoundingClientRect + computed padding/font-size/line-height equal).

## N5 Scroll sync
Enter 8+ lines (mix flagged/clean) so the textarea (rows=4) scrolls. Scroll textarea to bottom via dispatching scroll (wheel over textarea). PASS iff backdrop.scrollTop === textarea.scrollTop after scroll and zoomed screenshot shows underline aligned under the visible flagged line.

## N6 Pointer transparency / typing unaffected
Click mid-word inside the flagged text at its visual position → PASS iff focus lands in the textarea and selectionStart matches the clicked offset region (±2 chars); typing inserts characters normally.

## N7 Projects + Involvement
Type "worked on various stuff" into Projects description and Involvement description. PASS iff each shows the amber wavy underline (screenshot each).

## N8 BulletGuidance + AI-fix regression (R139)
With the flagged Experience line present, the guidance list below shows the weak-opener/filler warnings and a "Fix line N with AI" button exists (do NOT click — no AI call needed this round). PASS iff both visible.

## N9 Mobile 375
Edit tab shows Experience card; flagged line underlined, scrollWidth ≤ 375. Screenshot.

## N10 R167 regression
Language select → Español: preview headings become Resumen/Experiencia/Educación/Habilidades; back to English. PASS iff localized then restored.

Cleanup: remove honestcv.resume/resumeHistory; localStorage exactly ["honestcv.clientId","honestcv.qa"]; fresh desktop viewport. No AI calls, no share links, no payments, no exports.
