# R179 — Inline links in bullet text (`[text](url)`)

## Evidence (first-hand, public)

Rezi's public changelog ("Updates December 2023 — Bold, Italics, Underline, Link
now possible") lists Link as the fourth inline style shipped alongside bold,
italics and underline. R177 shipped bold/italic, R178 underline; links are the
remaining item on that line. The protected Rezi editor is still inaccessible
(login/OAuth rejected, OTP endpoint 403 — same as R176–R178), so scope is based
on the public changelog only; no protected behavior is claimed.

## Current behavior

Bullet strings support `**bold**` / `*italic*` / `***both***` / `__underline__`
via `src/lib/marks.ts`. A pasted `[text](https://x.com)` renders literally in the
preview and every export.

## Design (no schema change)

Markdown link syntax stored in the same bullet strings:

- `[text](https://example.com/path)` — full URL
- `[text](example.com/path)` — scheme-less; normalized to `https://` at
  render/export time only (stored string untouched)
- Label may nest existing marks: `[**bold link**](url)`
- Unmatched/empty brackets or a parenthesis body that doesn't look like a URL
  stay literal

Model: `InlineRun` gains optional `href?: string` (normalized absolute URL).
Links are parsed first; the label is then run through the existing mark parser
with `href` attached to each resulting run.

## Integration

- Preview (`ResumePreview.tsx`): runs with `href` render as
  `<a href target="_blank" rel="noopener noreferrer">` with underline styling;
  `restoreMarkedDom` mirrors this. `domToMarks` serializes `A` tags back to
  `[label](href)` so contentEditable edits round-trip.
- Textarea (`LintedTextarea.tsx`): Ctrl/Cmd+K wraps the selection as
  `[sel](url)` and selects the `url` placeholder for immediate typing; if the
  selection is already a full link token, Ctrl/Cmd+K unwraps it back to the
  label.
- PDF (`pdf.ts`): link runs draw in the template accent color with an underline
  rule and a per-word URI link annotation (same annotation mechanism as the
  contact line), wrapping like any other run.
- DOCX (`docx.ts`): link runs emit `ExternalHyperlink` with the standard
  Hyperlink character style; nested bold/italic/underline flags preserved.
- TXT/ATS/health: `stripInlineMarks` keeps the label text only — scores for
  linked and plain text are identical; no URL noise in ATS matching.
- Markdown (`resume.ts`): `[text](url)` is already valid CommonMark and passes
  through verbatim (`marksToMarkdown` must not rewrite link bodies).

## Non-goals

Links outside bullet fields; link editing UI beyond the shortcut; URL
validation beyond a light shape check; schema/storage migration; scoring
changes; payments; GitHub Actions; Cloudflare token or recording-service fixes.

## Acceptance

- Preview renders clickable styled links (new tab), nested marks compose,
  literal negatives stay literal.
- Ctrl/Cmd+K wrap + unwrap in bullet textareas; B/I/U unchanged.
- contentEditable round-trips existing links through edit/blur/Escape.
- PDF: accent-colored underlined link text with working URI annotations; no
  overflow (x1 ≤ 558pt).
- DOCX: `w:hyperlink` with relationship target = href.
- TXT: label only; MD: `[text](url)` verbatim.
- Scores identical for linked vs plain bullets.
- 1440 + 375px no overflow; R174–R178 stacked smoke green.
