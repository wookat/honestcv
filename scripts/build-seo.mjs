/**
 * Build-time SEO pages: renders static HTML landing pages (comparison /
 * keyword pages) into dist/client/, plus sitemap.xml and robots.txt.
 * Static assets win over the SPA fallback, so crawlers get real HTML.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const SITE = 'https://cv.zalize.com'
const OUT_DIR = path.resolve(import.meta.dirname, '../dist/client')
// Launch/traffic mode: static pages advertise free downloads instead of pricing
const FREE_MODE = process.env.VITE_FREE_MODE !== 'false'

const PAGES = [
  {
    slug: 'vs-zety',
    path: '/vs/zety',
    name: 'HonestCV vs Zety',
    title: 'HonestCV vs Zety — One-Time $9.99 vs a $25.95/4-Week Subscription',
    description:
      'Comparing HonestCV and Zety: Zety’s $2.70 trial auto-renews at ~$25.95 every 4 weeks. HonestCV charges $9.99 once — no subscription, no stored card, no cancellation maze.',
    h1: 'HonestCV vs Zety: pay once, or pay every four weeks?',
    intro:
      'Zety is a polished resume builder — but its pricing is built around a small “trial” fee that automatically converts into a recurring charge of roughly $25.95 every four weeks until you cancel. “Zety charged me” is one of the most-searched complaints in this category. HonestCV takes the opposite approach: everything is free to try, downloading costs $9.99 exactly once, and we never store your card for recurring billing.',
    bullets: [
      'HonestCV: $9.99 one-time. Zety: ~$2.70 trial that auto-renews at ~$25.95 / 4 weeks',
      'HonestCV never stores your card for recurring charges — there is nothing to cancel',
      'Free ATS match score before you pay; Zety keeps scoring behind the paywall',
      'No account required — your resume stays in your browser, not on our servers',
      'Real text-based PDF and genuine DOCX export, no watermark',
    ],
  },
  {
    slug: 'vs-livecareer',
    path: '/vs/livecareer',
    name: 'HonestCV vs LiveCareer',
    title: 'HonestCV vs LiveCareer — $9.99 Once vs Auto-Renewing Subscription',
    description:
      'LiveCareer uses the same trial-to-subscription model as Zety. HonestCV is a one-time $9.99 purchase: ATS templates, AI rewrites, PDF/DOCX export — and nothing to cancel.',
    h1: 'HonestCV vs LiveCareer: no trial traps here',
    intro:
      'LiveCareer (from the same company family as Zety) offers a cheap 14-day trial that converts to a recurring subscription unless you cancel in time. If you only need a resume for a few weeks of job hunting, a subscription makes no sense. HonestCV charges $9.99 exactly once, and every trust feature — the ATS score, the live preview, the editor — is free before you pay.',
    bullets: [
      'One-time $9.99 vs a recurring subscription you must remember to cancel',
      'Free ATS match score against any pasted job description',
      'AI rewrites that never invent employers, dates or metrics',
      'No account, no resume database — your data stays in your browser',
      '7-day money-back guarantee, no questions asked',
    ],
  },
  {
    slug: 'one-time-payment',
    path: '/resume-builder-one-time-payment',
    name: 'One-Time Payment Resume Builder',
    title: 'Resume Builder With One-Time Payment (No Subscription) — HonestCV',
    description:
      'Looking for a resume builder without a subscription? HonestCV is $9.99 one-time: ATS-friendly templates, free match score, AI rewrites, PDF & DOCX downloads. No auto-renewal, ever.',
    h1: 'A resume builder with a one-time payment — no subscription',
    intro:
      'Most big resume builders (Zety, LiveCareer, ResumeGenius…) run on trial-to-subscription pricing: a couple of dollars up front, then ~$24–26 every four weeks until you cancel. If you searched “resume builder one time payment”, you already know why that’s a problem. HonestCV is exactly what it says: build free, pay $9.99 once to download, own it forever.',
    bullets: [
      '$9.99 one-time for unlimited PDF + DOCX downloads and AI rewrites',
      '$19.99 Career Bundle adds AI cover letters and interview prep — still one-time',
      'Free before you pay: full editor, 4 ATS templates, live preview, ATS match score',
      'No account, no stored card, nothing to cancel',
      'Your resume lives in your browser — we don’t keep a copy',
    ],
  },
  {
    slug: 'ats-checker',
    path: '/free-ats-resume-checker',
    name: 'Free ATS Resume Checker',
    title: 'Free ATS Resume Checker — Match Score Against Any Job Description',
    description:
      'Check your resume against any job description for free. HonestCV computes an ATS keyword match score in your browser — no upload, no account, no email required.',
    h1: 'Check your ATS match score — free, no upload',
    intro:
      'Paste a job description and see instantly which keywords your resume matches and which are missing, plus structural checks ATS parsers care about (contact info, quantified bullets, standard sections). It all runs in your browser — your resume is never uploaded, and you don’t need an account or email to see your full score.',
    bullets: [
      'Keyword match against the exact job posting, computed locally',
      'Structural checks: standard sections, quantified achievements, contact info',
      'Completely free — the score is never behind a paywall',
      'Fix gaps in the built-in editor with AI rewrites (5 free)',
      'Download the finished resume as PDF/DOCX for a one-time $9.99',
    ],
    cta: '/ats-checker',
    ctaLabel: 'Open the free ATS checker',
  },
  {
    slug: 'vs-resumeio',
    path: '/vs/resume-io',
    name: 'HonestCV vs Resume.io',
    title: 'HonestCV vs Resume.io — One-Time Purchase vs a Recurring Subscription',
    description:
      'Resume.io charges a small trial fee that converts to a recurring subscription. HonestCV is a one-time purchase: ATS templates, AI rewrites, free match score, PDF/DOCX export.',
    h1: 'HonestCV vs Resume.io: buy your resume, don’t rent it',
    intro:
      'Resume.io is one of the most popular resume builders, and like most of the category it monetizes through a low-cost 7-day trial that automatically converts into a recurring subscription (roughly $24.95/month) unless you cancel in time. If you only need a resume for a few weeks of applications, that pricing model works against you. HonestCV is the opposite: the editor, templates and ATS match score are free, and downloading is a one-time purchase — there is never anything to cancel.',
    bullets: [
      'One-time purchase vs a ~$24.95/month auto-renewing subscription',
      'Free ATS match score against any pasted job description — before paying anything',
      'No account required; your resume lives in your browser, not a server database',
      'AI rewrites that sharpen your real experience without inventing anything',
      'Real text-based PDF and genuine DOCX export, no watermark',
    ],
  },
  {
    slug: 'vs-resumegenius',
    path: '/vs/resume-genius',
    name: 'HonestCV vs Resume Genius',
    title: 'HonestCV vs Resume Genius — No 14-Day Trial That Auto-Renews',
    description:
      'Resume Genius uses a 14-day trial that converts to ~$23.95 every 4 weeks. HonestCV has no subscription at all: build free, download with a single one-time purchase.',
    h1: 'HonestCV vs Resume Genius: skip the trial-to-subscription funnel',
    intro:
      'Resume Genius advertises a 14-day full-access trial for a couple of dollars — and if you don’t cancel in time, it converts to roughly $23.95 every four weeks. Thousands of “resume genius charged me” complaints exist for exactly this reason. HonestCV never takes your card for a trial: everything except downloading is free forever, and downloading is one single payment with nothing to cancel afterwards.',
    bullets: [
      'No trial, no auto-renewal, no stored card — one payment and you own it',
      'ATS keyword match score is free, before you decide to pay',
      'Single-column, parser-friendly templates that real ATS systems read cleanly',
      'AI cover letter and interview prep available in the Career Bundle',
      '14-day money-back guarantee, no questions asked',
    ],
  },
]

/** Long-tail guide pages: real content, not thin doorway pages */
const GUIDES = [
  {
    path: '/guides/ats-friendly-resume',
    title: 'How to Make Your Resume ATS-Friendly in 2026 — Practical Checklist',
    description:
      'A practical checklist for getting your resume through Applicant Tracking Systems: layout rules, keyword matching, section headings, file formats, and what to avoid.',
    h1: 'How to make your resume ATS-friendly (2026 checklist)',
    sections: [
      ['Use a single-column layout', 'ATS parsers read top-to-bottom, left-to-right. Multi-column layouts, text boxes, tables and graphics frequently scramble the parse order or get dropped entirely. A clean single-column layout with clear headings is the safest format — it’s why every HonestCV template is single-column.'],
      ['Keep section headings standard', 'Parsers look for headings like “Experience”, “Education” and “Skills”. Creative headings (“My journey”, “What I bring”) can cause whole sections to be misfiled or skipped. Boring headings win.'],
      ['Mirror the job description’s keywords', 'Most ATS screening is keyword matching against the job posting. Paste the posting next to your resume and make sure the concrete skills and tools it names appear in yours — in the same wording. A free checker like our ATS match score shows exactly which keywords are missing.'],
      ['Export as real text, not an image', 'Your PDF must contain selectable text. Screenshots, scanned documents, or design-tool exports that flatten text to outlines are unreadable to parsers. Test: if you can’t select and copy text in your PDF, neither can the ATS.'],
      ['Quantify your achievements', 'Numbers survive both parsers and recruiters: “cut deploy time 40%” beats “improved deployment process”. Aim for at least half your bullets to include a number, %, or $ figure.'],
      ['Skip the photo, graphics and icons', 'In the US/UK/Canada market, photos are discouraged (bias policies) and graphics are parser hazards. Icons for phone/email often replace the actual text — make sure your contact details are typed out.'],
    ],
  },
  {
    path: '/guides/resume-summary-examples',
    title: 'Resume Summary Examples That Work in 2026 (+ Formula)',
    description:
      'A simple formula for writing a resume summary, with concrete examples for engineers, marketers, and career changers — and the mistakes that make recruiters skip yours.',
    h1: 'Resume summary examples that actually work',
    sections: [
      ['The 3-line formula', 'Line 1: who you are professionally (title + years + specialty). Line 2: your one or two most impressive, quantified achievements. Line 3: what you’re aiming to do for the employer you’re applying to. Three sentences, no fluff, tailored per application.'],
      ['Engineer example', '“Backend engineer with 6 years building payment infrastructure in Go and Postgres. Led a migration that cut transaction latency 45% while scaling to 3M daily transactions. Looking to bring reliability-first engineering to a fintech platform team.”'],
      ['Marketer example', '“Growth marketer with 4 years in B2B SaaS. Built an SEO program that grew organic signups from 200 to 2,400/month and cut CAC 38%. Seeking to own full-funnel growth at an early-stage product.”'],
      ['Career changer example', '“Former teacher transitioning to UX research after a one-year intensive program and three shipped client studies. Ran usability tests with 40+ participants; findings drove a 25% task-completion improvement. Aiming to bring classroom-honed user empathy to a product research team.”'],
      ['Mistakes that get summaries skipped', 'Buzzword strings with no evidence (“results-driven team player”), first person pronouns everywhere, restating your whole career, and one generic summary used for every application. Recruiters spend ~7 seconds here — make each word earn its place.'],
      ['Let AI polish, not fabricate', 'An AI rewrite should tighten your real accomplishments, not invent new ones — fabricated metrics fall apart in interviews. HonestCV’s AI is explicitly constrained to never invent employers, dates, degrees or numbers.'],
    ],
  },
  {
    path: '/guides/resume-keywords',
    title: 'How to Find and Use Resume Keywords (Without Keyword Stuffing)',
    description:
      'Where resume keywords come from, how ATS matching actually works, and how to add keywords naturally — with a free tool to check your match score against any job posting.',
    h1: 'Resume keywords: how to find them and use them right',
    sections: [
      ['Keywords come from the job posting, not a master list', 'Every ATS screen is a comparison between your resume and one specific job description. Generic “top resume keywords” lists are mostly noise — the keywords that matter are the concrete skills, tools and qualifications named in the posting in front of you.'],
      ['Hard skills beat soft skills', 'Parsers match concrete nouns best: “PostgreSQL”, “Google Ads”, “GAAP”, “Kubernetes”. Soft skills (“leadership”, “communication”) are matched too, but carry less weight and are easy to overdo.'],
      ['Use the exact wording', 'If the posting says “customer relationship management (CRM)”, include both the phrase and the acronym. Parsers are literal: “CRM” alone may not match “customer relationship management”.'],
      ['Where to place keywords', 'The skills section is the easiest match, but keywords embedded in experience bullets carry more credibility with the human reader who comes after the ATS. Best practice: skills section for coverage, bullets for proof.'],
      ['Don’t stuff', 'White-text keywords, keyword walls, or repeating a term ten times can get you auto-flagged and looks desperate to recruiters. Match honestly: if a required skill is missing from your background, address it in the cover letter instead.'],
      ['Check your match before applying', 'Paste your resume and the job description into our free ATS checker to see your match score, matched keywords and missing keywords — it runs entirely in your browser, no upload, no signup.'],
    ],
  },
]

