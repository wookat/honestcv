# R130 — Clearing a preview bullet deletes it (no ghost blank lines)

## Audit evidence (Rezi, public logged-in surfaces, 2026-08-31)

On Rezi's Finish Up preview each experience entry's bullet list is one
`contenteditable` `<ul>`; selecting a bullet's text and deleting it removes the
`<li>` from the list entirely — the resume data has no leftover empty row.

In RezUp (R127/R129) each bullet commits through `InlineText` `onCommit`, which
maps the new text into `bullets[i]`. Committing an empty string makes the bullet
disappear from the preview (it renders only `b.trim()` rows) **but leaves `''`
in the `bullets` array**, which the form textarea (`bullets.join('\n')`) shows
as a ghost blank line. First-hand repro: clear any experience bullet in the
preview → the Experience card's achievements textarea gains an empty line.

## Change (Builder-only, zero schema, zero deps)

In `ResumePreview` the experience bullet's `onCommit` deletes instead of
writing empties:

```ts
onCommit={(v) =>
  onEdit({
    ...resume,
    experience: resume.experience.map((x) =>
      x.id === e.id
        ? {
            ...x,
            bullets: v
              ? x.bullets.map((bb, bi) => (bi === i ? v : bb))
              : x.bullets.filter((_, bi) => bi !== i),
          }
        : x
    ),
  })}
```

- Non-empty commit: unchanged (replace in place).
- Empty commit (select-all + delete, then Enter/blur): the bullet is removed
  from the array — form and exports stay clean.
- `InlineText` itself is untouched (clearing stays valid for name/summary/etc.,
  where `''` is a legitimate value).
- Draft bullets (R129) already discard empties; unchanged.
- Share pages / dashboard thumbnails have no `onEdit`; unchanged.

## Acceptance

- Clear an existing preview bullet → bullet count drops by 1 in the form
  textarea; no blank line remains; reload persists.
- Editing a bullet to non-empty text still replaces in place.
- R129 Enter-chained draft entry unaffected; R125/R126/R127/R128 regressions
  green; 375px no horizontal overflow.
