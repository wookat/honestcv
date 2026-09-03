# R301 exploratory production audit + fix

Audit bundle: index-CAfEAaLA.js; fix verified on index-BR2mQy8q.js (both curl-verified).
Zero real AI calls; localStorage/theme baseline restored; recording unavailable (enigo),
CDP screenshots under /home/ubuntu/screenshots/r301*.png.

Audit coverage (all passed unless noted):
- Route seams /dashboard↔/documents↔/samples incl. browser Back; letterhead preview with
  and without a draft.
- Jobs closure: track → cover letter (local template, mocked AI) → saved doc on /documents
  → status Interviewing → interview prep carries the target job.
- Imports: R297 marker-less DOCX regression (2 experiences, 2+2 bullets); R299 LinkedIn
  dialog; empty-file error copy. Scan-only PDF path untested (no fixture).
- Share chain: custom slug create → read-only /s/ page → revoke via access select →
  "no longer available"; honestcv.shared preserved.
- Strict scrollWidth at 375 and 768 on /documents /samples /jobs /builder; dark mode.

Confirmed P3: at <md the hamburger menu had no Career documents / Sample library entries
(WorkspaceNav is hidden md:block) — new first-class routes unreachable on mobile.

Fix (R301b, Layout.tsx only): two menu links added between My resumes and AI assistant.
Re-verified live: entries present on /dashboard and /documents, navigation + menu close,
menu-open scrollWidth=375, dark menu legible, no hamburger at 768/1024.
