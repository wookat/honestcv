# QA — R295 exploratory production audit (cv.zalize.com, bundle index-DcdNsNPm.js / Builder-B7PQbTUH.js)

No code delta: adversarial free-form sweep, boss's 5 focus areas. Findings graded P0–P3,
each with repro + screenshot + console/DOM/payload clue; separate 确证 vs 疑似.

Method: CDP 29229, Fetch armed on *api/ai/* all session; mock /api/ai/quota →
{"freeRemaining":42} at every load; all AI POSTs fulfilled with fakes pre-network.
Backup localStorage first; restore at end (preserve subscribed/shared, remove round keys).
Content-heavy fixture: marks in summary/bullets, CJK name, dates, custom section, hidden
entry, 2 experience + project + involvement + education + skills.

## E1 Editor depth (Builder.tsx 387–489, 1800–1812, 2145)
- Add/delete entry: add experience → new card; delete → gone from editor+preview+storage.
- Collapse/expand entry cards (chevron): state toggles, no data loss.
- Drag reorder: real CDP mouse drag on grip handle (mousePressed→moves→Released with
  dragover); entry order changes in editor, preview, resume.experience order. Judge by
  intermediate screenshot during drag + final order. If HTML5 DnD not triggerable via CDP
  Input, disclose as untestable-by-harness (not a product bug) and use Move buttons if any.
- Undo/redo: type into a bullet, header Undo button reverts text (canUndo enabled), Redo
  restores; Ctrl+Z in page (not in a focused textarea? test both) — assert resume state.
- Date fields: set start/end (check input type), ongoing "Present" behavior.
- Inline preview: contentEditable edit commits; Ctrl+B in preview selection wraps marks or
  applies bold; Ctrl+B/I/U/K in textarea wraps **/*/__/[](url).
- Hidden entry: hide toggle → absent in preview; custom section add/rename/delete.
## E2 AI chain UI (all mocked)
- Suggest / key-numbers / Complete line (needs unfinished line) / AI rewrite bullets /
  Fix line N with AI (score panel, 8632) / keyword-bullet dialog / summary variant picker
  Regenerate+Adjust / assistant quick task. Each: correct endpoint+payload shape, dialog
  renders, apply mutates the right entry, no console errors.
## E3 Scoring chain
- Target job panel: paste JD, match %, triage card; score breakdown dialog: priority list,
  Fix→ jump scrolls; Fixed chips after applying a fix; /ats-checker: paste resume text +
  JD → rule-based report renders; upload path with a .json resume file (IMPORT_ACCEPT).
## E4 Export chain
- With marks+CJK+dates+custom section+hidden entry+margins=narrow: download PDF/DOCX/TXT/MD;
  PDF: pdftotext no literal marks, hidden entry absent, dates present, min x0 ≈36pt
  (narrow); DOCX: pgMar 576/480, marks as runs; TXT strips marks; MD preserves.
## E5 Layout / dark
- 1280 and 375: documentElement.scrollWidth <= innerWidth on /builder, /dashboard,
  /ats-checker, /jobs; dark mode spot-check newer controls (Margins stepper, Complete
  button, score panel) computed colors + screenshots.
## Cleanup
Restore backed-up localStorage exactly (subscribed/shared preserved), empty html class,
all paused Fetch events resolved, zero real AI calls.

## R295 results (exploratory audit, bundle index-DcdNsNPm.js / Builder-B7PQbTUH.js)

Confirmed defects: **zero P0–P2**. One P3 candidate + subjective notes below.

### E1 Editor depth — all passed
- Add/delete experience entry (aria "Delete role N"); undo restored deleted entry; redo re-applied.
- Collapse/expand ("Collapse/Expand role N") toggles without data loss.
- Drag reorder: works via HTML5 DnD onto `[data-drag-card]` (synthetic DragEvent harness);
  native CDP mouse drag does not trigger HTML5 DnD — harness limitation, not a product bug.
