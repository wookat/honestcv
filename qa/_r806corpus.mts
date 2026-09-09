import { readFileSync } from 'node:fs'
import { parseResumeText } from '../src/lib/importText'
const texts: Record<string, string> = {}
for (const k of Object.keys(JSON.parse(readFileSync('/home/ubuntu/qa/r776-text-replay.json', 'utf8')))) texts[k] = readFileSync(k, 'utf8')
const pdf = JSON.parse(readFileSync('/home/ubuntu/qa/r786-extract-after.json', 'utf8')) as Record<string, string>
for (const k of Object.keys(pdf)) texts[`pdf:${k}`] = pdf[k]
console.log('files', Object.keys(texts).length)
let noName = 0
for (const [p, t] of Object.entries(texts)) {
  const lines = t.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 4)
  const r = parseResumeText(t)
  if (!r.contact.fullName) noName++
  const hit = lines.filter((l) => /\s[|•·]\s/.test(l) && !/^(EXPERIENCE|EDUCATION|SKILLS|SUMMARY|PROFILE)/i.test(l))
  if (hit.length || !r.contact.fullName || /[|•·,]/.test(r.contact.fullName))
    console.log(p.split('/').pop(), JSON.stringify(hit), '=> name:', JSON.stringify(r.contact.fullName), 'title:', JSON.stringify(r.contact.title.slice(0, 40)))
}
console.log('no name', noName)
