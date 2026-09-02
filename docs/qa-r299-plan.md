# QA R299 — Dashboard LinkedIn import entry point (production cv.zalize.com, bundle index-C-5dqHb3.js)

Method: CDP-driven real UI on production /dashboard (port 29229); live bundle verified via curl and
resource entries (`index-C-5dqHb3.js`). Fetch armed `*api/ai/*` all session — only page-load quota
GETs occurred, each mock-fulfilled `{"freeRemaining":42}` pre-network; zero real AI. A draft was
seeded in `honestcv.resume` so the confirm-dialog path runs. File injection via
`DOM.setFileInputFiles` on the hidden import input (the "Choose the LinkedIn PDF" button closes
the dialog and clicks that same input — verified). No recording (enigo down) — screenshots
`/home/ubuntu/screenshots/r299_*.png`.

Fixtures: `/home/ubuntu/qa/r299/linkedin_export.txt` (LinkedIn Save-to-PDF layout: name/headline/
location, Contact sidebar with `jdoe (LinkedIn)`, Top Skills, Summary, 2 experiences, education,
"Page 1 of 1"), `/home/ubuntu/qa/r299/plain_resume.txt` (no LinkedIn markers).

Results (all PASS):
- T1 entry + dialog + Cancel: button "No resume yet? Import your LinkedIn profile →" visible under
  the import tile; dialog title "Import your LinkedIn profile", description contains "nothing is
  uploaded anywhere", exactly 3 ol steps (More/Resources → Save to PDF; pick PDF; review), footer
  Cancel + "Choose the LinkedIn PDF"; Cancel closes. (r299_t1_entry.png, r299_t1_dialog.png)
- T2 LinkedIn pipeline: "Choose the LinkedIn PDF" closes the dialog and triggers the hidden file
  input; injected LinkedIn TXT → confirm dialog shows "This file was recognized as a LinkedIn
  profile export and mapped section-by-section…" → "Open and replace draft" → Builder at /builder
  with fullName "Jane Doe", title "Platform Engineer", location Austin TX, email, linkedin
  "linkedin.com/in/jdoe" (built from the handle line), 2 experiences with correct
  company/role/dates/bullets, skills "React, TypeScript, Kubernetes", education UT Austin BS CS
  2013–2017, summary intact. (r299_t2_confirm_linkedin.png, r299_t2_builder.png)
- T3 regression: plain resume TXT through the same input → confirm dialog WITHOUT the LinkedIn
  sentence ("This replaces what's currently in the editor…"). (r299_t3_plain_confirm.png)
- T4 375×812: import tile + LinkedIn button strict scrollWidth = 375; dialog open strict
  scrollWidth = 375. (r299_t4_375_tile.png, r299_t4_375_dialog.png)
- T5 dark mode (1440): link button color oklch(0.68 0.16 265) on bg oklch(0.16 0.015 260); dialog
  bg 0.16 / title 0.93 — legible. Theme cycled back to System. (r299_t5_dark_tile.png,
  r299_t5_dark_dialog.png)

Harness note (not a product bug): first fixture attempt put the Contact sidebar before the name —
the unchanged LinkedIn parser takes the name from pre-heading header lines, so fullName came back
empty and the trailing name/headline lines were swallowed into skills. Real LinkedIn Save-to-PDF
text starts with name/headline/location, and with that layout mapping is fully correct.

Cleanup: localStorage restored (shared/subscribed kept; firstSeen auto-recreated on load), empty
html theme class, all paused quota requests fulfilled, zero real AI. (r299_cleanup_final.png)
