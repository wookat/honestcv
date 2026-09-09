import { writeFileSync } from 'node:fs'
const urls = ['https://www.rezi.ai/','https://www.rezi.ai/ai-resume-builder','https://www.rezi.ai/pricing','https://www.rezi.ai/resume-checker','https://www.rezi.ai/job-search','https://www.rezi.ai/ai-cover-letter-builder','https://www.rezi.ai/ai-interview','https://www.rezi.ai/resume-keyword-scanner']
const out = {}
for (const u of urls) {
  try {
    const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/128 Safari/537.36', accept: 'text/html' }, redirect: 'follow' })
    const html = await r.text()
    const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g,'&').replace(/&#39;|&#x27;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g, ' ').trim()
    const heads = [...html.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi)].map(m => strip(m[2])).filter(Boolean)
    const title = strip((html.match(/<title>([\s\S]*?)<\/title>/i) || [,''])[1])
    const desc = (html.match(/<meta name="description" content="([^"]*)"/i) || [,''])[1]
    out[u] = { status: r.status, finalUrl: r.url, title, desc, bytes: html.length, headings: [...new Set(heads)].slice(0, 60) }
  } catch (e) { out[u] = { error: String(e) } }
}
writeFileSync('/home/ubuntu/qa/r813-rezi.json', JSON.stringify(out, null, 2))
for (const [u, v] of Object.entries(out)) { console.log('\n##', u, v.status, v.finalUrl !== u ? '→ ' + v.finalUrl : '', v.bytes); console.log(v.title); console.log((v.headings || []).join(' | ').slice(0, 2500)) }
