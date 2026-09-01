# R132 — Saved + Recent filters in the template picker

## Audit evidence (Rezi, public logged-in surfaces, 2026-08-31)

Rezi's "Template" dialog on Finish Up organizes its gallery with a left nav:
**All templates / Saved (count) / Recent / Recommended (count)** plus "By
Format" chips (Simple/Modern/Creative/Compact). Users can save favorites and
jump back to recently used templates.

RezUp's Builder picker has 22 templates behind style chips only
(`TEMPLATE_FILTERS`: All/Serif/Modern sans/Banded headings/Minimal). With that
many thumbnails there is no way to shortlist favorites or return to a template
you tried a minute ago — you re-scan the whole strip.

## Change (Builder-only, zero Resume schema, zero deps)

New module `src/lib/templatePrefs.ts` — local-first persistence:

```ts
const FAV_KEY = 'honestcv.templateFavorites'   // string[] of template ids
const RECENT_KEY = 'honestcv.templateRecents'  // string[], most-recent-first, cap 6

loadTemplateFavorites(): string[]
toggleTemplateFavorite(id): string[]      // persists + returns next list
loadTemplateRecents(): string[]
recordTemplateRecent(id): string[]        // dedupe to front, cap 6, persists
```

Builder picker:
- Two new chips in the filter row — `Saved (n)` and `Recent` — appended after
  the style chips; states held in React alongside `templateFilter`. `Saved`
  chip hidden count-0 style: still shown (with `0`) so the feature is
  discoverable, matching Rezi.
- Filtering: `saved` → templates whose id is favorited (ordered as in
  TEMPLATES); `recent` → recents order, most recent first.
- Each thumbnail gets a small star toggle (top-right overlay button,
  `aria-pressed`, click `stopPropagation` so starring doesn't select).
- Selecting a template calls `recordTemplateRecent(t.id)` (also record the
  currently active template id on mount? No — only explicit picks, so the
  list reflects deliberate history).

Not stored in `Resume`, so share/export/versions and cloud sync are
untouched. Sanitizers unchanged.

## Acceptance

- Star a template → appears under `Saved (1)`; unstar removes; survives reload.
- Pick templates A then B → `Recent` lists B, A; capped at 6; survives reload.
- Starring never changes the active template.
- Style chips unchanged; ATS/preview unaffected; share page untouched.
- R125–R131 regressions green; 375px picker usable, no horizontal overflow.
