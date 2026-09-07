# R504 — warn before exporting a letter that still contains [placeholders]

## Production evidence (first-party, cv.zalize.com, 2026-08-31)

- /documents → "Software Engineer · Cover letter" example → "Use this example"
  saves the letter (localStorage `honestcv.careerDocs`) and opens the viewer.
  The example text is deliberately full of bracketed slots:
  `[Hiring manager's name]`, `[Company]`, `[Current company]`,
  `[languages/frameworks]`, … (letterExamples.data.json: every fact slot is an
  explicit `[placeholder]`).
- The example dialog itself instructs: "load it, then replace the
  [placeholders] with your details."
- Clicking the card-level **TXT** button immediately downloaded
  `software-engineer-cover-letter.txt` — no alert, no status, no confirmation
  (CDP: anchor-click hook captured the download; zero `[role=alert]`/
  `[role=status]` nodes appeared). PDF/DOCX go through the same code path.

## Root cause (source)

`src/pages/Dashboard.tsx` `docDownload()` is the single choke point for all six
letter download buttons (3 per saved-document card + 3 in the document viewer
dialog). Its onClick exports unconditionally — there is no check that the
letter still contains unfilled `[placeholder]` slots, even though the product
seeds those slots itself and tells the user to replace them. The resume side
has a final-check precedent (Builder download final-check dialog); letters
have nothing.

## Consequence

A user who loads a role example and downloads gets a letter addressed to
`[Hiring manager's name]` at `[Company]` — the single most embarrassing
failure mode of a letter tool, silently allowed with product-seeded text.

## Fix (minimal, Dashboard.tsx only)

- `countLetterPlaceholders(text)`: count `/\[[^\][\n]{1,60}\]/g` matches.
- Extract the existing download body into `runDocDownload(d, text, fmt, key)`.
- `docDownload` onClick: if count > 0 → open a confirm dialog
  ("Unfilled placeholders" — "…still contains N bracketed placeholders like
  [Company]…") with **Fill them in** (opens the document in edit view) and
  **Download anyway** (proceeds); otherwise download as before.
- Interview briefs included: same rule, same brackets convention.

## Non-goals

- No change to letter example content, Builder tool dialogs, or resume
  exports.
- No highlighting of placeholders inside the textarea (candidate for a later
  round).
- No blocking: "Download anyway" always available (user may want brackets).
