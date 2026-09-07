// Prerender the landing route into dist/client/index.html so first paint
// doesn't wait on the JS bundle. The untouched shell is kept as spa.html
// for client-rendered routes (/builder, /ats-checker, 404s).
import { execSync } from 'node:child_process'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

execSync('npx vite build --config vite.ssr.config.ts', { cwd: root, stdio: 'inherit' })

const { render } = await import(path.join(root, 'dist/prerender/entry-server.js'))
const html = await render('/')
if (html.includes('aria-busy'))
  throw new Error('prerender: homepage HTML contains the Suspense fallback, not Landing')

const shellPath = path.join(root, 'dist/client/index.html')
const rawShell = readFileSync(shellPath, 'utf8')
const marker = '<div id="root"></div>'
if (!rawShell.includes(marker)) throw new Error('prerender: root marker not found in index.html')

// Inline the stylesheet so no render-blocking request sits between the HTML
// and first paint (the static SEO pages already inline theirs). The hashed
// CSS asset stays on disk but nothing references it after this.
const cssFiles = readdirSync(path.join(root, 'dist/client/assets')).filter((f) =>
  /^style-.+\.css$/.test(f)
)
if (cssFiles.length !== 1)
  throw new Error(`prerender: expected exactly one style-*.css asset, found ${cssFiles.length}`)
const css = readFileSync(path.join(root, 'dist/client/assets', cssFiles[0]), 'utf8')
if (css.includes('</style')) throw new Error('prerender: CSS is not <style>-safe')
const linkTag = new RegExp(
  `<link rel="stylesheet"[^>]*href="/assets/${cssFiles[0].replace(/[.[\]]/g, '\\$&')}"[^>]*>`
)
if (!linkTag.test(rawShell)) throw new Error('prerender: stylesheet link not found in index.html')
const shell = rawShell.replace(linkTag, () => `<style>${css}</style>`)
if (linkTag.test(shell)) throw new Error('prerender: stylesheet link not fully inlined')

// The SPA shell gets a static form skeleton (visible before any JS arrives on
// slow connections; React replaces it on mount — RouteFallback mirrors it) and
// a modulepreload for the Builder chunk so the core conversion route downloads
// in parallel with the main bundle instead of after it.
const skeleton =
  '<style>@keyframes hcv-pulse{50%{opacity:.5}}@media (max-width:767px){.hcv-sk-side{display:none}}' +
  '.hcv-sk{background:var(--muted,#e2e8f0)}html.dark .hcv-sk{background:var(--muted,oklch(0.26 0.02 260))}</style>' +
  '<div aria-busy="true" aria-label="Loading" style="max-width:72rem;margin:0 auto;padding:1rem;animation:hcv-pulse 2s cubic-bezier(.4,0,.6,1) infinite">' +
  '<!--hcv-route-header--><div class="hcv-sk" style="height:2.25rem;width:10rem;border-radius:.375rem;margin-bottom:1.5rem"></div>' +
  '<div style="display:flex;gap:2rem"><div style="flex:1;min-width:0">' +
  ['1.25rem;width:8rem', '2.5rem', '2.5rem', '6rem', '1.25rem;width:8rem', '2.5rem', '6rem']
    .map((s) => `<div class="hcv-sk" style="height:${s};border-radius:.375rem;margin-bottom:1rem"></div>`)
    .join('') +
  '</div><div class="hcv-sk-side hcv-sk" style="flex:1;aspect-ratio:17/22;border-radius:.375rem"></div></div></div>'

const assetFiles = readdirSync(path.join(root, 'dist/client/assets'))
const chunkFor = (name) => {
  const file = assetFiles.find((f) => new RegExp(`^${name}-.+\\.js$`).test(f))
  if (!file) throw new Error(`prerender: ${name} chunk not found in dist/client/assets`)
  return file
}
const builderChunk = chunkFor('Builder')
// Route→chunk map for the Worker: it rewrites the modulepreload below to the
// chunk the requested route actually hydrates (Builder stays the default).
const routeChunks = {
  '/builder': builderChunk,
  '/dashboard': chunkFor('Dashboard'),
  '/documents': chunkFor('Dashboard'),
  '/samples': chunkFor('Dashboard'),
  '/jobs': chunkFor('Jobs'),
  '/ats-checker': chunkFor('AtsChecker'),
  '/s/': chunkFor('SharedResume'),
}
const routeChunksJson = JSON.stringify(routeChunks)
if (routeChunksJson.includes("'")) throw new Error('prerender: route-chunks map not attribute-safe')

