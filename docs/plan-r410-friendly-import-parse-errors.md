# R410 — friendly copy for damaged PDF/DOCX import files

## Evidence (banked from R409 audit)
Uploading a corrupt .pdf in the Builder import dialog surfaces the raw pdf.js
message "Invalid PDF structure." (evidence: `r409_c2_pdfguard.png`). Behavior is
safe — draft untouched, dialog stays open — but the copy is a bare library string,
unlike the branded "No text found in this file — it may be a scanned image…" path.
Every import surface (Builder, ATS checker, Dashboard resume + document import,
Landing drop zone) renders `err.message` directly, so any pdf.js/fflate internals
leak to users. The sibling DOCX path throws raw fflate errors (e.g. "invalid zip
data") through `unzipSync` the same way.

## Fix (extractFile.ts only — covers all five surfaces at the source)
```ts
// extractPdf
const doc = await pdfjs.getDocument({...}).promise.catch(() => {
  throw new Error('Could not read this PDF — the file may be damaged. Re-export it or paste the text instead.')
})
// extractDocx
try { files = unzipSync(...) } catch {
  throw new Error('Could not read this DOCX file — it may be damaged. Re-export it or paste the text instead.')
}
```
Valid files, scanned-image "no text" paths, unsupported-type copy, and all
downstream checks unchanged.

## Validation
Local: `npx tsc -b`, `npx eslint src/lib/extractFile.ts`, `npm run build`.
Production QA: corrupt PDF and corrupt DOCX in the Builder import dialog show the
friendly copy (no "Invalid PDF structure.", no fflate wording), dialog stays open,
draft untouched; valid PDF/DOCX/TXT still extract; ATS checker + Dashboard import
spot checks; zero escapes; baseline restore.
