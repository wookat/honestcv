# R299 — Dedicated "Import from LinkedIn" entry point on the dashboard

## Evidence
- Rezi first-party (rezi.ai/rezi-docs/create-resume): creating a resume offers four
  first-class options — from scratch, from an existing resume, **import your LinkedIn
  profile**, or the AI agent. LinkedIn import is a named, discoverable path, not a
  footnote (their mechanism is a Chrome extension; ours is the Save-to-PDF export).
- R298 SOP-10 audit (docs/qa-r298-plan.md): our LinkedIn import exists and works
  (looksLikeLinkedInExport → parseLinkedInText, R266 hint text), but the audit's UI
  probe concluded "no LinkedIn import" because the only surface is one footnote line
  inside the generic import tile — a confirmed discoverability gap.

## Change (Dashboard.tsx only)
- The footnote line in the import tile becomes a nested control: "Importing from
  LinkedIn? See how" opens a new small dialog.
- New `linkedInOpen` dialog: numbered steps (LinkedIn → Profile → More → Save to PDF;
  upload it here — read entirely in your browser) + a "Choose the LinkedIn PDF" button
  that closes the dialog and clicks the existing hidden `importInputRef` input.
- Zero changes to parsing, extraction, or the confirm-import dialog (it already labels
  recognized LinkedIn exports).

## Non-goals
- No Chrome extension / LinkedIn API scraping (violates local-first model and ToS risk).
- No changes to importText.ts.

## Verification
- tsc/lint/build; deploy; production QA: dialog opens from the tile, steps readable,
  button opens the file picker, LinkedIn-export fixture flows into the existing
  "recognized as a LinkedIn profile export" confirm dialog; 375px strict overflow;
  dark mode; generic import regression.
