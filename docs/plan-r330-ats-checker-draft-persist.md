# R330 — /ats-checker survives a refresh (session draft persistence)

## Evidence

- Rezi changelog 2026-08 Week 4: "Seamless Messaging Navigation: Navigate to
  messages or refresh the page without losing your place" — the same
  refresh-safety yardstick behind our R312 (/jobs), R324 (/samples) and R326
  (/documents) URL-state rounds.
- Source (first-hand): `AtsChecker.tsx` keeps `resumeText`, `jd` and `checked`
  in bare `useState` (lines 82–84). A hard refresh — or an accidental
  back/forward — throws away both pasted texts and the whole report. This is
  the page users paste their longest inputs into (a full resume + a full JD),
  so it is the most expensive state on the site to lose.

## Design (page-local, no worker/schema change)

URL state is unsuitable (multi-KB texts), so persist a draft in
`sessionStorage` under `honestcv.atsCheckerDraft` (`{resumeText, jd,
checked}`), same-tab-only by design — a shared/incognito tab starts blank,
and closing the tab clears it (privacy: pasted resumes never touch
localStorage or the network).

- Seed: router `state.resumeText` (existing dashboard hand-off) wins, else the
  sessionStorage draft, else blank. Seeding from the draft with `checked:true`
  re-runs the local scorer, so the report reappears exactly.
- Persist: one effect writes on every change; when both texts are empty the
  key is removed (blank page leaves no residue).
- `fileChecks` (file-level checks from an upload) intentionally not persisted:
  they describe a `File` object we no longer have.

## QA (production)

Paste resume+JD → Check → hard refresh: texts, score, keyword tiers and
structure checks all restored; refresh with only text pasted (not checked)
restores texts without a report; clear both fields → refresh → blank +
sessionStorage key gone; new tab is blank (session scope); dashboard
"Check pasted text" hand-off still wins over an old draft; 375px strict,
dark mode, zero AI, baseline restore.
