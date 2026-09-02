# R274 — Markdown export: `__underline__` marks outside bullets export as CommonMark bold

## Evidence (first-party, local run of the same code deployed to production)

Probe (`.tmp-smoke/r274_probe.ts`, `npx tsx --tsconfig tsconfig.app.json`):

```
summary = 'Led **growth** with *focus* and __rigor__ at [Acme](https://acme.com).'
bullet  = 'Shipped **X** with __care__'
```

Markdown export output:

```
Led **growth** with *focus* and __rigor__ at [Acme](https://acme.com).   ← summary line
- Shipped **X** with <u>care</u>                                          ← bullet line
```

- In this app's inline-mark language, `__x__` means **underline** (see `src/lib/marks.ts`).
- In CommonMark, `__x__` renders **bold**. `marksToMarkdown` exists exactly to rewrite
  `__x__` → `<u>x</u>` at the Markdown boundary — but `resumeToMarkdown` applies it only to
  lines starting with `- ` (bullets).
- Summary (R272 made marks first-class in the summary across preview/PDF/DOCX), project and
  cert descriptions, skills, and companyInfo lines all bypass the rewrite, so a user's
  underline silently turns into bold in the exported .md.
- TXT export is unaffected (global `stripInlineMarks`); PDF/DOCX/preview parse marks properly.

## Fix

In `resumeToMarkdown`'s final serialization, apply `marksToMarkdown` to every line instead of
only `- ` lines:

```diff
- .map((l) => (l.startsWith('- ') ? marksToMarkdown(l) : l))
+ .map((l) => marksToMarkdown(l))
```

- `marksToMarkdown` only rewrites well-formed `__…__` tokens; lines without them are
  byte-identical, so bullets and all mark-free resumes are unchanged.
- `**bold**`, `*italic*` and `[text](url)` are valid CommonMark and continue to pass through.

## Validation

- Oracle: marked summary / project description / skills lines gain `<u>…</u>`, bullets
  byte-identical to pre-R274, mark-free resume export byte-identical.
- Local lint / typecheck / build green.
- Production QA: real UI Markdown download with marked summary; regression on TXT/PDF/DOCX.
