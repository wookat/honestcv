# R173 — Formatted letterhead preview for career documents

## Rezi evidence (first-hand, 2026-08-31)

- In the Rezi editor, cover letters are edited as a formatted document with the
  same design toolbar as the resume (font, size, accent color), not as raw text
  (`app.rezi.ai/dashboard/resume/<id>/finish-up` toolbar; cover-letter samples in
  the Sample Library render as letterhead documents).
- Audited and ruled out this round: AI Interview (20-min camera/mic workflow —
  too heavy for one round), Cover Letters creation on free plan (Pro-gated,
  payments deferred), profile picture (Pro-gated; we already ship avatars),
  job-search pipeline / paper size / text+accent color / divider / indent /
  PDF+DOCX import / experience level — all already covered by RezUp.

## Gap

RezUp career documents (cover letter / resignation letter / interview brief)
are edited in a raw monospace `<Textarea>` inside a dialog. The letterhead
PDF/DOCX export (name, contact line, accent rule, date) is invisible until the
user downloads — they export blind.

## Plan

Add an **Edit / Preview** toggle to the career-doc dialog on the dashboard:

- Preview renders a white "paper" sheet that mirrors `downloadLetterPdf`:
  bold sender name, soft contact line (email · phone · location · website),
  accent-colored horizontal rule, long-form date, body paragraphs split on
  blank lines. Font family follows the resume template's serif/sans flag and
  the rule uses `resolveTemplate(templateId, accentColor).accent` — same
  letterhead source as the downloads (`draft ?? emptyResume()`).
- Interview briefs export via `downloadTextPdf` (no letterhead), so their
  preview shows the bold title + paragraphs only.
- Preview reflects unsaved textarea edits live.
- Local-first, zero schema/server changes; downloads/copy/save unchanged.

## Acceptance

- Toggle is keyboard-accessible (`aria-pressed`), 40px touch targets on mobile.
- Preview letterhead matches the PDF: name, contact separators, accent rule
  color, date format, paragraph splitting.
- Cover/resignation show letterhead; interview brief shows title-only header.
- Editing in Edit tab then switching to Preview shows the edits.
- 1440px and 375px: no horizontal overflow inside the dialog.
- Existing download PDF/DOCX, copy text, save changes flows regress clean.
