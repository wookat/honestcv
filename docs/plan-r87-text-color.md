# R87: body text color option (Default / Black / Navy)

## Evidence (first-hand, 2026-08-29)

Fresh logged-in audit of Rezi's Finish Up toolbar (`~/audit-r1/shots-r87/finishup-color-dropdown.png`):
the `A ▾` control opens a popover with **two independent pickers** — "Text color" (dark navy vs
black swatches) and "Accent color" (12 swatches). HonestCV covers accent color (R22-era
`accentColor` + `ACCENT_CHOICES`) but body text color is hard-coded: preview uses `text-[#1f1f1f]`,
PDF uses `ink = rgb(0.12, 0.12, 0.12)`, DOCX leaves runs at the Word default (black).

## Gap

Users cannot choose true-black text (a common print/ATS-conservative preference) or the softer
navy body text Rezi offers. The knob exists in Rezi as a first-class toolbar control.

## Design

- `Resume.textColor?: 'default' | 'black' | 'navy'` — optional enum, sanitized like the other
  appearance enums; absent/`'default'` keeps today's near-black. No new localStorage key.
- Single source of truth in `src/lib/resume.ts`:
  - `TEXT_INKS = { default: '#1f1f1f', black: '#000000', navy: '#1f3a5c' }`
  - `textInkOf(r)` → hex string.
- Preview (`ResumePreview.tsx`): replace the hard-coded `text-[#1f1f1f]` classes with
  `style.color = textInkOf(resume)` on both the single-page and paginated containers.
- PDF (`pdf.ts`): `w.ink = hexToRgb(textInkOf(resume))` alongside the existing fs/lh/ss wiring.
  `soft` (secondary gray) is intentionally unchanged — dates/locations stay muted in all modes.
- DOCX (`docx.ts`): thread a `color` through the resume body/heading helpers only when the user
  picked a non-default color (default keeps Word's inherited black — byte-identical output for
  existing users).
- Builder: a small three-swatch "Text" control next to the existing accent swatches row.

## Not doing

- Arbitrary text color picker (illegible resumes; Rezi itself only offers two).
- Letterhead (cover/resignation) exports — body letters stay default ink.
- TXT/MD — plain text, no color.
