# R169 QA plan — entry-level balanced key-number mix (PR #384, bundles index-BCOr-cK5.js / Builder-DCWvqgHG.js)

Code evidence (commit af521af):
- guidance.ts: checkBullets() now filters out `no-metric`; new bulletMix() → balanced iff total===0 || quantified (lines containing a digit) >= max(1, ceil(total/3)).
- Builder.tsx ~7379 BulletGuidance: when !mix.balanced renders amber li "⚠ Key numbers in {q} of {n} bullet(s) — aim for a balanced mix of descriptive and key-number bullets (%, $, count or timeframe)."; green all-clear line now also requires mix.balanced. Per-line items (weak-opener etc.) + "Fix line N with AI" unchanged for other kinds; no per-line "No numbers" and no AI fix for missing numbers.
- Builder.tsx ~7243 bulletFindings: unbalanced pushes one finding {category:'Quantified bullet points'} with NO line number (audit chip/popover, R148–R155).
- Builder.tsx ~1345 Final check: countIssues = per-line issues + (balanced ? 0 : 1) per entry.

Test lines (guidance.ts): digit test is /\d/. Clean no-digit line that trips no other kind: "Led design reviews across frontend guild teams." (strong opener Led, no filler/buzzword/passive/pronoun, <25 words, ends with period → no punctuation issue). Digit line: "Cut deploy time by 60% by introducing CI caching."

Fixture /tmp/r1371_before.json; 1440px CDP target; sections Projects/Involvement defaultOpen=false (expand headers first).

## P1 Bundles
Cache-busted load → exactly index-BCOr-cK5.js + Builder-DCWvqgHG.js; baseline storage clean; seed fixture.

## P2 Four no-digit bullets → ONE mix row, no per-line "No numbers" (primary, 1440)
In Experience #1 achievements enter 4 clean no-digit lines (variants of the Led line with different strong openers: Led/Directed/Organized/Facilitated + no digits). PASS iff:
- Guidance shows exactly one amber row: "⚠ Key numbers in 0 of 4 bullets — aim for a balanced mix of descriptive and key-number bullets (%, $, count or timeframe)."
- NO row contains "No numbers" and NO "Fix line N with AI" button is present (these lines have no other issues).
- Screenshot (pixels) shows the single amber row.

## P3 Audit chip: entry-level single finding, no line number
Open the Experience entry audit chip popover. PASS iff "Quantified bullet points" appears as ONE finding without any "Line N" annotation (other categories may show line numbers).

## P4 Fix the mix → row disappears, green all-clear
Add digits to 2 of the 4 bullets (edit lines to include "60%" / "3 weeks"). ceil(4/3)=2 → balanced. PASS iff the mix row disappears and (entry filled, 3–6 bullets, no other issues) the green all-clear line appears. Screenshot.

## P5 Boundary 1 of 4 → still unbalanced
Revert to exactly 1 digit line + 3 no-digit lines. PASS iff amber row shows "Key numbers in 1 of 4 bullets" (1 < ceil(4/3)=2). Then remove one no-digit line (1 of 3, ceil(3/3)=1) → row disappears (balanced).

## P6 Wording issues still per-line + AI fix; R168 underline unchanged
Change one line to "worked on various stuff". PASS iff: per-line warning(s) "Line N: Starts with "worked on"…" render, "Fix line N with AI" button present (not clicked), and the line shows the R168 amber wavy underline; the no-digit clean lines show NO underline (no-metric never underlined).

## P7 Projects + Involvement same behavior
Expand "Projects (optional)" and "Involvement", add an entry each, enter 2 no-digit clean lines in the description. PASS iff each shows the mix amber row ("Key numbers in 0 of 2 bullets") and no per-line "No numbers".

## P8 Final check counting
Set Experience #1 to 4 no-digit clean bullets (1 mix warning, no other issues) and leave Projects entry with 2 no-digit lines (1 mix warning); remove other warnings where practical (Experience #2 untouched — record its own count). Click a download (PDF) to surface the "Final check before download" dialog. PASS iff the bullet-warning count shown is consistent with +1 per unbalanced entry (compare count with mix rows visible in guidance; exact expected number computed at run time from visible warnings). Cancel the dialog (do NOT download).

## P9 Mobile 375
Edit tab, Experience card with the unbalanced state: mix amber row visible, scrollWidth ≤ 375. Screenshot.

## P10 Regressions
- R167: Language → Español → preview headings Resumen/Experiencia/Educación/Habilidades; back to English.
- R168: covered in P6 (underline on weak line, none on clean lines).

Cleanup: remove honestcv.resume/resumeHistory; localStorage exactly ["honestcv.clientId","honestcv.qa"]; fresh desktop tab. No AI calls, share links, payments, downloads completed.
