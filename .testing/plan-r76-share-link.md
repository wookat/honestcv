# R76 — hosted read-only share links (bundle index-DdM53I8k.js + SharedResume-BC0pSKkt.js, production only)

Code evidence: src/pages/Builder.tsx L1171 ("Share link" toolbar button, Share2 icon), L3776+ (dialog: "Anyone with the link", select No access/Can view, readOnly URL input aria-label "Share link", Copy→"Copied!", "Publish latest version", snapshot note); src/lib/share.ts (localStorage honestcv.shareLink {id,token,url,sharedAt}; POST/DELETE/GET /api/share); src/pages/SharedResume.tsx (/s/:id — header "Shared resume — read-only snapshot", CTA "Build your own free resume", gone → "This link is no longer available"); worker/index.ts L1295+.

Setup done (unrecorded): backup → qa.r76.backup (9 keys, resume 1685B, no shareLink key). Footer quota baseline: "8 free AI rewrites left". Pre-noted: curl of /s/test123 shows cache-control: no-store but NO x-robots-tag — re-verify.

## T1 Mint link + Copy (desktop)
- /builder → toolbar "Share link" → dialog shows "Anyone with the link" + select at "No access".
- Select "Can view" → PASS: URL input appears matching ^https://cv.zalize.com/s/[A-Za-z0-9_-]{22}$; localStorage honestcv.shareLink has {id,token,url,sharedAt}; Copy click → button text "Copied!" and clipboard equals URL.

## T2 Fresh-context view
- Open URL in incognito window (Ctrl+Shift+N, no localStorage). PASS: header "Shared resume — read-only snapshot" + "Build your own free resume" button; ResumePreview shows same name/summary as builder preview (Jordan Reyes baseline); no inputs/editor on page; console/pageerror clean; GET /api/share/:id is the only share call.

## T3 Snapshot semantics + republish
- In builder, change Full name (e.g. "Jordan Reyes-QA"); reload incognito share URL → PASS still shows old "Jordan Reyes" (snapshot).
- Click "Publish latest version" → PASS same URL (id unchanged in storage), incognito reload now shows "Jordan Reyes-QA".

## T4 Persistence across builder reload
- F5 /builder → Share link dialog reopens showing select at "Can view" + same URL (state from honestcv.shareLink).

## T5 Revoke + re-share
- Select "No access" → PASS: URL row disappears; honestcv.shareLink removed; incognito reload of old URL → "This link is no longer available"; curl GET /api/share/<id> → 404 JSON.
- Select "Can view" again → PASS new URL (different id) renders in incognito.

## T6 375px dialog
- Held CDP 375px: open Share link dialog → PASS no horizontal overflow (scrollWidth=375); select + Copy + Publish buttons height ≥40px.

## T7 Hygiene + cleanup
- Header /s/<id> check: expect X-Robots-Tag: noindex + Cache-Control: no-store (report if missing).
- Zero quota consumption: footer "8 free AI rewrites left" unchanged; no non-quota /api/ai/* resources.
- Console/pageerror clean on builder instrumented reload.
- Revoke any live link, restore honestcv.* byte-for-byte from qa.r76.backup (verify diffs:[] extra:[] BEFORE deleting qa.*), remove qa.*, close incognito, desktop 1600, reload baseline.
