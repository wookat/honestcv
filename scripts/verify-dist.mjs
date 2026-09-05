/**
 * Pre-deploy gate: refuse to publish a dist/client that is missing the
 * prerendered static pages. `vite build` empties dist/client, so deploying
 * before scripts/prerender.mjs + scripts/build-seo.mjs have run would
 * replace the live asset manifest with an SPA-only one and 404 every
 * static page (this happened on 2026-08-31; see docs/handoff-context.md).
 *
 * The check is sitemap-driven: every URL in dist/client/sitemap.xml that
 * is not an SPA route must have its own index.html on disk.
 *
 * Runs from `npm run deploy` (a wrangler.jsonc `build.command` hook does not
 * work here: the Cloudflare vite plugin's redirected config strips `build`,
 * so wrangler never executes it). Never call `wrangler deploy` directly.
 */
import fs from 'node:fs'
import path from 'node:path'

const CLIENT = path.resolve('dist/client')

// SPA routes are served from spa.html by the Worker; everything else in the
// sitemap must exist as a prerendered file. Keep in sync with worker/index.ts.
const SPA_ROUTES = new Set([
  '/',
  '/builder',
  '/ats-checker',
  '/jobs',
  '/dashboard',
  '/documents',
  '/samples',
])

function fail(msg) {
  console.error(`verify-dist: ${msg}`)
  console.error('verify-dist: run the full `npm run build` before deploying.')
  process.exit(1)
}

for (const f of ['index.html', 'spa.html', 'sitemap.xml', 'examples/examples.json']) {
  if (!fs.existsSync(path.join(CLIENT, f))) fail(`missing ${f}`)
}

const sitemap = fs.readFileSync(path.join(CLIENT, 'sitemap.xml'), 'utf8')
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname)
if (urls.length < 100) fail(`sitemap.xml lists only ${urls.length} URLs — build looks partial`)

const missing = urls.filter((p) => {
  if (SPA_ROUTES.has(p.replace(/\/$/, '') || '/')) return false
  return !fs.existsSync(path.join(CLIENT, p.replace(/^\//, ''), 'index.html'))
})
if (missing.length) fail(`${missing.length} sitemap page(s) missing from dist/client: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ', …' : ''}`)

console.log(`verify-dist: OK — ${urls.length} sitemap URLs, static pages present`)
