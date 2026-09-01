# R128 — Custom section headings (rename built-in section titles)

## Audit evidence (Rezi, public logged-in surfaces, 2026-08-31)

On Rezi's Finish Up preview the section headings themselves (e.g. "EXPERIENCE")
are `contenteditable` — a user can click the heading and rename it in place
("Work Experience", "Professional Experience", a localized title, …), and the
rename carries into the exported document. In RezUp, built-in section headings
are fixed strings: only custom sections have a user-controlled title. R127 made
entry text inline-editable but deliberately excluded headings because they had
no storage. This round adds that storage.

## Why it matters

- Job seekers routinely need heading variants: "Work Experience",
  "Professional Experience", "Technical Skills", "Selected Publications",
  "Honors" — or non-English headings for local-market applications.
- Today the only workaround is a custom section, which loses the structured
  entry editors (dates, bullets, ATS parsing) of the built-in sections.

## Design

Schema (backwards compatible, no migration):

```ts
/** Per-section heading overrides keyed by section key; '' / missing = default */
sectionHeadings?: Partial<Record<string, string>>
```

- Sanitized on load: object of string values, trimmed, entries equal to the
  default label or empty are dropped (keeps stored JSON minimal).
- New helper next to `sectionLabel`:

```ts
export function sectionHeading(r: Resume, key: string): string {
  const custom = (r.sectionHeadings?.[key] ?? '').trim()
  return custom || sectionLabel(r, key)
}
```

Render sites switch from hardcoded strings to `sectionHeading(resume, key)`:

- `src/components/ResumePreview.tsx` — all 13 built-in `heading('…')` calls.
- `src/lib/resume.ts` `resumeToPlainText` — plain-text/clipboard export.
- `src/lib/pdf.ts` — PDF export.
- `src/lib/docx.ts` — DOCX export.
- Custom sections keep using `s.title` (already user-controlled).
- `TemplateThumb` (static template art) intentionally unchanged.

Editing surface: reuse R127's `InlineText` on the heading itself in the Builder
preview (only when `onEdit` is provided — share page/dashboard stay read-only).
Commit writes `sectionHeadings[key]`; clearing the text restores the default
label (commit stores `''` → dropped by sanitize → default shown). `fallback`
is the default label so an emptied heading never renders blank.

ATS: scoring already nudges toward standard headings
(`ats.ts`: 'Use standard headings…'); guidance text remains valid — a renamed
heading is the user's informed choice, no new checks added.

Out of scope: renaming via the form sidebar (preview inline edit is the
discoverable surface, consistent with R127), per-template heading casing
changes, custom-section behavior (already supported).

## Acceptance

- Local lint + build green.
- Rename "Experience" → "Work Experience" in the Builder preview: persists
  across reload, appears in PDF, DOCX and copied plain text.
- Clearing a renamed heading restores the default label.
- Share page and dashboard previews stay non-editable and show the override.
- R125 click-to-jump on section whitespace and R127 entry editing unaffected.
- 1440 + 375 viewports, no overflow.