/** pSEO template pages, one per built-in template */
const TEMPLATE_PAGES = [
  {
    path: '/templates/classic',
    name: 'Classic',
    title: 'Classic ATS Resume Template — Free to Use Online | HonestCV',
    description:
      'A timeless single-column resume template with serif headings — the safest format for ATS parsers and conservative industries. Use it free in your browser.',
    blurb: 'The Classic template uses a traditional serif-accented layout that reads instantly to both ATS parsers and human recruiters. Best for finance, law, government, and any conservative industry where familiarity signals professionalism.',
  },
  {
    path: '/templates/modern',
    name: 'Modern',
    title: 'Modern ATS Resume Template — Free to Use Online | HonestCV',
    description:
      'A clean modern resume template with an accent color and clear hierarchy — still strictly single-column and ATS-safe. Use it free in your browser.',
    blurb: 'The Modern template adds a restrained accent color and contemporary typography while staying strictly single-column. Best for tech, product, marketing and startup roles where a current look matters.',
  },
  {
    path: '/templates/compact',
    name: 'Compact',
    title: 'Compact One-Page Resume Template — Free to Use Online | HonestCV',
    description:
      'A space-efficient resume template that fits more experience on one page without sacrificing ATS readability. Use it free in your browser.',
    blurb: 'The Compact template tightens spacing and type size to fit senior-level experience on a single page — without tables or columns that break parsers. Best for experienced candidates told their resume is “too long”.',
  },
  {
    path: '/templates/executive',
    name: 'Executive',
    title: 'Executive Resume Template — Free to Use Online | HonestCV',
    description:
      'An authoritative resume template with strong headings for leadership roles — single-column and fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Executive template uses commanding headings and generous whitespace to frame leadership scope and outcomes. Best for director, VP and C-level applications where gravitas counts.',
  },
  {
    path: '/templates/minimal',
    name: 'Minimal',
    title: 'Minimal ATS Resume Template — Free to Use Online | HonestCV',
    description:
      'A whitespace-first, left-aligned resume template with no dividers — quiet, modern and fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Minimal template strips away rules and ornament, letting a left-aligned header and clean typography carry the design. Best for design, product and modern tech roles where restraint reads as confidence.',
  },
  {
    path: '/templates/bold',
    name: 'Bold',
    title: 'Bold ATS Resume Template — Free to Use Online | HonestCV',
    description:
      'A high-contrast resume template with strong headings and thick rules — memorable but still single-column and ATS-safe. Use it free in your browser.',
    blurb: 'The Bold template pairs an uppercase name with thick section rules so your resume stands out in a printed stack — while staying strictly single-column for parsers. Best for sales, marketing and client-facing roles.',
  },
  {
    path: '/templates/elegant',
    name: 'Elegant',
    title: 'Elegant Serif Resume Template — Free to Use Online | HonestCV',
    description:
      'A refined serif resume template with a left-aligned header and fine rules — polished, formal and ATS-parseable. Use it free in your browser.',
    blurb: 'The Elegant template combines refined serif typography with a left-aligned header and fine dividers for a polished, formal impression. Best for consulting, academia, publishing and client advisory roles.',
  },
  {
    path: '/templates/engineer',
    name: 'Engineer',
    title: 'Engineer Resume Template — Free to Use Online | HonestCV',
    description:
      'A no-nonsense sans-serif resume template built for technical resumes — dense, scannable and fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Engineer template is built for technical resumes: a compact left-aligned header, clear section rules and typography that keeps dense skill lists scannable. Best for software, data, DevOps and hardware roles.',
  },
]

