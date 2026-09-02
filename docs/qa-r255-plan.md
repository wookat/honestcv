# R255 QA plan — "Draft follow-up email" for quiet applications

Code evidence: src/lib/jobs.ts:74–101 `followUpEmail(entry, senderName?)` (days = staleDays ?? 0; interviewing vs applied subject/opener; body paragraphs joined with \n, sign-off `senderName?.trim() || '[Your name]'`); src/pages/Jobs.tsx:1206–1229 stale row is now a flex div with amber "No update in N days — consider following up." + button "Draft follow-up email" (only when staleDays !== null), onClick seeds dialog from `followUpEmail(entry, loadResume()?.contact.fullName)`; :1359–1418 Dialog "Follow-up email" with editable `#follow-up-subject` Input, `#follow-up-body` textarea, Close, "Copy email" → clipboard `Subject: <subject>\n\n<body>`, label flips to "Copied". Bundles: index-CbcKrvXw.js / Jobs-DD20Dz9D.js.

Method: production CDP (suppress_origin, /home/ubuntu/audit-r1/cdp.py); regenerate R253 fixture (f2 applied 7d "Data Engineer @ Globex", f3 interviewing 8d "Platform Engineer @ Initech", f1 6d fresh, f4/f5/f6 saved/offer/rejected); seed honestcv.resume with contact.fullName "Ada Lovelace QA"; tsx oracle computes followUpEmail(f2/f3, name) byte-exact. Clipboard via Browser.grantPermissions(['clipboardReadWrite','clipboardSanitizedWrite']) then navigator.clipboard.readText(). Zero /api/ai/* counter throughout. Screenshots r255_*.

## E0 Bundles
index-CbcKrvXw.js entry; Jobs-DD20Dz9D.js chunk on /jobs.

## E1 Applied + interviewing drafts byte-exact
Open f2 detail → row shows amber msg + "Draft follow-up email" button; click → dialog "Follow-up email"; #follow-up-subject.value === oracle subject `Following up on my Data Engineer application at Globex`; #follow-up-body.value === oracle body (7 days opener, "Hi Globex hiring team,", sign-off "Ada Lovelace QA"). Close, open f3 (interviewing) → subject `Following up on my Platform Engineer interview at Initech`, opener "It has been 8 days since we last spoke…". Screenshots.

## E2 No resume → placeholder sign-off
Remove honestcv.resume, reload, open f2 dialog → body ends "Best regards,\n[Your name]". Screenshot.

## E3 Button absence
f1 (applied 6d) detail: no stale row, no button. f4 saved (10d) detail: no button. (offer/rejected same code path — spot-check f5.)

## E4 Copy email incl. manual edit
Grant clipboard perms; in f2 dialog append " — EDITED" to subject via the input and add a line to the body; click "Copy email" → button label flips to "Copied"; navigator.clipboard.readText() === `Subject: <edited subject>\n\n<edited body>` byte-exact. Screenshot.

## E5 Regression
R254: /jobs?attention=1 → Tracked + chip "Needs follow-up (2)", filtered rows [Data Engineer, Platform Engineer]. R253: /dashboard sidebar badge "2" + muted "6". Detail notes textarea + status dropdown + Select… bulk still present on Tracked. Screenshot.

## E6 375px dialog
375×812: open f2 dialog → page scrollWidth === 375; subject/body/Copy visible. Screenshot.

## E7 Light+dark contrast + zero AI + cleanup
Rendered-pixel contrast (4× crop, 2/98 pct) of the "Draft follow-up email" button text and the dialog "Copy email" primary button in light AND dark, ≥4.5:1. __aiReqs [] throughout. Remove honestcv.jobPipeline/resume/theme; final localStorage exactly ["honestcv.clientId","honestcv.qa"]; light theme. Results appended below.

## Results (production, CDP; recording down since R166)
- E0 PASS — entry index-CbcKrvXw.js; /jobs chunk Jobs-DD20Dz9D.js.
- E1 PASS — f2 (applied 7d, Data Engineer @ Globex): stale row "No update in 7 days — consider following up." + "Draft follow-up email" button; dialog "Follow-up email" subject AND body byte-exact vs tsx `followUpEmail` oracle (7-days applied opener, "Hi Globex hiring team,", sign-off "Ada Lovelace QA"). f3 (interviewing 8d, Platform Engineer @ Initech): subject "…interview at Initech", opener "It has been 8 days since we last spoke…", byte-exact. r255_e1_applied_dialog.png / r255_e1_interviewing_dialog.png
- E2 PASS — resume removed → body byte-exact vs anon oracle, ends "Best regards,\n[Your name]". r255_e2_placeholder.png
- E3 PASS — button and stale row absent on Backend Engineer (applied 6d), SRE (saved), ML Engineer (offer). r255_e3_nobutton.png
- E4 PASS — edited subject (+" — EDITED") and body (+"P.S. Edited line.") in the dialog; "Copy email" → label flipped to "Copied"; navigator.clipboard.readText() byte-exact === `Subject: <edited subject>\n\n<edited body>` (via Browser.grantPermissions clipboardReadWrite + Page.bringToFront — readText hangs without focus). r255_e4_copied.png
- E5 PASS (regression) — R254: /jobs?attention=1 → chip "Needs follow-up (2)" pressed, filtered rows [Data Engineer, Platform Engineer]. R253: sidebar badge "2" + muted total "6". Detail: #job-notes textarea, 6 row status selects, Select… bulk button, 2-step timeline all present. r255_e5_r254.png / r255_e5_navbadge.png
- E6 PASS — 375×812 dialog open: scrollWidth === 375; subject/body/Copy email all visible within viewport. r255_375_dialog.png
- E7 PASS — rendered-pixel contrast: light "Draft follow-up email" 17.96:1, light "Copy email" 6.0:1; dark 14.06:1 / 6.77:1 — all ≥4.5. __aiReqs [] throughout (quota baseline only); final localStorage exactly ["honestcv.clientId","honestcv.qa"]; light theme. r255_light_dialog.png / r255_dark_dialog.png + crops; r255_cleanup_final.png
