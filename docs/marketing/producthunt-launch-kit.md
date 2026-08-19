# Product Hunt launch kit

Needs the boss's real PH account (maker profile). Recommended timing: Tuesday
–Thursday, 12:01 AM PT. Have the payment rails decision made first (either
launch as "beta free trial" honestly, or after payments are live).

## Listing

- **Name:** RezUp
- **Tagline (≤60):** The resume builder with no subscription traps
- **Topics:** Career, Productivity, Artificial Intelligence
- **Links:** https://cv.zalize.com · free ATS checker https://cv.zalize.com/ats-checker
- **Description:** RezUp is a browser-local resume builder: 22 ATS-safe
  templates, a free ATS match score against any pasted job description,
  per-line AI tailoring that never invents your experience, and real text
  PDF/DOCX export. No account — your resume stays in your browser. No
  subscription — one-time pricing, fully free during beta.

## Gallery (prepare 5 images, 1270×760)

1. Landing hero + three-step narrative
2. Builder with example resume + live preview
3. ATS checker score with matched/missing keywords highlighted in the JD
4. AI Tailor diff view (original vs suggestion, Accept/Keep buttons)
5. Template gallery grid (22 templates, style filters)

## Maker comment (post immediately after launch)

Hi PH! I built RezUp after reading one too many "…charged me $25 and I
can't cancel" stories about the big resume builders. The category's standard
playbook is a ~$2 trial that auto-converts to ~$25/month, plus AI writers that
invent metrics you never achieved.

RezUp's rules are simple:
- Your resume never leaves your browser (localStorage, no accounts, no database)
- The ATS match score is free, unlimited, and computed locally
- The AI polishes your real experience — vague input becomes a [placeholder],
  never a fabricated number
- Real text-based PDF and DOCX export, no watermark
- Pay once ($9.99 / $19.99) — nothing recurring, nothing to cancel. It's all
  free while we're in beta.

Would love brutal feedback, especially on the ATS checker and AI Tailor. I'll
be here all day.

## FAQ answers (for comments)

- **How is the ATS score computed?** Keyword match against the posting you
  paste plus structural checks (sections, quantified bullets, contact info) —
  all in-browser. It's a match heuristic, not a hiring prediction, and we say
  so in the UI.
- **Business model?** One-time purchases via a merchant of record. During beta
  everything is free (email before first download). No card, no auto-renewal.
- **Privacy?** No accounts. Resume text is only sent to a server when you
  explicitly run an AI action, and isn't retained after the response.
- **vs Zety/Resume.io?** We publish first-hand, dated comparisons:
  https://cv.zalize.com/vs/
- **Stack?** React 19 + Vite + Tailwind on Cloudflare Workers/KV; pdf-lib,
  docx, pdfjs.