function esc(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

const CSS = `
:root{--bg:oklch(0.99 0.002 250);--fg:oklch(0.18 0.02 260);--muted:oklch(0.52 0.02 260);--primary:oklch(0.5 0.18 265);--primary-fg:oklch(0.985 0 0);--border:oklch(0.91 0.01 260);--card:oklch(1 0 0);--accent:oklch(0.94 0.03 265);--radius:0.625rem}
*{box-sizing:border-box;border-color:var(--border)}
body{margin:0;background:var(--bg);color:var(--fg);-webkit-font-smoothing:antialiased;font-family:'Inter',system-ui,-apple-system,sans-serif;line-height:1.7}
a{color:var(--primary);text-decoration:none}a:hover{text-decoration:underline}
header.site{position:sticky;top:0;z-index:20;border-bottom:1px solid var(--border);background:color-mix(in oklch,var(--bg) 85%,transparent);backdrop-filter:blur(8px)}
header.site .in{max-width:72rem;margin:0 auto;height:3.5rem;display:flex;align-items:center;justify-content:space-between;padding:0 1rem}
header.site .brand{display:flex;align-items:center;gap:.5rem;font-weight:600;color:var(--fg)}
header.site .brand img{width:1.5rem;height:1.5rem}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;border-radius:calc(var(--radius) - 2px);background:var(--primary);color:var(--primary-fg);padding:.55rem 1.1rem;font-size:.9rem;font-weight:500;border:0;cursor:pointer}
.btn:hover{opacity:.9;text-decoration:none}
main{max-width:46rem;margin:0 auto;padding:2.5rem 1rem 4rem}
h1{font-size:2rem;line-height:1.25;letter-spacing:-.01em;margin:.25rem 0 .75rem}
.lede{color:var(--muted);font-size:1.05rem}
ul.features{padding-left:1.3em}
ul.features li{margin:.4rem 0}
.cta{margin:2.5rem 0 0;border:1px solid var(--border);background:var(--card);border-radius:var(--radius);padding:1.5rem;box-shadow:0 1px 2px rgb(0 0 0/.04);text-align:center}
.cta p{color:var(--muted);font-size:.9375rem}
.related{margin-top:3rem;border-top:1px solid var(--border);padding-top:1.5rem}
.related h2{font-size:1rem;margin:0 0 .75rem}
.related ul{list-style:none;padding:0;margin:0;display:grid;gap:.5rem}
footer.site{border-top:1px solid var(--border)}
footer.site .in{max-width:72rem;margin:0 auto;padding:1.5rem 1rem;text-align:center;font-size:.75rem;color:var(--muted)}
`.trim()

function page(p) {
  const canonical = `${SITE}${p.path}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'HonestCV',
    url: canonical,
    applicationCategory: 'BusinessApplication',
    description: p.description,
    offers: { '@type': 'Offer', price: '9.99', priceCurrency: 'USD' },
  }
  const related = PAGES.filter((r) => r.slug !== p.slug)
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="HonestCV" />
<meta property="og:title" content="${esc(p.title)}" />
<meta property="og:description" content="${esc(p.description)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:locale" content="en_US" />
<meta name="twitter:card" content="summary" />
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>${CSS}</style>
</head>
<body>
<header class="site"><div class="in">
<a class="brand" href="/"><img src="/favicon.svg" alt="" />HonestCV</a>
<a class="btn" href="/builder">Build my resume free</a>
</div></header>
<main>
<h1>${esc(p.h1)}</h1>
<p class="lede">${esc(p.intro)}</p>
<ul class="features">
${p.bullets.map((b) => `<li>${esc(b)}</li>`).join('\n')}
</ul>
<div class="cta">
<p>${FREE_MODE ? 'Launch special: everything is free right now — editor, ATS templates, match score, AI tools and PDF/DOCX downloads. No card, no trial, nothing that renews.' : 'Everything is free to try — editor, ATS templates, live preview, match score. Pay $9.99 exactly once to download. No subscription, no auto-renewal, nothing to cancel.'}</p>
<a class="btn" href="${p.cta ?? '/builder'}">${esc(p.ctaLabel ?? 'Start building free')}</a>
</div>
<div class="related">
<h2>More from HonestCV</h2>
<ul>
${related.map((r) => `<li><a href="${r.path}">${esc(r.title.split(' — ')[0])}</a></li>`).join('\n')}
</ul>
</div>
</main>
<footer class="site"><div class="in">© ${new Date().getFullYear()} HonestCV · Pay once, own it forever. Your resume stays in your browser. · More honest tools: <a href="https://qr.zalize.com">HonestQR</a> · <a href="https://pdf.zalize.com">HonestPDF</a> · <a href="https://subsleuth.zalize.com">SubSleuth</a></div></footer>
</body>
</html>`
}

const LEGAL_PAGES = [
  {
    path: '/terms',
    title: 'Terms & Refunds — HonestCV',
    h1: 'Terms & refund policy',
    sections: [
      ['What you buy', 'HonestCV sells one-time licenses: Single Resume ($9.99) unlocks unlimited AI rewrites plus PDF and DOCX downloads; Career Bundle ($19.99) adds the AI cover letter and interview prep tools. There is no subscription, no auto-renewal, and nothing to cancel — ever.'],
      ['Payments', 'Payments are processed by our merchant of record (Lemon Squeezy / Paddle), which handles billing, receipts, and applicable taxes. We never see or store your card details.'],
      ['Refunds', 'Not happy for any reason within 14 days of purchase? Email us with the order number from your receipt and we will refund you in full — no questions, no hoops.'],
      ['License', 'Your license key works in any browser and is valid for 10 years. It covers personal use of your own resumes and cover letters; the documents you create are entirely yours.'],
      ['Fair use', 'AI features are for polishing your own real experience. We may throttle automated or abusive traffic to keep the service fast for everyone.'],
    ],
  },
  {
    path: '/privacy',
    title: 'Privacy — HonestCV',
    h1: 'Privacy policy',
    sections: [
      ['Your resume stays in your browser', 'Resume content is stored in your browser\u2019s localStorage. We have no user accounts and no resume database — clearing your browser data deletes your resume from existence.'],
      ['What our servers see', 'AI rewrite requests send only the text you ask to improve (plus the job description you pasted) to generate a response; we do not retain it after responding. Purchases store an order id and license key so your license can be restored.'],
      ['Payments', 'Checkout is handled by our merchant of record (Lemon Squeezy / Paddle). Your payment details go to them, not us. Their receipt email is your proof of purchase.'],
      ['No tracking for sale', 'We do not sell or share personal data. We use no advertising trackers.'],
      ['Contact', 'Questions or data requests: reply to your receipt email or use the contact link in the footer.'],
    ],
  },
]

function legalPage(p) {
  const canonical = `${SITE}${p.path}`
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.sections[0][1])}" />
<link rel="canonical" href="${canonical}" />
<style>${CSS}</style>
</head>
<body>
<header class="site"><div class="in">
<a class="brand" href="/"><img src="/favicon.svg" alt="" />HonestCV</a>
<a class="btn" href="/builder">Build my resume free</a>
</div></header>
<main>
<h1>${esc(p.h1)}</h1>
${p.sections.map(([h, t]) => `<h2 style="margin-top:1.5rem;font-size:1.125rem">${esc(h)}</h2>\n<p class="lede" style="font-size:1rem">${esc(t)}</p>`).join('\n')}
</main>
<footer class="site"><div class="in">© ${new Date().getFullYear()} HonestCV · <a href="/terms">Terms &amp; refunds</a> · <a href="/privacy">Privacy</a></div></footer>
</body>
</html>`
}

for (const p of PAGES) {
  const dir = path.join(OUT_DIR, p.path.slice(1))
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'index.html'), page(p))
  console.log(`built ${p.path}/index.html`)
}

for (const p of LEGAL_PAGES) {
  const dir = path.join(OUT_DIR, p.path.slice(1))
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'index.html'), legalPage(p))
  console.log(`built ${p.path}/index.html`)
}

function guidePage(p) {
  const canonical = `${SITE}${p.path}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.h1,
    description: p.description,
    url: canonical,
    publisher: { '@type': 'Organization', name: 'HonestCV', url: SITE },
  }
  const related = [...GUIDES.filter((g) => g.path !== p.path), ...PAGES.slice(0, 3)]
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="HonestCV" />
<meta property="og:title" content="${esc(p.title)}" />
<meta property="og:description" content="${esc(p.description)}" />
<meta property="og:url" content="${canonical}" />
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>${CSS}</style>
</head>
<body>
<header class="site"><div class="in">
<a class="brand" href="/"><img src="/favicon.svg" alt="" />HonestCV</a>
<a class="btn" href="/builder">Build my resume free</a>
</div></header>
<main>
<h1>${esc(p.h1)}</h1>
${p.sections.map(([h, t]) => `<h2 style="margin-top:1.75rem;font-size:1.2rem">${esc(h)}</h2>\n<p>${esc(t)}</p>`).join('\n')}
<div class="cta">
<p>${FREE_MODE ? 'Put this into practice — the HonestCV builder is completely free during launch: templates, AI rewrites, ATS score and PDF/DOCX downloads.' : 'Put this into practice — the HonestCV builder is free to try, with a one-time $9.99 download and no subscription.'}</p>
<a class="btn" href="/builder">Build my resume free</a> &nbsp; <a class="btn" href="/ats-checker" style="background:transparent;color:var(--primary);border:1px solid var(--border)">Check my ATS score</a>
</div>
<div class="related">
<h2>Keep reading</h2>
<ul>
${related.map((r) => `<li><a href="${r.path}">${esc(r.title.split(' — ')[0])}</a></li>`).join('\n')}
</ul>
</div>
</main>
<footer class="site"><div class="in">© ${new Date().getFullYear()} HonestCV · <a href="/terms">Terms</a> · <a href="/privacy">Privacy</a> · More honest tools: <a href="https://qr.zalize.com">HonestQR</a> · <a href="https://pdf.zalize.com">HonestPDF</a> · <a href="https://subsleuth.zalize.com">SubSleuth</a></div></footer>
</body>
</html>`
}

function templatePage(p) {
  const canonical = `${SITE}${p.path}`
  const others = TEMPLATE_PAGES.filter((t) => t.path !== p.path)
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="HonestCV" />
<meta property="og:title" content="${esc(p.title)}" />
<meta property="og:description" content="${esc(p.description)}" />
<meta property="og:url" content="${canonical}" />
<style>${CSS}</style>
</head>
<body>
<header class="site"><div class="in">
<a class="brand" href="/"><img src="/favicon.svg" alt="" />HonestCV</a>
<a class="btn" href="/builder">Use this template free</a>
</div></header>
<main>
<h1>${esc(p.name)} — ATS-friendly resume template</h1>
<p class="lede">${esc(p.blurb)}</p>
<ul class="features">
<li>Strictly single-column — the layout ATS parsers read most reliably</li>
<li>Real text-based PDF export (selectable, parseable) plus a genuine DOCX</li>
<li>Live preview while you edit; switch templates any time without retyping</li>
<li>Free ATS match score against any job description you paste</li>
<li>${FREE_MODE ? 'Free to download during our launch — no card, no subscription' : 'One-time $9.99 to download — no subscription, nothing to cancel'}</li>
</ul>
<div class="cta">
<p>Open the builder, pick the ${esc(p.name)} template, and start from a working example — no account needed.</p>
<a class="btn" href="/builder">Use the ${esc(p.name)} template free</a>
</div>
<div class="related">
<h2>Other templates</h2>
<ul>
${others.map((t) => `<li><a href="${t.path}">${esc(t.name)} resume template</a></li>`).join('\n')}
</ul>
</div>
</main>
<footer class="site"><div class="in">© ${new Date().getFullYear()} HonestCV · <a href="/terms">Terms</a> · <a href="/privacy">Privacy</a> · More honest tools: <a href="https://qr.zalize.com">HonestQR</a> · <a href="https://pdf.zalize.com">HonestPDF</a> · <a href="https://subsleuth.zalize.com">SubSleuth</a></div></footer>
</body>
</html>`
}

for (const p of GUIDES) {
  const dir = path.join(OUT_DIR, p.path.slice(1))
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'index.html'), guidePage(p))
  console.log(`built ${p.path}/index.html`)
}

for (const p of TEMPLATE_PAGES) {
  const dir = path.join(OUT_DIR, p.path.slice(1))
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'index.html'), templatePage(p))
  console.log(`built ${p.path}/index.html`)
}

const urls = [
  '/',
  '/builder',
  '/ats-checker',
  ...PAGES.map((p) => `${p.path}/`),
  ...GUIDES.map((p) => `${p.path}/`),
  ...TEMPLATE_PAGES.map((p) => `${p.path}/`),
  ...LEGAL_PAGES.map((p) => `${p.path}/`),
]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}
</urlset>
`
writeFileSync(path.join(OUT_DIR, 'sitemap.xml'), sitemap)
// IndexNow site verification key (public by protocol design, not a secret)
const INDEXNOW_KEY = '88d13cb021bb7d759cc09d7b95af03fc'
writeFileSync(path.join(OUT_DIR, `${INDEXNOW_KEY}.txt`), INDEXNOW_KEY)
writeFileSync(
  path.join(OUT_DIR, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`
)
console.log('built sitemap.xml + robots.txt')
