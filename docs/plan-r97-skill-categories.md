# R97 — Categorized skills lines across preview, PDF and DOCX

## First-hand competitor evidence (2026-08-29)

Rezi's "Explore My Rezi Score" modal (audited logged-in, transcript in
`~/audit-r1/shots-r97/modal-text.txt`) has a dedicated skills-formatting
finding under Best Practices:

> Your skills are formatted incorrectly
> Skills should be condensed into categories such as hard skills, soft
> skills, etc.

The same audit re-confirmed R96's word range is exactly Rezi's
("Your resume should contain between 400-800 words") and its page-length
finding ("Your resume is 0.16 page long") — the latter is already covered
by our existing `usePdfPageCount` amber note next to the preview, so the
first R97 candidate (a preview page-count hint) was investigated and
dropped as a duplicate.

## Gap in HonestCV

`Resume.skills` is free text, but every renderer flattens it to a single
paragraph: preview `<p>{skills.trim()}</p>` collapses newlines, PDF
`w.text(...)` re-wraps on whitespace, DOCX emits one `body(...)` run. A user
who writes categorized lines —

```
Languages: Python, TypeScript, Go
Cloud: AWS, Cloudflare, Terraform
```

— gets them mashed into one run-on line in all three outputs. So the
categorized format Rezi demands is impossible to produce, and there's no
nudge toward it either.

## Design

1. **Shared parsing** (`resume.ts`): `skillLines(resume)` splits on
   newlines; a line matching `/^([^:]{1,40}):\s*(.+)$/` yields
   `{ label, rest }`, otherwise `{ text }`. A single-line skills value
   renders exactly as today (backwards compatible; no schema change).
2. **Preview**: one `<p>` per line; `label:` prefix bolded.
3. **PDF**: new writer helper draws the bold `label:` prefix, then the rest
   in regular font starting after it, continuation wraps at the margin.
   Unlabelled lines go through the existing `w.text`.
4. **DOCX**: one paragraph per line with a bold run for the label.
5. **TXT/MD**: already emit raw `r.skills` (newlines preserved) — no change.
6. **Builder nudge** (Rezi parity): under the Skills textarea, when the
   field holds ≥ 8 comma-separated items and no line has a category label,
   show a muted tip suggesting the `Category: a, b, c` per-line format.

Zero AI / API / schema / persistence / score changes (`scoreResume` reads
the raw string; keyword matching is unaffected since labels add words but
matching is substring-based on the whole text).

## Non-goals

- Structured skills data model (chips/arrays) — free text keeps import,
  AI-suggest and +Skills flows untouched.
- A scored ATS check for skill formatting (categorization is a style
  recommendation, not an ATS parse failure).

## Verification

Local: lint, `tsc -b`, build. Production QA: categorized lines render as
separate bold-labelled lines in preview + real downloaded PDF (pdftotext)
+ DOCX (document.xml runs); single-line skills byte-identical to before in
DOCX; nudge appears for a flat 8+ item list, disappears once categorized;
375px; R96 word-count regression; zero AI; localStorage restored.
