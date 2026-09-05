# R405 — replace the remaining native confirm close-guards with styled dialogs

## Evidence

R403 removed the two native `window.confirm` *replace* guards; a source sweep
(`window.confirm|alert|prompt` over src) shows four remaining call sites, all
close-guards on unsaved work inside existing styled Dialogs:

1. `Builder.tsx` ~9884 — tool dialog (cover/resignation/interview) close with
   unsaved work (R333 semantics): two message variants (interview session vs
   unsaved letter).
2. `Builder.tsx` ~10612 — tailoring dialog close while a request is running
   ("close and discard its results?").
3. `Builder.tsx` ~10617 — tailoring dialog close with unreviewed suggestions
   (R344 semantics: "Getting them again will use another AI request.").
4. `Dashboard.tsx` ~2113 — document viewer close with unsaved edits (R364
   semantics).

Same problems R403 established: native chrome inconsistent with the app's
styled guards, and a renderer-blocking prompt that wedges embedded/headless
environments (QA-proven 100% CPU pin without a dialog handler).

## Fix

Same pattern as R403 — move the decision into React state and a nested styled
`Dialog` (Radix portals stack fine):

- Tool dialog: `confirmingClose` boolean; `requestClose` sets it when
  `unsavedWork`, else closes. Nested Dialog: title/description per kind
  (interview vs letter), buttons "Keep working" (outline) / "Discard and
  close" (destructive → `onClose()`).
- Tailoring dialog: `confirmingClose: 'busy' | 'pending' | null` set from
  `onOpenChange`; nested Dialog renders the matching copy (busy: request
  still running; pending: N unreviewed suggestions + AI-request cost),
  buttons "Keep reviewing" / "Discard suggestions".
- Doc viewer: `confirmingClose` boolean; close attempt with
  `docText !== openDoc.text` prompts; buttons "Keep editing" / "Discard
  changes" (destructive → close + clear signature error).

Cancel/Esc/outside-click on the nested confirm = stay, zero writes. Confirm =
exactly the old confirm-true path. No storage, autosave, or AI behavior
changes.

## Verify

Local: tsc / eslint / build. Production QA: each guard — no unsaved work
closes immediately; with unsaved work the styled dialog appears (zero
`Page.javascriptDialogOpening`); Cancel keeps the parent dialog and state
intact (byte-level storage assertion); Confirm discards exactly as before;
tailoring both branches (busy via slow-mocked AI, pending via mocked
suggestions); keyboard Esc/Tab/Enter; 375px light/dark; zero console errors;
baseline restore; zero AI/lead/share/payment escapes.
