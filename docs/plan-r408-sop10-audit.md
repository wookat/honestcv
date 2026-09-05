# R408 — SOP-10 four-dimension production audit + 0%-match next-step copy

## Audit (production, R407 bundles, 2026-08-31)
Four dimensions swept over headless CDP with network interception, zero escapes, byte-exact baseline restore:
1. Console workflows: folders/bulk/undo (real delete → Undo restores all), backup restore with corrupt values, non-backup file rejection, per-copy share scoping + legacy shareLink attribution, doc duplicate timestamps, styled unsaved-close confirms — all pass.
2. Feature depth: history restore with pre-restore checkpoint (R397), R403 styled replace dialog, reminder → attention pill → ?attention=1 (R379), follow-up draft dialog (R372), Target my resume creates + opens targeted copy (R385) — all pass.
3. Static pages: /, /pricing, /templates, /examples, /guides × 375/768/1440 × light/dark — zero overflow, zero exceptions; 24 internal links land on real pages.
4. Robustness: malformed jobPipeline/resumeVersions/shareLinks/resumeHistory seeds, bogus ?doc/?jump/?attention/?example/r/<id> deep links, quota-full track-job and Save-as-copy (R394/R393 alerts fire, zero writes) — all pass. Zero Page.javascriptDialogOpening events anywhere (R403/R405 hold).

## Findings triage
- Reported P3 "tailor dialog shows raw server error body" — **dismissed as harness artifact per R398 precedent**: worker/index.ts maps every upstream failure to user-worded `{error}` copy (callLlm; non-JSON 5xx get a friendly fallback), so a body like `{"error":"internal"}` cannot be produced by the real worker; suppressing `data.error` would hide the genuine friendly copy.
- Confirmed P4: after "Target my resume" on a job with no keyword overlap, the tracked row's next-step reads "Improve your targeted copy — 0% keyword match." — honest but reads oddly right after the app itself created the copy, and gives no hint what improving means.
- Non-findings recorded: bulk-undo restores sanitizer-normalized data (not data loss); first quota-full probe starved the harness, clean re-probe passes.

## Fix (minimal, Jobs.tsx nextStep only)
Special-case `match === 0` with actionable copy:
```tsx
if (match !== undefined && match < 80)
  return {
    text: match === 0
      ? "Your targeted copy doesn't use any of this job's keywords yet — open it and add a few."
      : `Improve your targeted copy — ${match}% keyword match.`,
    ...
```
Badges and the detail-pane metric line stay (honest numbers). No behavior change.

## Validation
Local: `npx tsc -b`, `npx eslint src/pages/Jobs.tsx`, `npm run build`. Production QA: 0%-overlap targeted copy shows the new sentence with working "Open targeted resume"; partial-match copy unchanged (`Improve your targeted copy — N% keyword match.`); ≥80% path unchanged; R407 mobile deep link regression; 375 light/dark; zero console errors; zero escapes; baseline restored.
