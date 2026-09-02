# R230 — "Show in editor" on assistant proposal cards

## First-party evidence

- Rezi AI Resume Agent guide (https://www.rezi.ai/rezi-docs/ai-resume-agent):
  - "Instead of giving broad advice, it points to specific resume sections and
    explains what you can improve."
  - "you can review the suggestions while editing your resume side-by-side. So,
    there's no jumping between multiple tabs or trying to remember the feedback."
  - Suggested follow-up prompt: "Can you show me exactly where to apply these
    changes?"
  - Summary: "Feedback appears alongside your resume, making it easy to apply
    edits without constantly switching tabs or documents."

## Gap

HonestCV's assistant proposal cards (summary / skills / bullet append / bullet
rewrite, R227–R229) name the target ("Proposed rewrite · Junior Developer at
Nova Retail") but offer no way to see that spot in the editor. The user must
manually scroll a long edit column to find the entry before or after applying.
The Builder already has the R204 jump infra (`jumpToSection(anchor)` with
smooth scroll + `jumpToEntry(id)` with ring flash) — the assistant just doesn't
use it.

## Design (client-only; no worker, schema, or scoring change)

### AssistantPanel

- New optional prop `onLocate?: (action: AssistantAction) => void`.
- Each proposal card gets a small ghost "Show in editor" button (MapPin icon),
  rendered both before Apply (next to the Apply button) and after Apply (next
  to the "Applied to your resume" line). Clicking calls `onLocate(t.action)`.
- Rendered only when `onLocate` is provided. No other card change.

### Builder

- Pass `onLocate` to `<AssistantPanel>`:
  - `summary` → `jumpToSection('summary')`
  - `skills` → `jumpToSection('skills')`
  - `bullet` → resolve the target experience entry with the exact same logic
    as `onApply` (visible entries, case-insensitive two-way substring match on
    company/role, fallback to first visible); found → `jumpToEntry(target.id)`
    (ring flash); no visible entries → `jumpToSection('experience')`.
- On mobile the panel overlays the whole page (`w-full` under `sm`), so when
  `window.innerWidth < 640` the panel is closed first (same `onClose` the
  header X uses); on ≥sm the 420px side panel stays open — true side-by-side.

## Invariants

- Apply semantics (R227 append, R228 in-place rewrite, summary, skills)
  unchanged; "Show in editor" never mutates the resume.
- `honestcv.assistantChat` schema unchanged (no new persisted field).
- ATS scoring, check counts, readiness strip, Fixed chips unchanged.
- No AI calls involved; fully testable with injected chat turns.

## Acceptance

1. A bullet card's "Show in editor" scrolls the matching experience entry into
   view with the ring flash, both pre-apply and post-apply; resume unchanged.
2. Summary and skills cards jump to their sections.
3. Non-matching entry falls back to the first visible entry; no visible
   entries falls back to the Experience section without error.
4. At 375px the panel closes on locate and the target is visible; at 1440px
   the panel stays open (side-by-side per Rezi).
5. Apply buttons still work exactly as R227–R229; Applied cards persist.
6. Dark mode: button meets contrast; 375px card has no overflow.
7. Zero AI generation calls; localStorage cleanup exact baseline.
