# R150 — Per-check explanations and named passed checks in the entry audit popover

## First-hand Rezi evidence (2026-08-31, public Experience editor)

On app.rezi.ai's Experience page, the per-entry audit list (observed R148/R149) does more than
name each check:

- Every failed check carries a short, actionable explanation, e.g. Weak Bullet Points explains
  that weak verbs like "worked, was" should be replaced with an action verb; "Dates are missing"
  explains why recruiters need dates; "Number of Bullet Points" says 3–6 are expected and how
  many were found; "Quantified Bullet Points" points at the specific bullet to fix.
  (Explanations are collapsed by default and revealed per check.)
- The green "3 best practices applied" row is itself expandable (aria-expanded) — the passing
  checks are named, not just counted.

## Gap in RezUp after R149

The R149 grouped popover names failed categories with line numbers and shows a green rollup,
but:

1. Failed rows have no explanation — a user who doesn't know what "Passive voice" or
   "Bullet length" means gets no guidance until they expand the card and read per-line hints.
2. The green rollup is only a count ("✓ 7 best practices applied") — it never says *which*
   practices passed, so the clean ✓ chip conveys nothing verifiable.

## Design

All within `EntryAuditChip` in `src/pages/Builder.tsx`; no new heuristics, rules, schema,
storage, or dependencies. Explanation copy is our own wording (no Rezi copy).

1. `AUDIT_EXPLANATION: Record<string, string>` — one short sentence per category
   (all 8 bullet categories + "Number of bullet points" + "Dates are missing").
2. `checks` prop changes from a count (`number`) to the ordered list of applicable category
   names (`string[]`):
   - Experience: `['Number of bullet points', 'Dates are missing', ...BULLET_CATEGORIES]` (10)
   - Education: `['Dates are missing']` (1)
   - Projects: `BULLET_CATEGORIES` (8)
   `BULLET_CATEGORIES` is the ordered unique list behind the old `BULLET_CHECKS = 8`.
3. Popover rendering:
   - each failed row keeps "⚠ Category — line(s) N" and gains a muted explanation line below;
   - the green rollup keeps "✓ N best practice(s) applied" and gains a muted line naming the
     passed categories (`checks` minus failed), comma-separated.
4. Panel width at `sm+` widens `w-56 → w-64` for the extra text; the `<sm` bottom-docked
   variant (R149 final) is unchanged (`fixed inset-x-4 bottom-20 z-40`).
5. Rollup math becomes exact by construction: passed = applicable names minus failed names
   (previously `checks − groups.size` clamped at 0).

Unchanged: chip visuals/count, click-to-expand, keyboard focus/hover trigger, clean ✓ chip,
export/preview/ATS/share, Projects still exclude the 3–6 count check.

## QA (production, 1440 + 375)

1. Experience with mixed issues: each failed row shows its explanation; passed line names
   exactly the categories not failed; count matches the named list length.
2. Clean Experience ✓ chip: popover lists all 10 applicable practices by name.
3. Education: failed = only "Dates are missing" + its explanation; clean = names the single check.
4. Projects: no "Number of bullet points" row/name anywhere; passed list drawn from the 8
   bullet categories.
5. 375px: bottom-docked panel still fully visible above the Edit/Preview tab bar with the
   longer content; tap still expands the card.
6. Regressions: R149 grouping/line numbers, R126 collapse, hidden badge coexistence.
