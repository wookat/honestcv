# R232 — Crop & reposition dialog for the profile photo

## First-party evidence

Rezi "Resume Photo" guide (https://www.rezi.ai/rezi-docs/how-to-add-a-resume-photo,
updated 2026-07-16):

- "you can upload an image, **adjust the sizing**, and see exactly how it looks."
- "Upload your profile photo by selecting a professional headshot, then
  **crop, reposition, replace, or remove** it as needed."

## Gap

HonestCV has photo upload/replace/remove (R-earlier) but the crop is a fixed
automatic center-square — no way to reposition or zoom. Off-center headshots
(subject left/right of frame, head near top) crop badly with no recourse.

## Design

Smallest focused change, zero schema change (`resume.photo` stays the final
256×256 JPEG data URL):

- Selecting a file now opens a **"Adjust photo"** dialog instead of instantly
  committing the auto center crop:
  - live square preview (fixed viewport) of the crop;
  - zoom slider 1×–3× (1× = current center-crop framing);
  - drag (pointer events) to reposition; offsets clamped so the crop window
    never leaves the image;
  - Save renders the chosen source rect to the existing 256×256 canvas →
    `toDataURL('image/jpeg', 0.85)` → `setResume` (same commit path as today);
  - Cancel discards — resume untouched.
- Default state = today's behavior (centered, 1×), so Save-without-adjusting
  is byte-equivalent framing to the old auto crop.
- "Change photo" re-opens the file picker (replace flow unchanged); Remove
  unchanged. Preview/PDF/DOCX render paths untouched.

## Invariants

- No schema/persistence change; no scoring, export, worker, or AI changes.
- Invalid images produce the same inline `photoError` as before.
- Dialog is keyboard/touch accessible: slider is a native range input; drag
  works with pointer events (mouse + touch); 375px fits without overflow.

## Acceptance

1. Upload → dialog opens with centered 1× crop; Save without changes yields
   the same framing as the old auto-crop.
2. Zoom + drag reposition changes the committed crop (visible in preview and
   PDF export); crop window never escapes the image bounds.
3. Cancel leaves `honestcv.resume` byte-identical.
4. Replace and Remove still work; invalid file still shows the error message.
5. 375px: dialog usable (slider + drag), no overflow; dark mode legible.
6. Zero AI calls; ATS score unaffected.
