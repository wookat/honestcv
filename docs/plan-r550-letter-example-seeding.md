# R550 — Letter examples seed known facts from the resume

## Production evidence (first-hand, CDP on cv.zalize.com)
- Draft resume has `targetRole: "Software Engineer"`, `targetCompany: "Acme"`, a job description, and a filled contact name.
- /documents → "Software Engineer · Cover letter" example → preview and "Use this example" both keep every placeholder verbatim: `[Company]`, `[Current company]`, `[Your name]` — even though the workspace already knows all three.
- The Builder tool templates (R506) already seed these same slots (`company || currentJob?.company || '[Company]'`, `resume.contact.fullName || '[Your name]'`), so the letter-example path is behind the product's own established standard.

## Rezi comparison
Rezi's cover-letter generation is job-aware — letters are created against the selected job (role + company). Handing the user a letter that asks them to re-type facts the app already stores is below both Rezi and our own Builder-template behavior.

## Root cause
`Dashboard.tsx` letter-example preview + "Use this example" save `e.text` verbatim; `letterExamples.ts` has no seeding helper.

## Fix (smallest valuable)
New `seedLetterExample(text, kind, resume)` in `src/lib/letterExamples.ts`:
- Common: `[Your name]` → `contact.fullName`.
- Cover: `[Company]`/`[Facility]` → `targetCompany`; `[Current company]`/`[Current facility]` → first non-hidden ongoing experience entry's company.
- Resignation: `[Job title]` → ongoing entry's role; `[Company]` → ongoing entry's company.
- A slot is only replaced when the resume value is non-empty; otherwise the placeholder stays, so the R505 placeholder counter remains honest.

Apply in both the preview dialog (`LetterPreview` text) and the "Use this example" save, so what the user previews is what gets saved.

## Non-goals
- No date seeding (`[date, two weeks from today]` stays a placeholder — user-specific).
- No changes to Builder tool templates, AI generation, SEO static pages, or the placeholder counter/locator.

## Validation
- tsc -b, eslint changed files, npm run build, npm run verify-dist.
- Deploy attempt (known Workers Routes auth code 10000 limitation).
- Production QA at 375×812 and 1280×900: with target job set, preview + saved doc show seeded name/company; with an empty draft, placeholders remain; placeholder counter reflects the reduced count; zero overflow, zero console errors; storage back to baseline.
