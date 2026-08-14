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
const html = render('/')

const shellPath = path.join(root, 'dist/client/index.html')
const shell = readFileSync(shellPath, 'utf8')
const marker = '<div id="root"></div>'
if (!shell.includes(marker)) throw new Error('prerender: root marker not found in index.html')

// The SPA shell gets a static form skeleton (visible before any JS arrives on
// slow connections; React replaces it on mount — RouteFallback mirrors it) and
// a modulepreload for the Builder chunk so the core conversion route downloads
// in parallel with the main bundle instead of after it.
const skeleton =
  '<style>@keyframes hcv-pulse{50%{opacity:.5}}@media (max-width:767px){.hcv-sk-side{display:none}}</style>' +
  '<div aria-busy="true" aria-label="Loading" style="max-width:72rem;margin:0 auto;padding:1rem;animation:hcv-pulse 2s cubic-bezier(.4,0,.6,1) infinite">' +
  '<div style="height:2.25rem;width:10rem;border-radius:.375rem;background:#e2e8f0;margin-bottom:1.5rem"></div>' +
  '<div style="display:flex;gap:2rem"><div style="flex:1;min-width:0">' +
  ['1.25rem;width:8rem', '2.5rem', '2.5rem', '6rem', '1.25rem;width:8rem', '2.5rem', '6rem']
    .map((s) => `<div style="height:${s};border-radius:.375rem;background:#e2e8f0;margin-bottom:1rem"></div>`)
    .join('') +
  '</div><div class="hcv-sk-side" style="flex:1;aspect-ratio:17/22;border-radius:.375rem;background:#e2e8f0"></div></div></div>'

const builderChunk = readdirSync(path.join(root, 'dist/client/assets')).find((f) =>
  /^Builder-.+\.js$/.test(f)
)
if (!builderChunk) throw new Error('prerender: Builder chunk not found in dist/client/assets')

const spaShell = shell
  .replace('</head>', `    <link rel="modulepreload" href="/assets/${builderChunk}" />\n  </head>`)
  .replace(marker, `<div id="root">${skeleton}</div>`)
writeFileSync(path.join(root, 'dist/client/spa.html'), spaShell)
writeFileSync(shellPath, shell.replace(marker, `<div id="root">${html}</div>`))
console.log('prerendered / into dist/client/index.html (shell kept as spa.html)')
