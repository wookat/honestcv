# R372 — follow-up drafting anytime + offer variant + honest Copy email failure

## Evidence (production, R371 audit + firsthand source confirmation)
- The "Draft follow-up email" button renders only inside the stale nudge block, which requires
  `staleDays(entry) !== null` — i.e. applied/interviewing AND ≥7 days quiet. A user who wants to
  follow up on day 5, or thank/check in on an offer, has no entry point (offer entries show no
  affordance at all; source-confirmed staleDays returns null for offer/rejected/saved).
- `followUpEmail` derives `days` from `staleDays(entry) ?? 0`, so any pre-threshold draft would
  read "I applied … 0 days ago".
- "Copy email" swallows clipboard rejection: `.writeText(...).then(setCopied)` with no catch —
  silent no-op on failure (observed in the R371 audit run).

## Design (deterministic, zero AI quota)
1. `daysSinceLastStep(entry)`: day count from the last timeline step regardless of the 7-day
   threshold. `followUpEmail` uses it instead of `staleDays() ?? 0`.
2. Natural phrasing for fresh drafts: applied opener says "today" / "yesterday" / "N days ago";
   interviewing opener under 2 days switches to "We spoke about the <title> position on <Mon D>,
   and I wanted to follow up on where things stand." (≥2 days unchanged).
3. Offer variant: subject "Thank you for the <title> offer at <company>"; opener thanks for the
   offer and asks about next steps / decision timeline; middle paragraph expresses excitement
   (tailored-copy rule not relevant, offer already in hand). Recruiter greeting rule applies.
4. Jobs.tsx: "Draft follow-up email" button renders for every applied/interviewing/offer entry
   (below the timeline, next to the stale nudge when present). Saved/rejected: no button
   (nothing to follow up on; rejection outreach is a different tool).
5. Copy email failure is visible: tri-state idle/copied/failed — `.catch` flips the button to
   "Copy failed" (role=alert not needed; the label change suffices in a 3-button footer).

## Acceptance
- Offer entry shows the button; draft has thank-you subject/opener; recruiter note still
  personalizes the greeting.
- Applied 0d/1d drafts read "today"/"yesterday"; 10d draft byte-identical to R371.
- Interviewing 12d draft byte-identical to R371; 1d draft uses the "We spoke … on <date>" form.
- Saved/rejected entries: no draft button.
- Clipboard rejection flips the button to "Copy failed"; success still shows "Copied".
- Oracle for day phrasing + offer variant; tsc/eslint/build green; production QA 375 light/dark;
  R371/R370/R369 regression.
