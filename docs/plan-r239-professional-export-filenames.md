# R239 — Professional export filenames across the export chain

## Rezi first-party evidence

Rezi Download guide (rezi.ai/rezi-docs/download-resume, "3. Check and save your file"):

> "When saving your file, use a clear and professional filename. … For example: FirstName_LastName_Resume.pdf, FirstName_LastName_Marketing_Manager_Resume.pdf. Including the job title can be especially helpful when you're applying for a specific role."

## Gap in HonestCV

- Resume exports (Builder + Dashboard) produce `jane-doe-resume.pdf` — the target role is never included even when set, despite the guide calling the job-title form "especially helpful".
- Career-document exports are fully generic: `cover-letter.pdf`, `resignation-letter.pdf`, `interview-prep.pdf` — no candidate name, no company. Our own R215 uploaded-file check would flag documents like these for missing the person's name.
- Empty full name yields the degenerate `resume-resume.pdf`.

## Design

New shared helper in `src/lib/download.ts`:

```ts
professionalFileName(parts: (string | undefined | null)[], ext: string): string
// each part: trim → lowercase → non-alphanumerics collapse to '-'; blank parts dropped; joined with '-'
```

Call sites (behavior when the extra fields are blank stays equivalent to today):

- Builder + Dashboard resume export (pdf/docx/md/txt): `[fullName, targetRole, 'resume']` → `jane-doe-product-manager-resume.pdf`; no role → `jane-doe-resume.pdf`; nothing → `resume.pdf` (fixes `resume-resume.*`).
- Cover letter (pdf/docx): `[fullName, company, 'cover-letter']`.
- Resignation letter: `[fullName, 'resignation-letter']`.
- Interview prep: `[fullName, 'interview-prep']`.

Zero schema/scoring/AI/network changes; letter content and export rendering untouched.

## Validation

1. Resume export with name+role → `first-last-role-resume.<ext>` for all four formats.
2. Role blank → `first-last-resume.<ext>` (unchanged from today).
3. Name+role blank → `resume.<ext>`.
4. Punctuation/multi-space role ("Sr. Product Manager / Growth") slugs safely.
5. Cover letter with company → `first-last-<company>-cover-letter.pdf/docx`; blank company → `first-last-cover-letter.*`.
6. Resignation/interview names carry fullName.
7. Uploaded-file professional-name check (R215) passes on our own exports.
8. Exported file contents unchanged (same bytes as before, name aside).
9. Dashboard export path matches Builder.
10. No regression to download gating (final check dialog, share nudge).
