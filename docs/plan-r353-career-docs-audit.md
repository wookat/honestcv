# R353 — exploratory production audit: career documents chain

## Evidence / rationale
- Rezi changelog (https://www.rezi.ai/rezi-changelog) has no new entries since 2026-08 Week 4 — no new public-surface deltas to chase this round.
- The career documents surface accumulated many feature rounds (R238 addressee, R246 highlights, R248 import, R302 tone, R304 signature, R305 examples, R173 letterhead preview, R306 public example pages) but has never had a dedicated end-to-end production audit; recent audits covered import, print, share, history, jobs, keyboard, paywall chains instead.
- Rezi ships cover letter / resignation letter as first-class AI writers with editing and export; parity here is core functional depth, not copy.

## Audit scope (production cv.zalize.com, zero real AI — mock all letter POSTs)
1. Cover letter: generate (mocked), review, edit, save to /documents; addressee + tone + details-to-highlight inputs flow into the request payload; R333 discard confirm.
2. Resignation letter: same chain incl. tone; signature image upload renders in letterhead preview.
3. /documents: list, letterhead preview fidelity, edit/update, delete (+R320 undo bar), type filter in URL (R326), import existing letter (R248).
4. Exports of a letter (TXT/other paths that exist) — filename, content fidelity, marks if supported.
5. Examples: role-specific letter examples (R305) load and seed the tool; public example pages (R306) render, dark mode, canonical.
6. Cross-cutting: 375 strict overflow, dark mode, keyboard focus return on dialogs, zero console errors, baseline restore.

## Disposition
- P0/P1/P2: fix this round. P3: fix if focused, else log for next round.
- Docs-only PR if zero findings.
