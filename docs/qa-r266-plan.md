# QA plan — R266 Dashboard LinkedIn import hint + LinkedIn-aware confirm dialog (production: cv.zalize.com)

Bundles: index-C-cQKKi8.js / Dashboard-CeRkJQ9R.js.

Code evidence: src/pages/Dashboard.tsx:840–846 import card `<p class="text-muted-foreground text-xs">` lines —
line 1 "Click or drop a PDF, DOCX or TXT here — read entirely in your browser." and NEW line 2
"No resume yet? On LinkedIn, use Profile → More → Save to PDF and import that file." (JSX wrap → assert
whitespace-normalized). :849–858 hidden `input[type=file]` is the nextElementSibling of the card button
(inside the same `div.flex.flex-col`) — set via CDP DOM.setFileInputFiles. :607–624 handleImportFile:
<30 chars → error "No text found in this file — it may be a scanned image."; draft present →
`setImportedLinkedIn(looksLikeLinkedInExport(text))` + confirm dialog; no draft → openImported (straight
to /builder). :1533–1562 dialog "Open the imported resume?"; description = optional prefix
"This file was recognized as a LinkedIn profile export and mapped section-by-section — review the result
before sending it anywhere. " + "This replaces what's currently in the editor. Save the current draft as
a copy first if you want to keep it."; buttons "Save draft as copy, then open" (draft only) and
"Open and replace draft". importText.ts:54–61 markers: `^\S+ \(LinkedIn\)$`, `^top skills$`, or
linkedin URL + `^page N of M$` line.

Fixtures (write to /home/ubuntu/qa/fixtures/): linkedin.txt (Jane Doe block with www.linkedin.com/in/janedoe,
Top Skills React/TypeScript/Node.js, Experience Acme Senior Engineer, Page 1 of 1), plain.txt (ordinary
resume text, no LinkedIn markers, name John Smith), tiny.txt (<30 chars).

## Checks (zero-AI round; instrument fetch; only quota GET allowed)

- M0 HTTP 200 for both bundles + present in Dashboard resource entries; HTML references index-C-cQKKi8.js.
- M1 Import card shows BOTH subtitle lines byte-exact (normalized) at 1600×900; screenshot.
- M2 Draft seeded (honestcv.resume with content) → set linkedin.txt on the import input →
  dialog "Open the imported resume?" with description EXACTLY prefix+base (normalized byte-exact);
  click "Open and replace draft" → lands on /builder, resume fullName === "Jane Doe", skills include "React".
- M3 Re-seed draft → plain.txt → dialog description EXACTLY the base text with NO prefix.
  (Close dialog without importing, or import and discard.)
- M4 No draft (remove honestcv.resume) → linkedin.txt → NO dialog, navigates to /builder immediately,
  resume populated (Jane Doe).
- M5 tiny.txt (with draft state irrelevant) → inline error text exactly
  "No text found in this file — it may be a scanned image."; no dialog, no navigation.
- M6 375×812 Dashboard: scrollWidth === 375 with both card lines visible; screenshot.
- M7 New line rendered-pixel contrast light + dark ≥4.5:1 (text-muted-foreground text-xs).
- M8 __aiReqs stays [] throughout; cleanup localStorage to exactly ["honestcv.clientId","honestcv.qa"],
  light theme; remove fixture files' temp state (fixtures may stay under /home/ubuntu/qa).

## Results (appended after production run)

## Results (production run, 2025-09-02)

Fixtures: /home/ubuntu/qa/fixtures/{linkedin,plain,tiny}.txt; both parse expectations pre-verified with a
temporary tsx oracle over src/lib/importText.ts (linkedin=true "Jane Doe" skills "React, TypeScript, Node.js";
plain=false "John Smith"); oracle deleted after run.

- M0 both bundles HTTP 200, in Dashboard resource entries, HTML references index-C-cQKKi8.js — PASS
- M1 import card shows both subtitle lines byte-exact (normalized) at 1600×900 — PASS
- M2 draft + linkedin.txt: dialog "Open the imported resume?" description EXACTLY prefix+base;
  "Open and replace draft" → /builder, fullName "Jane Doe", skills "React, TypeScript, Node.js" — PASS
  (note: first attempt used a seed without `experience: []`; loadResume() requires it, so no draft was
  detected and import correctly went straight to /builder — fixture error, not an app bug; reseeded properly)
- M3 draft + plain.txt: description EXACTLY base with no LinkedIn prefix; Escape closes; draft untouched — PASS
- M4 no draft + linkedin.txt: no dialog, straight to /builder, resume populated (Jane Doe) — PASS
- M5 tiny.txt (<30 chars): inline error byte-exact "No text found in this file — it may be a scanned image.",
  no dialog, stays on /dashboard — PASS
- M6 375×812: scrollWidth === 375, new line visible in viewport — PASS
- M7 new-line rendered-pixel contrast: light 5.53:1 / dark 6.31:1 — PASS
- M8 __aiReqs [] throughout (only baseline quota GET); localStorage restored to exactly
  ["honestcv.clientId","honestcv.qa"]; light theme — PASS
