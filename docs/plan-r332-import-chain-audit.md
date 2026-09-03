# R332 — exploratory production audit: import → builder golden path

## Why this surface

Rezi's public flow starts by importing an existing resume (upload / LinkedIn)
and the app's own golden path relies on the same chain. Our last deep walks of
this chain were R297 (marker-less line mapping) and R303 (scan-only PDF
guards, upload faces only). Since then R322/R323 rewrote inline preview
internals, R330 added the /ats-checker session draft with a router-state
hand-off from the Landing hero drop zone, and R331 changed keyword
extraction — none audited end-to-end as one chain.

## Scope (production, zero AI, screenshots as evidence)

1. Landing hero drop with a real text PDF → /ats-checker hand-off (state wins
   over draft, R330) → report sane under R331 extraction.
2. Builder import dialog: PDF and DOCX import → parsed sections land in the
   editor → inline preview edit (R322/R323 paths) → score updates → export
   PDF/DOCX round-trip retains imported content.
3. LinkedIn import entry (R299) reachable and functional to the paste step.
4. Negative: scan-only PDF and unsupported type guards still correct (R303).
5. 375 strict + dark mode on the import dialog and imported builder state;
   baselines restored.

Findings feed the next round; P0/P1 fixed in-round per SOP.
