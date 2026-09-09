// R825 evidence: across the 186 retained import texts, which header lines (first 8 non-empty lines) are a
// bare place with no comma — a known city / country / region, "Location: X", "City Country", "Remote" —
// and what the current parser stores as contact.title / contact.location for that document.
// Run: npx vite-node qa/r825-evidence.mts
import { readFileSync } from 'node:fs'
import { parseResumeText } from '../src/lib/importText'
import { isKnownPlace } from '../src/lib/places'

const texts: Record<string, string> = {}
for (const k of Object.keys(JSON.parse(readFileSync('/home/ubuntu/qa/r776-text-replay.json', 'utf8'))))
  texts[`text:${k}`] = readFileSync(k, 'utf8')
const pdf = JSON.parse(readFileSync('/home/ubuntu/qa/r786-extract-after.json', 'utf8')) as Record<string, string>
for (const k of Object.keys(pdf)) texts[`pdf:${k}`] = pdf[k]

const LABEL = /^(?:location|based in|address|lives in)\s*[:—–-]?\s*(.+)$/i
const kinds = (line: string) => {
  const out: string[] = []
  if (/^remote$/i.test(line)) out.push('remote')
  if (!line.includes(',') && isKnownPlace(line)) out.push('known-place')
  const m = line.match(LABEL)
  if (m) out.push(`label:${m[1]}`)
  const w = line.split(/\s+/)
  if (w.length >= 2 && !line.includes(',') && isKnownPlace(w.slice(0, -1).join(' ')) && isKnownPlace(w[w.length - 1]))
    out.push('city-country')
  return out
}

let docs = 0
const hits: string[] = []
for (const k of Object.keys(texts).sort()) {
  const lines = texts[k].split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 8)
  const found = lines.map((l, i) => [i, l, kinds(l)] as const).filter(([, , ks]) => ks.length)
  if (!found.length) continue
  docs++
  const r = parseResumeText(texts[k])
  for (const [i, l, ks] of found)
    hits.push(`${k}\n  line ${i}: ${JSON.stringify(l)} → ${ks.join(',')}\n  stored title=${JSON.stringify(r.contact.title)} location=${JSON.stringify(r.contact.location)}`)
}
console.log(hits.join('\n'))
console.log(`\n${docs} of ${Object.keys(texts).length} documents have a bare place line in their header`)
