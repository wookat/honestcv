# R340 — exploratory production audit: keyboard-only accessibility (SOP-02)

## Rationale (first-hand coverage map)
- Rezi changelog: no new public entries since the R338 re-check (Aug 2026
  Week 4 latest). Two consecutive clean audit rounds (R338 SOP-10, R339
  jobs/design chains) — remaining risk is in dimensions never audited.
- Lighthouse a11y has been 1.0 across routes since R309–R311, but Lighthouse
  only covers static semantics. Keyboard-only operation (tab order, focus
  traps, Esc, focus visibility, operability of custom widgets) has never been
  audited in ~200 rounds despite heavy custom UI (inline preview editing,
  chip bars, dialogs, dropdown menus, template picker, undo bars).
- Modern-a11y is an acceptance hard requirement per company knowledge
  (shadcn/Radix should give good defaults — verify, don't assume).

## Audit plan (production, zero AI quota, keyboard-only via CDP key events)
1. Builder golden path keyboard-only: reach the toolbar, section navigator,
   entry cards, inline preview spans (focusable?), undo/redo, downloads menu,
   Print; open/close Share dialog, template picker, tool dialogs (Esc, focus
   trap, focus return to trigger); R333 confirm-on-close still works via Esc.
2. Dialog deep-dive: share dialog (slug input, visibility select, revoke),
   tailoring triage card, keyword bullet dialog, photo crop dialog (can a
   keyboard user crop at all? arrow keys?), template compare.
3. Undo bars (R320 delete, R321 cross-tab): reachable via keyboard/focus
   order, role="status" announced, actionable before timeout.
4. /jobs and /ats-checker keyboard operability spot checks (status selects,
   bulk actions, chips).
5. Focus visibility: every stop shows a visible focus ring in light + dark.

Deliverable: findings ranked P0–P3 (operability failures = P1/P2, missing
focus ring or awkward order = P3); fix the highest confirmed small finding in
the same round; otherwise log candidates to handoff.
