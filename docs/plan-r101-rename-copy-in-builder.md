# R101 — Rename a saved copy from the builder

## First-hand evidence (Rezi, 2026-08, logged-in editor)

- `~/audit-r1/shots-r101/settings.png|txt`: the resume switcher menu's **Settings**
  opens an "Update your resume" dialog whose first field is **RESUME NAME** — the
  live document can be renamed without leaving the editor. (The rest of that dialog —
  experience level, import, language, target job title/company/JD — is already
  covered by our builder fields and Jobs targeting.)
- `~/audit-r1/shots-r101/history.txt`: History menu = Undo / Redo / Versions —
  covered by our edit history (R28) and copies.
- `~/audit-r1/shots-r101/review.txt`: Review = paid human review ($0.15–0.23/word),
  deliberately out of scope (business-model difference, prior decision upheld).

## Gap

Since R100 the builder shows the linked copy's name in the Copies toolbar button,
but there is no way to rename a copy from the builder. Renaming only exists on the
Dashboard card editor (R36). A user who saves "Untitled copy" or wants to retitle
the copy they're editing has to leave the editor, find the card, open its edit
dialog — Rezi does this inline in the editor.

## Design

Smallest focused change, Builder.tsx only:

- In the Copies dialog, each row gets a **Rename** icon button (pencil) beside
  Open/Delete. Clicking it swaps the row's name line for an inline text input with
  Save/Cancel; Save calls the existing `updateResumeVersion(id, { name })`
  (lib/resume.ts, unchanged) and refreshes the dialog list.
- Empty/whitespace names keep the old name (same rule as the Dashboard editor).
- If the renamed copy is the linked one, the toolbar button label updates
  immediately (it reads from the same `versions` state).
- Enter saves, Escape cancels. One row in rename mode at a time.

Non-goals: no Rezi Settings-dialog clone (language/experience-level fields), no
folder editing in the builder (Dashboard already does folders), no schema/AI/
scoring/storage-key changes — `honestcv.resumeVersions[].name` is an existing field.

## Verification

- `npm run lint`, `npx tsc -b`, `npm run build` locally.
- Production QA: rename a non-linked copy (list + persistence after F5), rename the
  linked copy (toolbar label updates immediately, `honestcv.activeVersionId`
  untouched, copy `data` untouched, dashboard card shows new name), empty-name
  no-op, Escape cancel, Enter save, 375px row fit/truncation, R100 link/write-through
  regression, console clean, zero AI calls, localStorage byte-for-byte restore.
