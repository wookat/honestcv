# R248 — Import an existing cover letter into Career documents

## Rezi first-party evidence

Rezi's AI Cover Letter Generator guide (rezi.ai/ai-cover-letter-generator + help docs):

> "If you already have a cover letter you're happy with, you can easily upload it …
> keeping your cover letters organized alongside your resumes in one dashboard."

Rezi treats the cover letter dashboard as the home for *all* of a user's letters —
generated or pre-existing.

## HonestCV today (verified in code)

- Career documents on the dashboard (`src/pages/Dashboard.tsx` "Career documents"
  section) only lists docs saved from the Builder AI tools; the empty state says
  "generate … in the editor and hit Save to My resumes".
- There is no way to bring an existing cover letter (PDF/DOCX/TXT) into the app.
  Resumes have a full import path (`extractTextFromFile` from `src/lib/extractFile.ts`,
  used by the resume drop zone), but documents don't.
- `saveCareerDoc(kind, title, text)` (`src/lib/documents.ts`) already persists docs
  to `honestcv.careerDocs`; the doc dialog already supports edit/preview and both
  PDF/DOCX downloads with R239 professional filenames.

Gap: a user who already has a cover letter must retype/paste it through the Builder
tool; nothing organizes existing letters alongside resumes.

## Design (client-only, additive)

In the Career documents action row (next to "New cover letter" etc.) add an
"Import a cover letter" button wired to a hidden `<input type="file" accept={IMPORT_ACCEPT}>`:

1. Reuse `extractTextFromFile(file)` (browser-only PDF/DOCX/TXT extraction).
2. Guard: `text.trim().length < 30` → "No text found in this file — it may be a
   scanned image." Unsupported type / parse failure → surfaced error message
   (same pattern as the resume import).
3. Title from the file name base: strip extension, replace `[-_]+` with spaces,
   collapse whitespace; fallback `Imported cover letter`.
4. `saveCareerDoc('cover', title, text)` → prepend to list, then open the existing
   doc dialog in edit view so the user can review immediately.
5. Busy state disables the button ("Reading your letter…").

Zero worker/schema/scoring/AI changes; `CareerDoc` shape unchanged. The imported
doc gets everything existing docs get for free: type filter chip counts, edit +
letterhead preview, PDF/DOCX export with professional filenames, delete confirm.

## Validation plan

- Import a real TXT/PDF/DOCX cover letter → doc appears at top of list as
  "Cover letter", dialog opens with full text; text round-trips byte-exact for TXT.
- Filter chips: "Cover letters" count increments; filter shows the imported doc.
- Downloads: PDF/DOCX use R239 professional filename with the letterhead name.
- Errors: unsupported extension, <30-char file, scanned-image PDF.
- Persistence: reload keeps the doc; delete removes it.
- Regressions: resume import drop zone, New cover letter link, R246 highlights flow.
- 375px layout, dark-mode contrast, zero /api/ai/* calls, exact localStorage cleanup.
