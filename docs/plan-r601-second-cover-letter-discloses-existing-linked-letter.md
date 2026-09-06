# R601 — Writing another cover letter / interview brief for a job discloses the one it already has

## Evidence (production `index-DkJtB7HB.js`, `qa/r601-evidence.cjs flow`, template path, zero AI)

Seed: tracked job `qa-j1` with targeted copy `qa-v1` and a saved cover letter
`Globex — Cover letter` (`coverDocId: 'qa-doc1'`).

1. `/jobs` detail → **Cover letter** → confirm dialog: *"This opens the resume copy targeted at this
   job in the editor, then opens the cover letter tool pre-filled for this company."* — no mention
   that this job already has a saved letter (the detail panel two lines below does list it).
2. Builder cover-letter tool opens; nothing in it mentions the existing letter either.
3. Start from a template → **Save to My resumes**: storage goes from
   `docs [qa-doc1]`, `pipeline [qa-j1 → qa-doc1]` to
   `docs [fkoearpo "Globex — Cover letter (2)", qa-doc1]`, `pipeline [qa-j1 → fkoearpo]`.
   The first letter silently loses its "for Site Reliability Engineer at Globex" note on
   `/dashboard` and `/documents`; the job's "Cover letter:" line now points at the new one.

Same code path for interview prep (`interviewDocId`) and resignation letters (`resignationDocId`).

Root cause: `BundleToolDialog` always starts with `savedId = null`, so its first Save creates a new
document and `setPipelineCoverDoc(jobId, doc.id)` overwrites whatever the entry pointed at. The
newest-wins rule is reasonable; the silence is not (R591/R594 stance: never move a link without
saying so).

## Fix

- `Jobs.tsx` confirm dialog for `intent === 'cover' | 'interview'`: when the entry's existing doc
  still exists (`linkedDoc(jobId, kind)` — resolved against `listCareerDocs()`, like `linkedVersion`),
  the description starts with *"This job already has the saved cover letter "<title>" — a letter you
  save from the tool becomes its cover letter instead; the current one stays in your documents."*
  and a secondary button **Open saved letter** / **Open saved brief** goes to `/documents?doc=<id>`.
- `Builder.tsx` `BundleToolDialog`: `existingDoc` = the job's linked doc of this `kind` that still
  exists. While `savedId === null` and `existingDoc` is set, a note under the action row says
  *"This job already has "<title>" saved — Save makes this one the cover letter linked to the job;
  the earlier one stays in My resumes."* (interview brief / resignation letter for the other kinds).
  The note renders with the result block, i.e. once there is a letter to save. The save itself is
  unchanged.

## Acceptance (production, 1280 + 375)

- Seeded job with linked letter: dialog text includes the letter title, `Open saved letter` lands on
  `/documents?doc=qa-doc1` (one-shot param; the viewer opens on the letter); tool shows the note
  once a template/result exists; after Save the note disappears (`Saved — update`), storage shows
  the new doc linked and the old one kept (unchanged behaviour, now disclosed).
- Same for interview prep via the at-risk-draft confirm dialog (`Open saved brief`, brief wording).
- Control (no linked letter): dialog and tool wording unchanged.
- No page overflow at 375; storage restored; 0 console errors; 0 AI calls.

## Result (2026-09-06, production index-DJjbFGDT.js / Jobs-C2F2bXRa.js / Builder-BDtG7fZ5.js)

All of the above verified at 1280 and 375 with `qa/r601-evidence.cjs` (flow / open-saved /
interview / control): only `/api/ai/quota`, `/api/jobs/search`, `/api/billing/status` reads on the
wire, no AI generation; storage back to baseline; 0 console errors.
