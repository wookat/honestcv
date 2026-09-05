# R400 — one-click workspace backup & restore

## Evidence (source-verified)

The landing page promises "one-click JSON backup and restore" for a browser-local-first
product, and the dashboard header says "Everything is stored in this browser only — use
Backup in the editor to keep a file copy". But the editor's Backup button
(`Builder.tsx` toolbar) serializes **only the currently loaded `resume` object**.

Everything else is unrecoverable if the browser profile is cleared or the user switches
devices: saved copies (`honestcv.resumeVersions`), career documents
(`honestcv.careerDocs`), the job pipeline (`honestcv.jobPipeline`), share-link records
(tokens needed to revoke live links), the 11 content libraries, edit history, folders
state, saved samples. For a product whose whole persistence story is localStorage, the
advertised safety net covers a fraction of the user's data.

## Fix (minimal)

New `src/lib/workspace.ts`:

- `exportWorkspace(): string` — snapshot every `honestcv.*` localStorage key (raw
  string values, no re-parsing) into
  `{ format: 'rezup-workspace', version: 1, exportedAt, data: Record<key, value> }`.
- `parseWorkspaceBackup(raw): Record<string,string> | null` — accept only the format
  marker + string values under `honestcv.*` keys; otherwise null.
- `restoreWorkspace(data): boolean` — snapshot current workspace keys, remove them,
  write the backup's keys; on any quota throw, roll the snapshot back and return
  `false` (honest-storage invariant: never claim success for a failed write).
- Device-scoped/entitlement keys are excluded from both export and restore:
  `license`, `subscribed`, `shared`, `firstSeen`, `qa`, `ev.*` — a backup must not
  move entitlements between browsers or clobber this device's flags.

Dashboard header: replace the "use Backup in the editor" sentence with two inline
actions — **Back up** (downloads `rezup-workspace-backup.json`) and **Restore**
(file input → validate → confirm dialog "Replace everything in this browser?" →
`restoreWorkspace` → `window.location.reload()` on success; existing bottom
storage-full alert on failure; inline error for invalid files).

Builder's per-resume Backup/Restore stays unchanged (still useful for sharing a
single resume file).

## Non-goals

Cloud sync, auto-backup scheduling, cross-version migration logic (raw strings pass
through the existing read-side sanitizers), payment/entitlement transfer.

## Verification

- Local: `npx tsc -b`, `npx eslint src/lib/workspace.ts src/pages/Dashboard.tsx`, `npm run build`.
- Production QA: export with seeded copies/docs/pipeline/libraries → clear → restore →
  byte-identical workspace keys; excluded keys untouched; invalid file rejected;
  quota-failure path honest (storage refilled experiment); cancel keeps current data;
  375px light/dark; zero console errors; baseline restored.
