# R534 — ATS structure checks "Fix →" lands on the offending entry card

## First-hand production evidence (2026-08-31, cv.zalize.com, CDP 375×812)

- `/builder?example=software-engineer` → mobile "Preview & score" pane.
- Score card, ATS structure checks list shows:
  `✗ 3–6 bullet points per role — "Software Engineer at Cardinal Apps" has 2 bullet points … Fix →`
- Clicking that `Fix →` switches to the Edit pane but lands on the top of the
  Experience section (Role 1 — Brightpath Logistics, `scrollY=1373`); the
  Cardinal Apps card sits off-screen at viewport top 944px. The user must hunt
  through the roles the check already identified.

Also verified this round (rejected candidates / non-defects):
- `/documents` mobile long list: open/close document dialog preserves list
  scroll (900→900), zero console errors — not a defect.
- `/ats-checker` mobile: report scrolls into view after Check — not a defect.
- Builder mobile bottom switcher does not overlap any interactive content.
- 7 routes × 1280/375: zero overflow, zero console errors.

## Root cause

`src/pages/Builder.tsx` score-card checks list (`rows.map((c) => …)`) wires
`Fix →` to `jumpToSection(c.anchor)` only, ignoring `c.entryId` — the field
`bulletsPerEntryCheck` populates with the offending entry's id (added for the
health report in R359, where `jumpEntry(f.entryId)` is already used).
`jumpToEntry(id)` exists in the same component scope (expands a collapsed card,
scrolls it to center, focuses and ring-flashes it) but is never used here.

## Minimal fix

In the checks-list `Fix →` onClick, prefer the offending entry:

```tsx
onClick={() =>
  c.entryId ? jumpToEntry(c.entryId) : c.anchor && jumpToSection(c.anchor)
}
```

No changes to `ats.ts`, anchors, deep links, the health-report dialog, or the
/ats-checker page (pasted text has no entry ids — section anchors remain
correct there).

## Must not change

- Section-anchor jumps for checks without `entryId`.
- `?jump=` deep-link behavior and JUMP_ANCHORS validation (R443).
- Health report `Fix →` entry jumps (R359) and score-dialog jumps.
- R533 per-pane scroll restore; desktop layout.

## QA plan (production, after deploy)

1. 375px: example resume → Preview & score → bullet-count `Fix →` lands on the
   Cardinal Apps card (focused + flashed), Edit pane active.
2. A section-level failing check's `Fix →` still jumps to its section.
3. 1280px: same entry jump works with both columns visible.
4. `?jump=skills` deep link regression.
5. Zero overflow, zero console errors, storage back to baseline keys.
