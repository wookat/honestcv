# R296 QA — final-check dialog acknowledgment dedup (production)

Round: R296 · Date: 2026-09-02 · Target: https://cv.zalize.com
Bundles confirmed in page resource entries: `index-D1l3dA7t.js` / `Builder-B83Czf_L.js`.
Method: CDP (port 29229) real UI clicks; Fetch armed on `*api/ai/*` all session — only
page-load quota GETs paused, each fulfilled pre-network with `{"freeRemaining":42}`;
**zero** other `/api/ai/*` requests fired (expected: this round uses no AI). Downloads to
`/home/ubuntu/qa/r296_dl` with real file/mtime verification. `honestcv.shared` present
(free-download gate skipped) except during the deliberate share-popup regression.
Recording unavailable (enigo down, known) — CDP screenshots.

## Change under test

Builder.tsx: `finalCheckAcked` ref stores `finalCheckIssues.join('\n')` when the user
clicks "Download anyway"; `download()` re-shows the dialog only if issues exist AND the
signature differs from the acknowledged one. "Keep editing" does not acknowledge.
Session-only (reload resets). Plan: docs/plan-r296-final-check-acknowledge.md.

## Results — all six requested flows passed

1. **First download shows dialog; Download anyway downloads** — PASS.
   Fixture with `[add %]` placeholder (plus ATS-check issues: contact/bullet-count/word-count
   with the tiny fixture — all listed). TXT → "Final check before download" dialog listing
   issues incl. "1 bracket placeholder…" → "Download anyway" → dialog closed,
   `qa-r296-platform-engineer-resume.txt` landed.
   Screenshots: r296_f1_dialog.png · r296_f1_downloaded.png
2. **Same signature skips dialog** — PASS. Immediate MD → no dialog, .md landed directly;
   repeat TXT → no dialog, file re-downloaded (mtime advanced, overwrote same name).
   Screenshot: r296_f2_md_nodialog.png
3. **Changed signature re-shows; Keep editing doesn't ack** — PASS. Appended `[add note]`
   to a bullet via real keyboard input → TXT → dialog reappeared, now listing
   "**2** bracket placeholders like [add %]…" (new list) → "Keep editing" → dialog closed,
   **0 new files** → TXT again → dialog shown again.
   Screenshots: r296_f3_new_dialog.png · r296_f3_keep_editing.png · r296_f3_dialog_again.png
4. **Re-ack skips; clean resume downloads with no dialog** — PASS. "Download anyway" →
   file landed; MD → no dialog (r296_f4_md_nodialog.png). Then a fully clean fixture
   (all ATS checks green — see harness notes) → TXT → no dialog, direct download.
   Screenshot: r296_f6_clean_direct.png
5. **Reload resets acknowledgment** — PASS. After ack, reload with the same problematic
   resume → TXT → dialog reappeared. Screenshot: r296_f5_reload_dialog.png
6. **Regression** — PASS.
   - Clean resume: zero dialogs (flow 4).
   - 375×812 (emulated before nav): strict `scrollWidth = 375 = innerWidth` before and
     with the dialog open; dialog usable via the mobile "Download your resume" menu
     (r296_375_dialog.png). Desktop 1600px: scrollWidth 1600, no overflow.
   - Share popup: with `honestcv.shared` removed (subscribed kept, so no email gate),
     TXT download → post-download "Resume downloaded — good luck out there" share dialog
     opened and `honestcv.shared` was set to `1` — unchanged behavior
     (r296_share_dialog.png).

## Defects

- P0–P2: none.
- P3: none confirmed this round.
- Subjective (not defects): constructing a resume that passes *all* final checks is hard —
  word-count (≥400) and 1-page checks pull in opposite directions until Auto-fit is used;
  this is pre-existing check design, not an R296 regression.

## Harness notes (not product bugs)

- `resume.skills` is a **string** (newline-joined; "Label: items" lines satisfy the
  "Skills grouped into categories" check when ≥8 comma-split items) — an array fixture is
  coerced and fails the check.
- Clean-resume fixture needed: complete contact incl. phone, terminal periods on every
  bullet ("Punctuated bullet points" check), `location` on involvement/education entries,
  categorized skills, ≥400 words, then Auto-fit ("Fits 1 page — set extra small text,
  normal spacing") to satisfy the page-count check.
- Radix dialogs are `position: fixed` → `offsetParent` is null; don't filter dialog
  queries by `offsetParent` (caused two false "no share dialog" reads before correction).
- At 375px the format buttons live behind the header "Download your resume" button
  (aria-label), which opens a menu with PDF/DOCX/TXT/MD.

## Safety / cleanup

- Zero real `/api/ai/*` requests; only quota GETs, all fulfilled pre-network with mocks.
- Final localStorage exactly `["honestcv.shared","honestcv.subscribed"]`; empty html class.
  (r296_cleanup_final.png)
- Backup: /home/ubuntu/qa/r296_ls_backup.json · Downloads: /home/ubuntu/qa/r296_dl/
- Screenshots: /home/ubuntu/screenshots/r296_*.png
