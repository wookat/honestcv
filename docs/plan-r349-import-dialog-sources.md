# R349 — Import dialog alternate-sources audit + disambiguate the duplicate "Import" label

## Evidence (first-hand)

- R348 SOP-10 production audit observed the paste-import dialog showing two buttons both labeled `Import`: the Resume Center pull action (disabled until an ID is entered) and the paste action (`Import — replaces current content (Ctrl+Z to undo)`). Confusing visually and identical for screen-reader users scanning by button name.
- Source (`src/pages/Builder.tsx` import dialog): the Resume Center button renders `{rcBusy ? 'Importing…' : 'Import'}`; the Zalize row already uses the specific `Import my primary resume`.
- The dialog's non-paste sources (file upload errors, Zalize primary pull, Resume Center share pull) have never had a dedicated production QA pass — R348 covered paste only.

## Change

Rename the Resume Center action to `Import from Resume Center` (busy copy unchanged). No behavior change.

## Audit scope (production, this round)

- Resume Center pull: valid share link and raw share ID (mocked `/api/share/:id` fetch — no persistent shares), imported content replaces the draft and unlinks the version; bad input shows "Paste a Resume Center share link or share ID."; fetch failure shows the error inline and the dialog stays open.
- File upload negative path: empty-text file → "No text found in this file…" copy.
- Both Import buttons now visually and programmatically distinct; disabled state until input.
- 375px + dark; baseline restore; zero real AI/shares.

## Non-goals

Onboarding wizard depth gap (own design round); Zalize sign-in flow (requires real auth).
