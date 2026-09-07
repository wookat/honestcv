# R490 — cold-load /dashboard#samples deep link never scrolls to the section

## Evidence (production CDP, index-HoWXKVqc.js)

- Fresh tab, cold load of `https://cv.zalize.com/dashboard#samples`: page settles with
  `scrollY=0` forever (sampled every 250–300ms for 7s) while `#samples` sits at 901px.
  A `scrollIntoView` interceptor installed at ~300ms recorded **zero calls** — the scroll
  never happens, it isn't merely undone.
- Same-document hash changes on an already-loaded dashboard scroll correctly
  (verified in R489 QA: y 0→445).
- First flagged as a pre-existing P3 during R489 production QA.

## Root cause

`Dashboard.tsx` scrolls to the hash in a mount effect with deps `[hash]`:

```tsx
useEffect(() => {
  if (hash) document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
}, [hash])
```

But the `#samples` heading only renders once the async `examples.json` fetch resolves
(`{section !== 'documents' && examples.length > 0 && ( … <h2 id="samples"> … )}`).
On a cold load the effect fires before the fetch completes, `querySelector` returns
`null`, and — since `hash` never changes — the effect never re-runs. The browser's
native hash scroll also can't help: the anchor doesn't exist at document load.

## Fix (smallest change)

Re-run the hash-scroll effect when the samples data state settles:

```tsx
}, [hash, examplesState])
```

and move the effect below the `examplesState` declaration. When the target already
exists (same-document hash click, `#documents`) behavior is unchanged; when it mounts
late, the `'loading' → 'ready'` transition re-runs the effect and the deep link lands
on the section. No scroll occurs without a hash, so normal dashboard loads are untouched.

## Non-goals

- No change to App-level `ScrollReset` (R489) — initial loads are POP and stay untouched.
- No generic polling/MutationObserver machinery.
- No change to `/documents`, `/samples` first-class routes.

## QA

- Cold fresh-tab load of `/dashboard#samples` scrolls to the Sample library heading.
- Cold load of `/dashboard#documents` still scrolls (target exists immediately).
- Same-document hash navigation regression.
- Cold `/dashboard` (no hash) does not scroll.
- R489 push-nav scroll reset + POP restoration regression.
- 375px light/dark, zero console errors, no unsafe traffic, state restored.