- Dates: startDate/endDate persist; empty endDate renders "Present".
- Marks shortcuts Ctrl+B/I/U/K wrap **/*/__/[](url) in textareas; preview contentEditable
  Ctrl+B produced <b> serialized back to `**…**`; inline name edit commits to storage.
- Hidden entry ("Hide role N from resume") absent from preview; custom section add/rename/
  delete + undo/redo OK (schema: customSections[].bullets).

### E2 AI chain (all mocked pre-network; /api/ai/quota → freeRemaining:42) — all passed
- Suggest / key-numbers / Complete line (R294 regression) payloads correct; no draft key leak.
- AI rewrite bullets → /api/ai/rewrite {kind,text,variants,role,jobDescription}; variant
  picker renders Concise/Impact-focused; apply + Regenerate OK.
- Summary "Draft from my resume" → setup dialog → /api/ai/summary-draft {resumeText,role};
  3-variant picker; **Adjust role & skills** returns to setup dialog. Passed.
- Per-line Fix, keyword-bullet dialog (two-step: Yes—draft a bullet → Draft the bullet →
  /api/ai/keyword-bullet → Add bullet) passed.
- Assistant: quick task "Improve my ATS score" is local (no AI call, by design). Direct chat
  POST /api/ai/assistant {turns,resumeText,jobDescription,role,scoreSummary}; response shape
  is {text,action,freeRemaining} (NOT reply) — with correct mock the reply renders and
  persists to honestcv.assistantChat. Passed.

### E3 Scoring — passed
- JD paste → match %; inline "See full score breakdown" expands (not a dialog); health
  report opens dialog; Fix→ jump scrolls; keyword-bullet Fixed chip appears.
- /ats-checker: paste resume TXT + JD → real report (74, missing keywords aws/python/
  optimization — correct); upload accepts .pdf/.docx/.txt (NOT .json as plan assumed);
  uploading our exported PDF extracted text into the textarea correctly.

### E4 Exports (narrow margins, marks, CJK, hidden entry, custom section) — passed
- PDF: no literal marks; hidden entry absent; all dates + Present present; Patents custom
  section present; min glyph x0 = 36.0pt (narrow) exact.
- DOCX: pgMar 576/576/480/480; 16 bold runs, no literal ** in w:t; hidden absent; PATENTS present.
- TXT strips marks, keeps PATENTS; MD preserves **marks** and ## Patents; hidden absent in all.
- Note: download gated by "Final check before download" dialog (Keep editing / Download anyway)
  when priority fixes exist — intentional UX, disclosed for harness scripts.

### E5 Layout / dark — passed
- scrollWidth<=innerWidth at 1280 and 375 on /builder /dashboard /ats-checker /jobs (all 1265/375).
- Dark: Margins label oklch(0.68 .02 260) on bg oklch(0.16 .015 260); aiButtons 0.93 fg — legible.

### P3 candidate (确证, cosmetic)
- P3: sending a chat message to the assistant while the mocked backend returns a WRONG shape
  ({"reply":…} instead of {"text":…}) silently drops the turn — no error toast, user message
  disappears from the persisted transcript on reload. Repro: fulfill /api/ai/assistant with
  {"reply":"x"} → nothing renders, no console error surfaced to user. Suggest: surface a
  "Something went wrong" turn when the response lacks text. (Low real-world impact; server
  presumably always returns text.)

### 疑似/主观 suggestions
- ATS "See an example score first" report is visually identical to a real report; a persistent
  "Example" badge could prevent confusion (an automation script confused them; a user might too).
- Export final-check dialog appears on every download when fixes remain; a "don't ask again
  this session" option might reduce friction.

### Cleanup
- Theme back to System (empty html class); localStorage exactly
  ["honestcv.shared","honestcv.subscribed"]; all paused Fetch events fulfilled; zero real AI calls.

## R295b re-verification (bundle index-CImNVrzq.js / AtsChecker-CwcffMrs.js)

### F1 assistant malformed-reply error — passed
- {"reply":"hi"} (no text) → inline error "The assistant sent back an empty reply — please
  try again."; no empty assistant turn; user message kept in UI; after reload the user
  message persists in honestcv.assistantChat; resend works.
- {"text":"","action":null,"freeRemaining":41} → same error (empty-string path).
- Regression {"text":"Real reply [MOCKOK].","freeRemaining":41} → renders; quota banner
  "41 free AI rewrites left"; stored transcript has 0 empty assistant turns.

### F2 ATS example badge — passed on desktop; **FAILED at 375px**
- Route note: fix lives at /ats-checker (the React AtsChecker.tsx page);
  /free-ats-resume-checker is a separate static SEO page without the change.
- Example click → title "Example ATS match score" + secondary badge "Example report —
  paste your own resume above to check yours". Edit 1 char + Check → badge gone, title
  "Your ATS match score". Own resume + JD → real report, no badge. All passed.
- **P3 (确证): at 375px the badge itself overflows** — Badge base class has
  `whitespace-nowrap` so the span renders 400px wide; scrollWidth becomes 525 > 375 and
  mobile viewport zooms out (innerWidth expands to 525). Repro: 375×812 emulation,
  /ats-checker, click "See an example score first". Clue: computed white-space:nowrap on
  the badge span; suggest `whitespace-normal max-w-full text-left` on this Badge instance
  (AtsChecker.tsx ~312) or a shorter label. Screenshot: r295b_f2_375_overflow.png.

### Quick tasks regression — passed
- Improve my ATS score / Target my job / Find matching jobs: all replied locally,
  zero /api/ai/* requests paused (turn counts 4→6→8→10).

### Cleanup
- localStorage exactly ["honestcv.shared","honestcv.subscribed"]; empty html class;
  all paused requests fulfilled; zero real AI calls.

## R295c re-verification (bundle index-u06quAF5.js / AtsChecker-Bf33ZYFu.js)

P3 badge-overflow fix verified on production /ats-checker:
- 375×812 example report: badge span computed white-space:normal, 209×54px (wrapped to
  multiple lines; R295b was 400×22 nowrap); strict scrollWidth = 375 = innerWidth (no
  mobile zoom-out). Screenshot: r295c_375_badge_wrapped.png.
- Desktop 1600px regression: title "Example ATS match score", badge single line 400×22
  with Target icon (12px, shrink-0), text intact; scrollWidth 1585 ≤ 1600.
  Screenshot: r295c_desktop_badge.png.
- Zero real AI calls (quota mocked); baseline restored ["honestcv.shared",
  "honestcv.subscribed"], empty html class.
