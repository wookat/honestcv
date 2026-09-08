# R778 — Function benchmark refresh + Projects keep their lines (import → preview → PDF / DOCX / TXT / MD)

## Benchmark refresh (five rounds since R773, first-hand)

- Rezi public pages (`/`, `/ai-resume-builder`, `/pricing`, `/resume-checker`,
  `/job-search`, `/ai-cover-letter-builder`, `/ai-interview`): HTTP 200,
  headings byte-identical to R773; `/resume-keyword-scanner` still 404. No new
  product surface observed.
- Production: `/api/jobs/search` five queries all 200 with feed attribution
  (`engineer` 150 rows remotive 5 / jobicy 50 / arbeitnow 95; `nurse` 3;
  `data analyst` + London 72 incl. themuse 4; `barista` + Chicago 4;
  `product manager` 150), 0 rows with residual markup / entities;
  `/api/ai/quota` 200; `/`, `/ats-checker`, `/pricing`, `/jobs`,
  `/sitemap.xml` 200.
- Four-dimension read (workbench / core functions / landing / architecture):
  no new P0. P1 candidates, each traced to a retained real file rather than a
  synthetic case:
  1. **Projects lose their structure on import and again on export** — see
     below. Real evidence in two retained CVs (`pages-mac-sumit.pdf`,
     `chrome-print-ronstr8.pdf`). Chosen.
  2. Hyphenated line-end wraps (`multi-` / `tenant`) rejoin with a space, so
     `multi- tenant` reaches every export and the ATS check: a synthetic ad
     naming `end-to-end` did not match a resume that stated it as `end-
     to-end` (indexed text `end- to-end`; ordinary `end-to-end` matched).
     Folded into this round (`joinWrapped`) because it is the same wrap code.
  3. ronstr8 export replay (queue item) — done as part of the export replay
     below rather than as its own round.
  Still in the queue with no real file behind them: school-followed bare list
  attribution, two-column three-zone / sidebar name, LinkedIn locale
  variants, `Leadership, Negotiation` rows outside Skills.

## Evidence for the chosen item

`ProjectItem.description` is one string. The builder already edits and lints it
line by line (`p.description.split('\n')` in `Builder.tsx`), but:

- **Import** (`importText.ts` Projects branch) joined every body / bullet / tag
  row of a project with `' '`, so a project's lines arrived as one paragraph
  and could never be lint-checked or edited as bullets. Worse, an
  undescribed project's stack row (`Next.js · TypeScript · Vanilla CSS · React
  · Vercel`) and the wrapped rest of a long bullet (`files`, `control API
  costs`) failed every "belongs to the last project" test and opened new
  projects: Sumit's four projects parsed as **nine**, one named `· TypeScript
  · Vanilla CSS · React · Vercel` with link `Next.js` (URL_RE matched the
  file-extension-shaped word).
- **Export**: TXT / MD wrote the string as-is (newlines survive), PDF
  `bodyText(p.description.trim())` and DOCX `body(p.description.trim())` and
  the preview `<p>` flattened newlines into one paragraph. A description typed
  as three lines exported as three bullets in TXT/MD and one paragraph in
  PDF/DOCX/preview — three documents from one resume.

Source shapes (pdf.js text, measured):

```
ronstr8 p2   Logodal / Jan 2026 – Present / <intro paragraph, 2 lines> /
             <4 bullets each wrapped over 2 lines, no bullet glyph in text> /
             Kubernetes Minikube Helm Perl Rust React Networking / Antigravity Claude Codex
sumit p1     AlgoLens — Interactive Algorithm Visualizer · Live Demo · Source Code /
             Next.js · TypeScript · Vanilla CSS · React · Vercel /
             • Designed and built 25+ … (3 lines) / • Architected a universal … (3 lines)
```

## Change

`src/lib/importText.ts`

- `joinWrapped(prev, line)`: a wrap inside a hyphenated word (`[A-Za-z]-$` +
  lowercase start) rejoins with no space; everything else with one. Used by
  custom-section, experience, education (`continueEduLine`) and project
  continuation.
- Projects: one description line per source line (`'\n'`), the wrapped rest
  of a line (`continuesPrevious`, or a ≥ 60-char unterminated previous line
  followed by a body line; never a bullet / tag list / `·` row) is joined onto
  that line; a stack row (`isStackRow`: ≥ 3 ` · ` / ` | ` separated items of ≤ 3
  words, no terminal punctuation) directly under an undescribed project is its
  first line; `CODE_NAME_RE` keeps `Next.js` / `index.html` out of `link`.

`src/lib/resume.ts` — `projectBullets(p)`: the non-empty trimmed lines. Two or
more lines are bullets, one line is a paragraph. TXT / MD list bullets as `- `.
`src/lib/pdf.ts` / `src/lib/docx.ts` / `ResumePreview.tsx` — the same rule; the
editable preview edits one line per bullet through the existing
`editDescriptionLine`.

## Rejected

- Storing project bullets in a new `bullets[]` field: every renderer, the
  lint, the AI Tailor payload and saved copies would need a migration; the
  line-based string is already the editor's model.
- Treating an intro paragraph differently from bullets (ronstr8 prints its
  first line as prose, the rest as bullets): the text carries no glyphs to
  tell them apart; rendering every line as a bullet keeps every line and is
  what the editor already implies. Recorded as a boundary.
- Parser-only fix (keep exports flattening): the TXT/MD ↔ PDF/DOCX mismatch
  predates this round and is the user-visible half.

## Local verification

- Parser replay (`qa/r778-replay.mts`, R777 baseline copy vs branch), 114
  retained texts + 72 PDF extractions = 186: **182 identical, 4 changed** —
  ronstr8 (`multi-tenant` / `bare-metal` / `open-source` rejoined; 2 projects
  now 6 + 4 lines) and Sumit (9 → 4 projects, each with its stack row + its
  bullets; no bogus `Next.js` link) in both their PDF and text forms.
- Export replay (`qa/r778-export-all.mts`, R777 worktree vs branch, TXT / MD /
  PDF text / DOCX text × 186): identical on 184 / 186 in every format; the two
  changed files are the same two, and every changed line is one of the above
  (PDF and DOCX now list the project lines as bullets, `multi- tenant` →
  `multi-tenant`).
- Gates: tsc app + worker, eslint (changed files), build, verify-dist green.

## Boundaries

- A project intro paragraph followed by bullets is rendered as bullets too.
- `isStackRow` needs ≥ 3 ` · `/` | ` items; a two-item stack row under an
  undescribed project still opens a project.
- Wrap-join heuristic (≥ 60 chars, unterminated) is for pdf.js text with no
  bullet glyphs; a short unterminated bullet followed by a body line stays two
  lines.
- `joinWrapped` only when the next line starts lowercase (`Kubernetes-` /
  `native` would not rejoin on a capital — none seen in the corpus).
