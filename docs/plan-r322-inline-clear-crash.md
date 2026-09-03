# R322 — exploratory audit: inline preview editing chain + P1 clear-bullet crash fix

## Audit scope (production, bundle index-BEn8R3EI.js / Builder-Diz-5o8M.js, zero AI)

Deep-walk of the Builder inline live-preview editing chain (last audited ~R191):
round-trips for summary/bullets/headlines/contact/skills/custom sections, heading
rename, Enter-to-append draft bullet (R129/R133), clear-to-delete (R130), marks
integrity + Ctrl/Cmd+B (R281), toolbar undo/redo, R321 cross-tab bar interplay,
grouped roles (R161), template switch, keyword highlight (R231), 375px strict,
dark mode. All green except one finding.

## Confirmed P1 (100% repro on production)

Clearing an existing preview bullet (click bullet → select all → Backspace →
blur) throws `NotFoundError: Failed to execute 'removeChild' on 'Node'` and
unmounts the whole app (white screen); the bullet is NOT deleted. The R130
delete-by-clearing contract fails and the user loses the session until reload.

Root cause: `InlineText` is a `contentEditable` span whose children the user's
typing mutates behind React's back. On an empty commit the parent filters the
bullet out of an index-keyed list, so React reconciles the *same* `<li>` in
place with the next bullet's text and tries to update/remove text nodes that
the select-all + Backspace already destroyed → `removeChild` on a detached
node → crash. (Non-empty commits usually survive because typing mutates the
existing text node instead of removing it.)

## Fix (one line + comment, ResumePreview.tsx)

Give the editable span `key={shown}` so any committed value change remounts the
span instead of reconciling its mutated children:

```tsx
<span
  key={shown}          // remount on value change — never diff user-mutated children
  contentEditable ...>
  <MarkedText text={shown} />
</span>
```

Unmounting only removes the untouched host `<span>` from the React-managed
`<li>`, which always succeeds. Centralized in `InlineText`, so every inline
preview field (bullets, headlines, contact, skills, custom sections) is covered.
No behavior change otherwise: Escape revert and equal-value blur keep using
`restoreMarkedDom`; commit semantics, focus flow, and `DraftBullet` untouched.

## Validation

- `npx tsc -b`, eslint on ResumePreview.tsx, `npm run build`.
- Production QA: exact P1 repro (select-all + Backspace + blur) now deletes the
  bullet, no console exception, app stays mounted; regression of inline edit
  round-trips, Enter-to-append, marks rendering after edits, undo/redo of a
  bullet deletion; 375 strict; baseline restore.
