# R121 — Profile photo (preview + PDF)

## First-hand evidence (captured this round)

`shots-r121/finish-up.png|.txt`: Rezi's Finish Up & Preview toolbar exposes a
first-class **"Profile picture"** control alongside "Icons" — a photo on the
resume is a standard formatting option there. HonestCV has zero photo support
anywhere (no schema field, no upload, no rendering).

## Design

- **Schema**: optional `photo?: string` on `Resume` — a `data:image/...` URL.
  Sanitizer keeps it only when it starts with `data:image/`; absent otherwise.
- **Upload (Builder contact section)**: "Add photo" file input; the image is
  center-cropped square and re-encoded to a 256×256 JPEG data URL on a canvas
  (~10–25 KB, safe for localStorage). Thumbnail + "Remove" button when set.
- **Preview**: photo rendered top-right of the header (absolute, 64px,
  rounded, object-cover) so centered/left header alignment is unchanged.
- **PDF**: `embedJpg`/`embedPng` drawn 48pt square at the top-right margin —
  same geometry as the preview (816px page ↔ 612pt: 64px ≡ 48pt).
- **DOCX/TXT/MD deliberately unchanged**: the DOCX export is documented as
  text-only so ATS parsers read it cleanly — mirrors the contact-icons
  precedent (R94: preview + PDF only).

## Non-goals

No AI, no scoring changes, no Worker/storage changes, no photo in DOCX,
no cropping UI (auto center-crop only).

## QA

Upload (large landscape + portrait sources) → thumbnail, preview and PDF all
show the center-cropped square; Remove deletes the key from storage;
malformed `photo` values are dropped on load; export PDF contains the image;
375px layout unchanged; zero AI/payment calls; localStorage restored
byte-for-byte.
