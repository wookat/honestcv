/**
 * Build-time SEO pages: renders static HTML landing pages (comparison /
 * keyword pages) into dist/client/, plus sitemap.xml and robots.txt.
 * Static assets win over the SPA fallback, so crawlers get real HTML.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const SITE = 'https://cv.zalize.com'
const OUT_DIR = path.resolve(import.meta.dirname, '../dist/client')

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
<p>Everything is free to try — editor, ATS templates, live preview, match score. Pay $9.99 exactly once to download. No subscription, no auto-renewal, nothing to cancel.</p>
<a class="btn" href="/builder">Start building free</a>
</div>
<div class="related">
<h2>More from HonestCV</h2>
<ul>
${related.map((r) => `<li><a href="${r.path}">${esc(r.title.split(' — ')[0])}</a></li>`).join('\n')}
</ul>
</div>
</main>
<footer class="site"><div class="in">© ${new Date().getFullYear()} HonestCV · Pay once, own it forever. Your resume stays in your browser.</div></footer>
</body>
</html>`
}

for (const p of PAGES) {
  const dir = path.join(OUT_DIR, p.path.slice(1))
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'index.html'), page(p))
  console.log(`built ${p.path}/index.html`)
}

const urls = ['/', ...PAGES.map((p) => `${p.path}/`)]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}
</urlset>
`
writeFileSync(path.join(OUT_DIR, 'sitemap.xml'), sitemap)
writeFileSync(
  path.join(OUT_DIR, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`
)
console.log('built sitemap.xml + robots.txt')
