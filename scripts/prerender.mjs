// Prerender the landing route into dist/client/index.html so first paint
// doesn't wait on the JS bundle. The untouched shell is kept as spa.html
// for client-rendered routes (/builder, /ats-checker, 404s).
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
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

writeFileSync(path.join(root, 'dist/client/spa.html'), shell)
writeFileSync(shellPath, shell.replace(marker, `<div id="root">${html}</div>`))
console.log('prerendered / into dist/client/index.html (shell kept as spa.html)')