// Route→header map for the Worker: it swaps the skeleton heading bar for the
// route's real h1 + subtitle so the LCP text paints from the raw HTML instead
// of waiting for hydration. Strings mirror the page components verbatim.
const routeHeaders = {
  '/dashboard': {
    h1: 'My resumes',
    sub: "One copy per job you're applying to. Everything is stored in this browser only.",
  },
  '/documents': {
    h1: 'Career documents',
    sub: 'Documents you saved from the AI tools in the editor.',
  },
  '/samples': {
    h1: 'Sample library',
    sub: 'Start from a proven example for your role, then make it yours in the editor.',
  },
  '/jobs': {
    h1: 'Job search',
    sub:
      'Remote jobs via <a href="https://remotive.com" target="_blank" rel="noopener noreferrer" style="text-decoration:underline;color:inherit">Remotive</a>. Your application pipeline is stored in this browser only.',
  },
}
const srcDir = path.join(root, 'src/pages')
const srcText = ['Dashboard.tsx', 'Jobs.tsx']
  .map((f) => readFileSync(path.join(srcDir, f), 'utf8'))
  .join('\n')
for (const [route, { h1 }] of Object.entries(routeHeaders)) {
  if (!srcText.includes(`>${h1}</h1>`))
    throw new Error(`prerender: route header h1 for ${route} ("${h1}") not found in src/pages`)
}
// Apostrophes and angle brackets in header copy are entity-escaped so the
// JSON survives the single-quoted content attribute; the Worker decodes
// &#39;/&lt; before parsing.
const routeHeadersJson = JSON.stringify(routeHeaders)
  .replaceAll("'", '&#39;')
  .replaceAll('<', '&lt;')
if (routeHeadersJson.includes("'") || routeHeadersJson.includes('<'))
  throw new Error('prerender: route-headers map not attribute-safe')
if (!skeleton.includes('<!--hcv-route-header-->'))
  throw new Error('prerender: route-header placeholder missing from skeleton')

// The homepage FAQ is only rendered on '/', so FAQPage markup must not ship
// on the shell that serves every other route (visible-content requirement).
const spaShell = shell
  .replace(/[^\S\n]*<script type="application\/ld\+json">[^]*?<\/script>\n?/g, (block) =>
    block.includes('"FAQPage"') ? '' : block
  )
  .replace(
    '</head>',
    `    <meta name="route-chunks" content='${routeChunksJson}' />\n` +
      `    <meta name="route-headers" content='${routeHeadersJson}' />\n` +
      `    <link rel="modulepreload" href="/assets/${builderChunk}" />\n  </head>`
  )
  .replace(marker, `<div id="root">${skeleton}</div>`)
if (spaShell.includes('FAQPage')) throw new Error('prerender: FAQPage markup leaked into spa.html')
writeFileSync(path.join(root, 'dist/client/spa.html'), spaShell)

// The homepage hydrates the lazy Landing chunk, so preload it in parallel
// with the main bundle instead of waiting for React to request it.
const landingChunk = readdirSync(path.join(root, 'dist/client/assets')).find((f) =>
  /^Landing-.+\.js$/.test(f)
)
if (!landingChunk) throw new Error('prerender: Landing chunk not found in dist/client/assets')
const homeShell = shell.replace(
  '</head>',
  `    <link rel="modulepreload" href="/assets/${landingChunk}" />\n  </head>`
)
writeFileSync(shellPath, homeShell.replace(marker, `<div id="root">${html}</div>`))
console.log('prerendered / into dist/client/index.html (shell kept as spa.html)')
