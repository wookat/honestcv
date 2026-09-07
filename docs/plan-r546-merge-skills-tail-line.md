# R546 — mergeSkills grows the uncategorized tail line instead of one line per add

## Production evidence (CDP, 1280×900, fresh storage, 2026-08-31)
Seed categorized skills:

```
Languages: python, golang
Tools: docker
```

with JD containing `kubernetes … scalable`. Tap `+ kubernetes`, then `+ scalable`
(Target panel chips, post-R545 mergeSkills path). Resulting skills:

```
Languages: python, golang
Tools: docker
kubernetes
scalable
```

Every one-tap add creates its own bare line: N taps → N uncategorized single-item
lines. The preview renders each as a separate skills row, and the block sprawls with
orphan lines. (The `Skills grouped into categories` best-practice check still passes
because `skillLines` finds labeled lines — no false ✗, but the block is visibly messy.)

Root cause: `mergeSkills()` (src/lib/resume.ts) always appends fresh items as a new
line for multi-line/labeled blocks — it never looks at whether the last line is
already a plain unlabeled tail it could grow.

## Fix (smallest change)
In `mergeSkills` only: when the block is multi-line/labeled and its **last line is a
plain unlabeled line**, append fresh items to that line instead of adding a new one.
Labeled last lines keep the current new-line behavior (never pollute a category).

```ts
const last = lines[lines.length - 1]
if (!/^[^:]{1,40}:\s*.+$/.test(last))
  return [...lines.slice(0, -1), `${last}, ${fresh.join(', ')}`].join('\n')
return [...lines, fresh.join(', ')].join('\n')
```

All callers (five chip paths from R545 + assistant @@APPLY) benefit with zero call-site
changes.

## Non-goals
- No auto-categorization of added keywords.
- No changes to ats.ts, scoring, chip UI, or dedupe.
- No changes to the plain single-line grow-in-place or empty-block behaviors.

## Validation
tsc, eslint (changed file), build, verify-dist; deploy; production QA at 375×812 and
1280×900: two sequential adds land on one shared tail line; categorized lines
untouched; plain single-line behavior unchanged; zero overflow; storage cleaned.
