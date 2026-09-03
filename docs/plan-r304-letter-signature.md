# R304 — signature image on cover and resignation letters

## Evidence

- Rezi first-party resignation-letter doc (rezi.ai/rezi-docs/ai-resignation-letter-explained),
  step 6 of the flow: "Upload your signature." — a first-class input of Rezi's letter
  generator. Their letter templates also end with "a closing salutation followed by your
  signature underneath".
- Current source: `CareerDoc` (src/lib/documents.ts) has only id/kind/title/text/updatedAt;
  the letter viewer (`LetterPreview`, Dashboard.tsx) and letterhead exports
  (`downloadLetterPdf` pdf.ts, `downloadLetterDocx` docx.ts) render text only — no way to
  sign a letter. R302 explicitly deferred this pending an asset-handling design.

## Design

- Storage: optional `signature?: string` (PNG data URL) on `CareerDoc`. Absent ⇒ key not
  serialized; existing docs byte-identical. Upload is read entirely in the browser
  (FileReader + canvas downscale to max 480px wide, re-encoded PNG, input capped 1 MB,
  accept image/png,image/jpeg). No network, no new storage keys.
- Placement: new pure helper `splitAtSignature(text)` in documents.ts — finds the last
  closing-salutation line (`Sincerely,` / `Best regards,` / `Yours…,` / `With gratitude,`
  etc., a short line ending with a comma) and splits the letter into
  `{ before, after }` so the signature image sits between the salutation and the typed
  name. No salutation found ⇒ image appended at the end (`after` empty).
- Viewer (Dashboard letter dialog, cover + resignation only, not interview):
  "Add signature" upload button + "Remove" once set; `LetterPreview` renders the image
  (~110px wide) at the split point.
- Exports: `downloadLetterPdf` / `downloadLetterDocx` gain optional `signature` param —
  PDF embeds via `embedPng` (drawn 120pt wide, height scaled), DOCX via `ImageRun`
  (~150px). Without signature both outputs are byte-path identical to today.
- Card + viewer download buttons pass `d.signature`.

## Out of scope

- Drawing a signature in-app (upload only, like Rezi).
- Signature on interview briefs; signature fonts/typed signatures.
