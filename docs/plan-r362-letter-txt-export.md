# R362: TXT download for career documents

## Evidence (firsthand)
- R353 career-documents chain audit recorded the observation: letters (cover /
  resignation) and interview prep briefs export as PDF and DOCX only, plus a
  clipboard "Copy text". The resume itself exports PDF / DOCX / TXT / Markdown
  (R239 professional filenames, `downloadText` already exists in
  `src/lib/download.ts`).
- Application portals and e-mail workflows commonly ask for a plain-text file;
  clipboard copy is not a durable artifact and is awkward on mobile.
- Rezi's editor offers text-format export of AI-written documents alongside PDF.

## Change (smallest evidence-backed)
- Builder tool dialog (`Builder.tsx`, results footer): add a `TXT` button next
  to PDF / DOCX using the existing `downloadText` + `docFileName('txt')`.
- Dashboard documents (`Dashboard.tsx` `docDownload`): extend the format union
  with `'txt'` and render the TXT button on document cards and in the viewer
  dialog footer.
- Content: for letters, the file is exactly the letter body (byte-equal to
  "Copy text"); for interview briefs, the title line + blank line + body
  (mirrors `downloadTextPdf` / `downloadTextDocx` which render the title).
- Filenames follow R239: `<name>-…-cover-letter.txt` etc.

## Non-goals
- No letterhead/contact header in the TXT (plain text is meant for pasting).
- No Markdown export for letters.
- No change to PDF/DOCX letter export or signature handling.

## Validation
- tsc / eslint (touched files) / build.
- Production QA: download TXT from all three surfaces × three kinds, byte
  compare with the on-screen text, filename check, regression of PDF/DOCX
  buttons, 375px light/dark, zero AI/share/payment.
