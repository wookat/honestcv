# R55 — Drag & drop + explainer content on the ATS checker page

## Evidence (first-hand, 2026-08-29, ~/audit-r1/shots-r55/)

- Rezi's checker landing (`rezi.ai/tools/resume-checker`, `rezi-resume-checker-full.png`):
  the hero card is a drag-and-drop zone ("Drag your file here, or browse"), followed by a
  "Step by step walkthrough" (Upload → Analysis → Review) and a "Your questions, answered"
  FAQ accordion. The page educates before and after the tool.
- RezUp `/ats-checker` (`rezup-ats-checker-full.png`): the tool itself is deeper than
  Rezi's free tier (inline JD highlighting, keyword frequency table, format checks), but
  the page ends right below the button — no drag & drop (the small "Upload PDF / DOCX"
  button opens a file picker only) and zero explainer/FAQ content for users who land here
  cold. The landing page hero got a drop zone in R22; the checker page itself never did.

## Classification

Landing/content + workspace polish, P2. The checker is our top-of-funnel free tool; Rezi
treats its equivalent as a full landing page.

## Plan (small, honest batch — `src/pages/AtsChecker.tsx` only)

1. Drag & drop: make the resume input column accept file drops (same handler as the
   existing upload button; reuses `extractTextFromFile`, R22 pattern — dragOver highlight,
   inline error on unreadable files, nothing leaves the browser).
2. "How it works" strip below the tool: 3 honest steps (Paste or drop → Instant score in
   your browser → Fix gaps in the builder).
3. FAQ section below that: 4 `<details>` items answering the questions we can answer
   truthfully (Is it really free? / Is my resume uploaded? No — in-browser only / How is
   the score computed? 70% keywords + 30% structure, rule-based / Can a score guarantee
   interviews? No — honest limits).

## Deliberately NOT copied

- Rezi's "Browse our latest arrivals" template carousel and examples grid on the checker
  page (we link templates/examples in nav+footer; duplicating hub content here bloats the page).
- Fake review quotes/star ratings.

## Validation

lint + tsc + build, deploy, production QA at 1440/375: drop a real PDF onto the zone →
text fills + score; FAQ toggles; no overflow; console clean.
