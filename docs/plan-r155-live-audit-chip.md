# R155 — live audit chip on expanded entry cards

## Rezi first-hand observation (2026-08-31, app.rezi.ai)

On the Experience editor page (`/dashboard/resume/<id>/experience`) Rezi shows the
per-entry audit checklist **persistently while the entry form is open and being
edited**: the left sidebar lists Weak Bullet Points, Dates are missing, Number of
Bullet Points, Quantified Bullet Points, "3 best practices applied", etc., and the
items update live as the user types in the form. The audit is not gated behind a
collapsed/summary state.

## RezUp today

R148–R150 added the Rezi-style audit chip (⚠ N / green ✓) with a grouped popover
of named checks, per-line references, explanations and passed-check names — but
the chip renders **only on collapsed entry cards** (`collapsedEntries.has(id)`).
While a card is expanded (i.e. exactly while the user is editing and the feedback
is most actionable) there is no entry-level audit summary; only the per-line
bullet lint under the textarea remains.

## R155 change

Render `EntryAuditChip` on Experience / Education / Projects entry headers in both
states:

- collapsed: unchanged — warning chip is a button, click/pointerdown expands the card.
- expanded (new): same chip + same hover/focus popover, but the warning chip is a
  non-button focusable span (like the green ✓ chip) since there is nothing to
  expand; findings recompute live from current field values as the user types.

Implementation: drop the `collapsedEntries.has(...)` gate around the three
`EntryAuditChip` usages and add an `expandable` flag to the component that picks
button vs. span rendering for the warning state. No schema, storage, state,
dependency or scoring changes; audit logic (`bulletFindings`, `DATE_FINDING`,
`*_CHECKS`, `AUDIT_EXPLANATION`) untouched.

## Acceptance (production, 1600 + 375)

- Expanded role/education/project with issues shows ⚠ N chip in the header; hover
  or keyboard focus opens the same grouped popover; chip count updates live while
  typing (e.g. adding a date removes "Dates are missing").
- Clean filled expanded entry shows the green ✓ chip with named passed checks.
- Collapsed behaviour unchanged (chip click still expands the card) — R148–R150
  regression.
- 375px: popover still uses the fixed bottom sheet placement, no page-level
  horizontal overflow, chip focusable with 40px-adjacent touch behaviour as today.
