# R358 — SOP-10 audit round: numbered duplicate names + wizard skips the already-answered role question

## Evidence (first-hand, R358 SOP-10 production audit on cv.zalize.com, bundle index-BQNfD2pg.js)
Four-dimension audit (console/operability, feature depth vs Rezi, landing/static UI at
375/768/1440 + dark, architecture: refresh/deep links/back-forward/slow-network AI) found
zero P0–P2. All D1–D4 chains passed: 12-copy dashboard management, rename/folder/undo,
assistant quick tasks (local + mocked AI), ATS checker with a real PDF fixture, deep links
`?assistant=1`/`?doc=cover`, hard-reload persistence, paused-fetch busy state with zero
duplicate requests. Two P3s were confirmed:

1. **Duplicate names compound unboundedly.** `duplicateResumeVersion()` appends
   ` (copy)` to the source name, so duplicating a duplicate yields
   `Product Manager (copy) (copy) … (copy)` (observed ×11 at 12 copies) — list,
   aria-labels and undo bars become unreadable. Rezi numbers copies instead.
2. **Builder first-run wizard double-asks the target role.** Creating a resume from the
   dashboard dialog with role "Product Manager" (+ company) persists
   `resume.targetRole`, yet the /builder wizard still opens at Step 1 asking
   "What job are you targeting?" again, and its focus-trapped input makes typing
   appear to go nowhere for a first-time user.

## Design (minimal)
1. `src/lib/resume.ts` — `duplicateResumeVersion()`: derive the base name by stripping a
   single trailing ` (copy)` / ` (N)` suffix, then pick the lowest `${base} (n)`, n ≥ 2,
   not already taken by an existing version name. Duplicating "X" → "X (2)";
   duplicating "X (2)" → "X (3)" (or next free number). No migration of existing names.
2. `src/pages/Builder.tsx` — initialize wizard state from the loaded resume:
   `wizardStep` starts at 2 when `resume.targetRole` is already set (the role question
   was answered in the dashboard dialog), and `wizardRole`/`wizardLevel` prefill from
   `resume.targetRole`/`resume.experienceLevel` so Step-2 example sorting and the Back
   path show the real values instead of blanks.

Non-goals: no rename-on-duplicate prompt, no changes to the wizard's open guards
(setupDone/tourDone/shared/?example=/non-empty draft, R350), no dashboard dialog changes.

## Validation
- Oracle: duplicate naming — X→X (2), X (2)→X (3), gap filling, legacy "(copy)" strip,
  name-collision skip.
- tsc / targeted eslint / build; deploy; independent live-bundle check.
- Production QA (testing agent, zero AI): duplicate chain names numbered; dashboard-created
  resume with a role lands in the wizard at Step 2 (no repeated role question), Back shows
  the prefilled role/level; R350 guards regression; 375 strict + dark; baseline restore.
