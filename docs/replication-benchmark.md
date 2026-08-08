# Replication benchmark — Resume.io (1:1 还原度对照表)

Date: 2026-08-05 · Benchmark: **Resume.io** (chosen over Rezi: its guest builder at
`/app/guest-builder` is fully walkable without an account; Rezi requires signup before
the editor). All observations are first-hand from a real browser walk-through at
1440×900 and 375×812 (evidence: `/home/ubuntu/rio-capture/*.png|.json` in the work VM;
key screenshots attached to the PR). We replicate structure/interaction/experience
patterns with our own implementation — no closed-source code, copyrighted imagery,
fonts, trademarks, or verbatim copy is reproduced.

## Methodology & access limits

- Public pages: landing, /resume-templates, /resume-examples, /pricing — fully accessible.
- App: template chooser (`/app/create-resume/templates`) and guest builder
  (`/app/guest-builder`) — accessible without login; export requires signup (email gate),
  so their post-signup download UX is **not observed** and excluded from scoring.
- No bot wall was encountered; no anti-crawling was bypassed.
- Scores are our replication level of the *pattern* (not pixel identity): 100% = we have
  an equivalent-or-better implementation of the user value; gaps note what's missing.

## Page/flow comparison

| # | Resume.io page/flow (observed) | Pattern observed | HonestCV today | Score | Gap / priority |
|---|---|---|---|---|---|
| 1 | Landing hero | Benefit-led H1, dual CTAs (Create / Upload), trust strip, product mock with score badge | Landing hero with dual CTAs (Build / Check ATS score), 3-step narrative, template gallery | 95% | We don't show fabricated stats (deliberate); trust strip = honest positioning instead. No gap to fix. |
| 2 | Template chooser | Category filter chips (All/Word/Simple/Picture/ATS/Two-column…), large previews, PDF/DOCX badges, color swatches per card, hover "Use this template", Skip | Style filter chips (All/Serif/Modern sans/Banded/Minimal), 22 thumbs, accent swatches in builder, deep links | 90% | No per-card export-format badges (all our templates export PDF+DOCX+TXT+MD equally, so the badge carries no signal). P2, skipped as noise. |
| 3 | Start modal | "How do you want to start?" — Create new / Upload existing | Builder empty state offers example resume + Upload PDF/DOCX import | 100% | Equivalent (import + example). |
| 4 | Editor: resume score | Persistent "Your resume score N%" bar with **next-action chip** ("+5% Add email") | Resume strength meter with % + "Next: …" missing-item chips + full 6-dimension health report | 100% | Ours goes deeper (health report). |
| 5 | Editor: wizard steps | "Next: Professional Experience" stepped form; job-title autocomplete; benefit microcopy | Single scrollable form with sections, drag-reorder, bullet starter library, role-based skill chips | 90% | No stepped wizard — deliberate: one-page form + sticky preview is faster for edit-heavy use; our checklist onboarding covers first-run guidance. No autocomplete for job title (P2). |
| 6 | Editor: live preview | Right-pane live preview, page indicator "1 / 1", Change design shortcut | Live preview, PDF page-count indicator, template picker in-page | 100% | Equivalent. |
| 7 | Customize → Template & Colors | Template grid + main-color swatches + filter chips | Template thumbs + 8 accent swatches (aria-pressed) | 100% | Equivalent. |
| 8 | Customize → Text | Primary font, **Line Height (%), Font Size (S/M/L)** | *(before this batch)* none — fixed 11px/1.35 | **was 40%** | **P0 — fixed in this batch**: Text size S/M/L + line spacing Compact/Normal/Relaxed, applied consistently to preview, PDF and DOCX. Font family stays template-driven (ATS-safe standard fonts). |
| 9 | Customize → Layout | Page format A4/Letter, margins, date format, header/date/location alignment, skills columns, education layout | Letter/A4 toggle, section drag-reorder, custom sections | 75% | Margin/date-format/alignment micro-controls: P2 — each option multiplies export QA surface; deferred until user demand. Section reorder (ours) is the higher-value layout control they lack in guest mode. |
| 10 | Mobile editor (375px) | Preview-first, expand FAB, **sticky bottom bar: Customize + Download** | Form-first, floating "Preview" jump FAB, downloads at preview | 85% | Sticky bottom download bar: P2 (our download flow includes format choice + email gate; a bar duplicating it risks confusion — revisit with real mobile usage data). |
| 11 | Templates marketing page | Category tabs, large previews, SEO copy | /templates/ hub + 22 pSEO pages with SVG previews | 100% | Equivalent. |
| 12 | Examples page | Role-based example hub | /guides/ hub (27 guides) + bullet starter library in-product | 90% | No per-role full example resumes; partially covered by role bullet starters + example resume. P2 backlog (pSEO candidates). |
| 13 | Pricing | Subscription ($2.95 trial → $29.95/4wk auto-renew) revealed late | Beta free trial with future one-time prices shown upfront | 100% | Deliberate anti-pattern rejection: no trial-to-subscription trap. |

**Baseline after this batch: 13/13 flows ≥75%, all P0/P1 gaps closed** (item 8 fixed; items
5/9/10/12 documented P2s with reasons — pattern-level parity where the pattern serves users,
deliberate divergence where it doesn't).

## 超越项 (where we exceed the benchmark)

1. **Privacy architecture**: browser-local data, no account required for full flow including export — Resume.io requires signup to download.
2. **Honest AI**: anti-fabrication constraints + per-line accept/reject AI Tailor; their guest flow exposes no AI editing.
3. **Free browser-side ATS score + keyword highlighting** (observed only as a marketing badge on their landing).
4. **Six-dimension health report** with plain-language explainers vs a single % score.
5. **More export formats**: PDF, DOCX, TXT, Markdown, JSON backup/restore.
6. **Per-job resume copies with per-copy ATS score**; honest pricing (no auto-renew trap).

## Deep optimizations from the walk-through (this batch)

1. **Text size (S/M/L) + line spacing (Compact/Normal/Relaxed)** — Customize→Text
   parity, implemented once and applied uniformly to live preview, PDF (pdf-lib size &
   line-height multipliers) and DOCX (half-point scaling + `w:spacing` line rule), so
   what you see is exactly what exports. Their preview and export are separate renderers;
   ours share one setting source.
2. **Compact spacing as a one-page rescue tool**: combined with our live PDF page-count
   indicator, users who overflow to 2 pages can drop to S/Compact and watch the counter
   return to 1 — a workflow resume.io's guest mode doesn't close (no page counter in form view).
