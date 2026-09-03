# R297: marker-less import bullets + Builder tablet header overflow

## Evidence

### P3-1: DOCX import turns bullet lines into fake experience entries
- Rezi's public import flow ("Upload your existing resume") maps uploaded resumes into
  structured entries with the bullet content preserved under the right role.
- Production repro (R297 exploratory audit, bundle index-D1l3dA7t.js): importing HonestCV's
  own DOCX export (`王小明-qa-platform-engineer-resume.docx`) extracts text correctly
  (qa/r297_docx_extracted.txt), but `parseResumeText` produced 4 experience entries instead
  of 2: `Platform Engineer · Acme` ended with `bullets: []` and each description line
  (e.g. "Led migration of 40 services to Kubernetes, cutting infra cost 25%.") became a fake
  entry via `splitRoleCompany` (role="Led migration…", company="cutting infra cost 25%.").
- Root cause (src/lib/importText.ts): the experience mapper only recognises description
  lines that carry a `•`/`-` marker (`isBullet`). DOCX/plain-text extraction often drops
  the markers, so marker-less body lines fall through to the new-entry branch. The projects
  section has the same fall-through (each body line became a new project).

### P3-2: /builder horizontal overflow at 768–1063px
- Production width sweep: 767px passes, 768–1063px fail with `scrollWidth = 1064`
  (plus a 15px overflow at 640px). At `md` the site nav (Templates/Examples/Resources/
  ATS Checker/Jobs/Pricing) appears while the Builder header action cluster (badge, Saved,
  undo/redo/history/assistant, download) is already showing from `sm` — combined intrinsic
  width ≈1064px.

## Fix
1. importText.ts: new `looksLikeBodyLine(line)` (ends with `.!?;` or >60 chars).
   - Experience: a marker-less body line under a current entry is appended to its bullets;
     the two-line-header company branch skips body-looking lines.
   - Projects: body lines append to the last project's description like bulleted ones.
   - Header-like lines (short, no terminal punctuation, or carrying a date range) still
     start new entries; LinkedIn parser untouched (it already handles marker-less lines).
2. Layout.tsx / Builder.tsx: `SiteHeader` gains `wideAction` — Builder keeps the hamburger
   nav up to `lg` (site nav inline only from 1024px). In the Builder action cluster the
   Unlocked/Free badge and Saved indicator move `sm:`→`xl:`, undo/redo `sm:`→`lg:`, so
   every breakpoint fits: <1024 logo+icons+hamburger, 1024–1279 nav+icons, ≥1280 full.

## Non-goals
- No changes to extractFile.ts (text extraction is correct), LinkedIn parser, education
  parsing (bare-year line handling is a separate observation), other pages' headers,
  export pipeline, or the jobs-search backend matching observation.

## Verification
- Oracle: parseResumeText over the extracted DOCX text must yield 2 experience entries with
  2 bullets each, 1 project with merged description; bulleted input regression unchanged.
- npx tsc -b && npm run lint && npm run build; deploy; production QA: DOCX import fidelity,
  width sweep 375/640/768/800/900/1000/1024/1063/1064/1280/1536, nav reachable via
  hamburger below lg, R291 download dropdown regression.
