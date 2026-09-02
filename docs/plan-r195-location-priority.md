# R195 — Location filter prioritizes instead of hiding location-agnostic remote jobs

## First-party evidence

Rezi public changelog, August 18, 2026 (Rezi Web App): "Smarter Job Location Search —
When searching for jobs, your location preferences are now prioritized based on your
specific input, ensuring you see the most relevant results faster."

## Current gap

Our /jobs location input is a hard substring filter:

```ts
afterExclude.filter((j) => j.location.toLowerCase().includes(loc))
```

Typing `Europe` hides every job whose location is `Worldwide`, `Anywhere`, `Global`,
etc. — jobs the user is fully eligible for. The filter silently throws away relevant
results instead of prioritizing the user's preference, the exact behavior Rezi's entry
describes fixing.

## Design (local-first, deterministic, zero AI/schema)

When the location input is non-empty on the All tab, partition instead of filter:

1. **Direct matches** — location contains the input (case-insensitive) — listed first.
2. **Open to any location** — location matches an agnostic allowlist
   (`worldwide`, `anywhere`, `global`, `remote` as whole match, or empty) — listed
   after, under a one-line muted divider `Open to any location (n)` inside the list.
3. Jobs pinned to *other* regions stay excluded (genuinely irrelevant).

The active sort (relevance/newest/best match) applies within each group independently
so direct matches always stay on top. Empty location input: unchanged single list.
Status tabs: unchanged (no location input there).

## Non-goals

No API/Worker change, no persisted preference, no geo lookup, no AI, no schema.

## Acceptance

- `Europe` shows Europe-located jobs first, then divider + Worldwide/Anywhere jobs;
  a job pinned to `USA` is absent.
- Divider shows the correct count; no divider when either group is empty.
- Sort toggles reorder within groups without mixing them.
- Clearing the input restores the old single list; no divider on status tabs.
- 1440 + 375px, dark mode, no horizontal overflow.
- R188–R194 pipeline features regression-free; zero AI quota during QA.
