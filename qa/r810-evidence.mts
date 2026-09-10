// R810 evidence: how often do the 186 retained texts carry a "Role at Company" /
// "Role — Company" line before any section heading, and what does the parser do
// with it today? Run: npx vite-node qa/r810-evidence.mts
import { readFileSync } from 'node:fs'
import { parseResumeText } from '../src/lib/importText'

const texts: Record<string, string> = {}
for (const k of Object.keys(JSON.parse(readFileSync('/home/ubuntu/qa/r776-text-replay.json', 'utf8'))))
  texts[`text:${k}`] = readFileSync(k, 'utf8')
const pdf = JSON.parse(readFileSync('/home/ubuntu/qa/r786-extract-after.json', 'utf8')) as Record<string, string>
for (const k of Object.keys(pdf)) texts[`pdf:${k}`] = pdf[k]

const AT = /[A-Za-z)]\s(?:at|—|–)\s[A-Z][a-z]/
const DATE = /\b(?:19|20)\d{2}\b/
let hits = 0
for (const k of Object.keys(texts).sort()) {
  const lines = texts[k].split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 12)
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (l.length > 90 || !AT.test(l) || /@|\d{3}[-.\s]\d{3}|\b(?:19|20)\d{2}\b/.test(l)) continue
    const next = lines[i + 1] ?? ''
    const shape = DATE.test(next) ? 'date-under' : /^[-•*]/.test(next) ? 'bullet-under' : 'other-under'
    const r = parseResumeText(texts[k])
    hits++
    console.log(`${k.slice(0, 70)}\n   L${i}: ${l}\n   next: ${next.slice(0, 60)} [${shape}]\n   title=${JSON.stringify(r.contact.title)} exp0=${JSON.stringify(r.experience[0] ? [r.experience[0].role, r.experience[0].company] : null)}`)
  }
}
console.log(`lines matched: ${hits} / ${Object.keys(texts).length} files`)
