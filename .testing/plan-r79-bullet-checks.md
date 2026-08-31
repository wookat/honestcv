# R79 — per-entry bullet best-practice checks (bundle index-YEQVQV-z.js, commit 01f86dd, frontend-only, ZERO AI sends)

Code evidence: src/lib/guidance.ts — buzzword issue `"X" is an empty claim — replace it with a concrete, checkable fact` (BUZZWORDS word-boundary vs lower; incl. 'team player','synergy'); punctuation issue `Capitalize the first letter and end with a period` when !/^[A-Z0-9]/ or !/[.!?]$/. Builder.tsx BulletGuidance (~L4123): `entryFilled=Boolean(e.role.trim()||e.company.trim())`; count note first `⚠ Include 3–6 bullet points per role — {count===0?'none':count} found in this one.` when entryFilled && (count<3||count>6); renders max 4 lines × 2 issues each. R63 dates warning L1491.

Setup: throwaway client (backup→qa.r79.backup, clear, reload), load nothing — use empty template + fill Experience fields via UI. No AI clicks anywhere.

## T1 All new flags on adversarial bullet
- In Experience entry 1: type role "Engineer", bullets textarea: `team player driving synergy` (lowercase start, no period, buzzword ×2 possible, no metric).
- PASS (screenshot + DOM): guidance list under bullets shows FIRST the amber count note exactly `⚠ Include 3–6 bullet points per role — 1 found in this one.`, then a line-1 entry containing `"team player" is an empty claim — replace it with a concrete, checkable fact` AND `Capitalize the first letter and end with a period` (2-issue cap: no-metric flag suppressed on that line — proves slice(0,2)). "Fix line with AI" button rendered (NOT clicked).

## T2 Flags clear on fix; count-note boundaries
- Replace bullet with `Led a team of 8, cutting deploy time 40%.` → PASS: buzzword+punctuation+no-metric all gone; only count note remains (`1 found`).
- Add 2 more clean bullets (3 total) → PASS: count note disappears entirely (guidance ul absent or no ⚠ Include line).
- Paste to 7 bullets → PASS: count note returns with `7 found in this one.`

## T3 Empty entry no count note
- Second/new experience entry with role+company empty, 0 bullets → PASS: NO `Include 3–6` line for that entry (DOM count of 'Include 3–6' == only entries with role filled).

## T4 375px
- Held CDP 375: Experience section with T1-style warnings visible → PASS: innerWidth=clientWidth=scrollWidth=375, scrollX 0; warning text wraps, no horizontal overflow (screenshot).

## T5 Regression + hygiene
- R63: clear entry-1 dates (if set, they're empty on template anyway — with role filled, expect `⚠ Dates are missing — add a start date…` visible above bullets). PASS: line present with role filled.
- R78: restore saved /tmp/r78_chat.json to honestcv.assistantChat via CDP + reload, open assistant → PASS: 4-pill chip row above composer (no send).
- Instrumented reload: 0 console/pageerrors; /api/ = hit, billing/status, ai/quota only; ZERO /api/ai/assistant or other AI calls entire run; quota footer unchanged (12 on throwaway, never decremented).
- Cleanup: restore honestcv.* byte-for-byte from qa.r79.backup (diffs:[]/extra:[] before deleting qa.*), desktop 1600, reload baseline (Jordan Reyes, quota 8).
