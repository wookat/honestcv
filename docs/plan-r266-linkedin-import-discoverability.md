# R266 — LinkedIn profile import discoverability

## First-party Rezi evidence (retrieved 2026-09-02)

- rezi.ai/rezi-docs/importing-your-linkedin-profile ("Import LinkedIn Profile",
  updated June 11, 2026): a dedicated, heavily marketed tool — "The Import
  LinkedIn Profile tool helps you keep everything consistent by transferring
  details directly from LinkedIn into your resume"; "If your LinkedIn profile
  includes your work experience, education, and skills, the import feature
  takes those details and turns them into a resume".
- The same guide stresses the review step: "don't think of it as a one-click
  'done' button. You'll still want to review and refine the content."

## Gap

HonestCV has shipped a LinkedIn-aware import parser for a long time:
`parseResumeText` in `src/lib/importText.ts` routes through
`looksLikeLinkedInExport` → `parseLinkedInText`, which understands the
LinkedIn "Profile → More → Save to PDF" export (contact sidebar, Top Skills,
per-role durations, page footers). But **no UI surface mentions LinkedIn at
all** — the dashboard import card says only "Click or drop a PDF, DOCX or TXT
here". Users with no resume file (Rezi's core audience for this tool) have no
way to discover that their LinkedIn profile is a supported starting point, and
after importing one they get no confirmation the file was recognized as
LinkedIn (vs. generically scraped).

## Design

Narrow, Dashboard-only, zero parser changes:

1. Import card copy now advertises the LinkedIn path:
   - subtitle: `Click or drop a PDF, DOCX or TXT here — read entirely in your
     browser.` + new second line `No resume yet? On LinkedIn, use Profile →
     More → Save to PDF and import that file.`
2. LinkedIn recognition feedback: `handleImportFile` computes
   `looksLikeLinkedInExport(text)` (exported already) and stores it in new
   state `importedLinkedIn`. The existing "Open the imported resume?" confirm
   dialog description appends, when true:
   `This file was recognized as a LinkedIn profile export and mapped
   section-by-section — review the result before sending it anywhere.`
   (echoes Rezi's own review-first advice). When there is no draft the import
   opens the Builder immediately (unchanged), so the note only appears in the
   confirm-dialog path.

Non-goals: no Chrome extension, no live LinkedIn scraping, no parser changes,
no worker/schema/scoring/persistence changes, no AI.

## Verification

- tsx oracle: `looksLikeLinkedInExport` fixture matrix (handle line / Top
  Skills / url+page-footer / plain resume negative) — guards the copy claim.
- Production QA: import a real-shape LinkedIn export TXT with and without a
  draft; confirm dialog note appears only for LinkedIn files; plain resume
  import unchanged; card copy; 375px; light/dark contrast; zero AI calls.
