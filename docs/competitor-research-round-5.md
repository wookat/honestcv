# Competitor Research Round 5 — Reactive Resume (firsthand, 2026-08)

Evidence categories: **observed**, **claim**, **inference**, **blocked**.

## Why this competitor
Reactive Resume (rxresu.me) is the leading free/open-source resume builder
(~40k GitHub stars shown live in its header — observed). It is the strongest
"truly free" alternative in the category and the closest philosophical
neighbor to HonestCV, so its free UX is the bar for anything we call free.

## Flow walked (observed)
Landing → register (name/username/email/password; social login via Google/
GitHub/LinkedIn/Passkey) → email verification explicitly **optional**
("This step is optional, but recommended") → dashboard → create resume
(name + URL slug + tags dialog) → builder → PDF export.

### Product shape (observed)
- Full builder with a three-panel layout: left = section forms, center =
  live paginated preview with zoom controls and undo/redo, right = template
  gallery + drag-and-drop page layout with a sidebar-width slider.
- Dashboard has Resumes, **Applications** (job tracking) and **Agents**
  sections; command palette (⌘K); grid/list views; sort/filter.
- Templates: ~15, Pokémon-named (Onyx, Pikachu, …), each with a preview
  image, a one-line description and **capability tag chips** ("Single-column",
  "ATS friendly", "Sidebar", "Technical", …) — good scanning UX.
- Public shareable resume URL per resume (rxresu.me/<username>/<slug>).
- Export dialog: PDF / DOCX / **Markdown** / JSON, plus a cover-letter tab.
- PDF export verified: real-text PDF, Producer "Reactive Resume",
  **no branding footer**, no payment or account-tier gate.
- Fully free: no pricing page, sponsor-funded, MIT-licensed (observed);
  self-hostable (claim/docs).

### Account/privacy model (observed/inference)
- Requires an account; resumes are stored server-side (public slug URLs
  imply server rendering/storage). Privacy model is "trust the open-source
  operator", not local-first. HonestCV's browser-local storage remains a
  structural difference even against the best free competitor.

### Tech notes (observed/inference)
- React SPA (Vite build artifacts), dark-mode-first UI, i18n language
  switcher, live GitHub-star counter. Server does PDF rendering
  (inference: identical pagination between preview and export, Producer tag).

## Adoptable ideas → gaps
- **G19 (adopted this round): template capability tags.** Added short fit
  tags to every HonestCV template; shown under each thumbnail on the landing
  gallery and as a description line under the picker in the builder.
- **G20 (candidate, P2): Markdown export** — trivial with our data model,
  useful for AI-tool workflows (Reactive Resume markets it exactly that way).
- **G21 (candidate, P2): command palette / keyboard-first navigation.**
- **G22 (noted, out of scope): public shareable resume URL** — conflicts
  with browser-local privacy unless designed as explicit opt-in upload;
  not adopted without an explicit product decision.

## Honest assessment
Reactive Resume is the most genuinely free product tested so far: no
branding, no paywalls, optional email verification, MIT-licensed. Its
weaknesses vs HonestCV: requires an account, stores resumes server-side,
no ATS/JD matching at all, and no guidance content. Our differentiators
against it are local-first privacy, the free ATS checker, and guides —
not price. AI features ("Agents") were not exercised (blocked/untested).
