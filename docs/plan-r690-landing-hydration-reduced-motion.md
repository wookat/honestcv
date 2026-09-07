# R690 — landing page throws React #418 and throws away its prerendered DOM for every `prefers-reduced-motion: reduce` visitor

## Evidence (`qa/r690-evidence2.cjs reduce|none [origin] [width]`, production `index-CJvoJ6UC.js`, `/`)

`/` is the only prerendered SPA route (`scripts/prerender.mjs` → `hydrateRoot`). Its two `ScoreRing`s (`score={86}`, `score={72}`) are rendered server-side by `useCountUp`, whose initial state is

```ts
useState(prefersReducedMotion() ? target : 0)
```

`window` is undefined on the server, so the prerendered HTML says `…font-bold">0<`. A visitor whose OS asks for reduced motion hydrates with `86` / `72` → text-node mismatch → React 19 reports a recoverable error (`reportError`, minified #418 "Hydration failed because the server rendered text didn't match the client…") and **client-renders the whole root again**.

Measured on production (init script marks the prerendered `<h1>` at `DOMContentLoaded`, MutationObserver counts `#root` child-list changes):

| media                       | `#418` | prerendered `<h1>` survives hydration | `#root` nodes removed / added | ring text at DCL → after |
| --------------------------- | ------ | ------------------------------------- | ----------------------------- | ------------------------ |
| none (1280)                 | 0      | yes                                   | 0 / 0                         | 0,0 → 86,72              |
| reduce (1280)               | **1**  | **no**                                | **3 / 1**                     | 0,0 → 86,72              |
| reduce (375)                | **1**  | **no**                                | **3 / 1**                     | 0,0 → 86,72              |

Deterministic across 5 runs; `/samples`, `/ats-checker`, `/builder`, `/dashboard`, `/pricing`, `/privacy` under the same emulation: 0 errors (they are client-rendered from the SPA shell, no hydration). Earlier audit nodes never saw it because none of them emulated `prefers-reduced-motion` and the error is a `pageerror`, not a `console.error`.

Why it matters: the prerender exists so first paint does not wait for JS; for reduced-motion users (an accessibility preference, WCAG 2.3.3) the page is painted, then discarded and rebuilt after the bundle runs — the opposite of what the prerender is for — and every such visit logs an uncaught error.

A second, latent mismatch sits next to it: `ScoreRing` initialises `drawn` to `prefersReducedMotion()`, so the arc's `stroke-dashoffset` attribute also differs from the server value under reduce. React does not patch attribute mismatches on hydration, and the effect early-returns under reduce, so once the text mismatch is fixed the arc would stay at the server value (empty ring) forever for those users. Both must move together.

## Fix (`src/lib/motion.ts`, `src/components/ScoreRing.tsx` only)

Hydrate with the server's values, then jump in an effect — the standard "same first render on server and client" rule:

```ts
// useCountUp
const [value, setValue] = useState(0)          // was: prefersReducedMotion() ? target : 0
useEffect(() => { … if (reduced || …) { setValue(target); return } … })   // unchanged

// ScoreRing
const [drawn, setDrawn] = useState(false)      // was: prefersReducedMotion()
useEffect(() => {                              // the `if (prefersReducedMotion()) return` branch is gone
  const id = requestAnimationFrame(() => setDrawn(true))
  return () => cancelAnimationFrame(id)
}, [score])
```

- reduce: server and client both render `0` and an undrawn arc → hydration succeeds → the effect sets `target` after mount and `drawn` on the next frame. The `transition: stroke-dashoffset 0.9s` inline style is overridden by the global `@media (prefers-reduced-motion: reduce) { * { transition-duration: 0.01ms !important } }` rule, so the arc snaps; the number changes once, no tween. (A synchronous `setDrawn(true)` inside the effect is rejected by `react-hooks/set-state-in-effect`, hence the shared rAF path.) One extra render on client-only mounts (builder / ATS checker), no visible difference.
- no preference: unchanged (initial `0` / `false`, tween + rAF exactly as before).
- forced-colors (R686) untouched.

## Verification

Local: `npx tsc -b --noEmit`, `npx eslint src/lib/motion.ts src/components/ScoreRing.tsx`, `git diff --check`, `npm run build` (re-prerenders `/`), `npm run verify-dist`.

Production (`qa/r690-evidence2.cjs`): reduce × 1280/375 → 0 errors, `<h1>` survives, 0 nodes removed, ring text `86`/`72`; none × 1280 → unchanged from before. Plus `qa/r690-ring.cjs`: under reduce the arc's `stroke-dashoffset` equals `c·(1−score/100)` (drawn), not `c`.

Not verified: a real OS-level reduce-motion setting (CDP media emulation only); Safari/Firefox hydration behaviour.
