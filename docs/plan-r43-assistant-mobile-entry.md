# R43 — Mobile menu entry for the resume assistant

Date: 2026-08-30 · Round: R43 · Status: planned

## Gap

R42 gave the assistant a workspace entry, but only in `WorkspaceNav`, which is
hidden below `md`. The mobile hamburger menu (`SiteHeader`) — documented as
covering "the same destinations" as the sidebar — has Templates / Examples /
ATS Checker / Jobs / Pricing / My resumes / Resources, and no assistant entry.
On a phone the assistant is reachable only via the icon inside `/builder`.
Mobile parity is a hard acceptance criterion (company rule), and Rezi's agent
is equally reachable from its mobile navigation.

## Scope

`SiteHeader`'s mobile menu gains an "AI assistant" link to
`/builder?assistant=1` (React `Link`, closes the menu on click), next to
"My resumes". Desktop top nav unchanged — the workspace sidebar already covers
signed-in destinations there.

## QA (production, 375 primary + 1440 regression)

1. 375px: hamburger menu lists "AI assistant"; tapping it lands on /builder
   with the panel open full-width, URL cleaned, zero AI calls.
2. Menu item ≥40px touch target; menu closes on navigation.
3. 1440px: top nav unchanged; R42 sidebar entry still present.
4. Console clean; localStorage restored.
