// R790: R789 scorer vs this branch on the 114 retained texts + 72 R777-extractor PDF texts (no JD: structure checks only).
import { readFileSync } from 'node:fs'
import { scoreResumeText as scoreNew } from '../src/lib/ats'
import { scoreResumeText as scoreOld } from '../src/lib/_r789_ats'

const texts: Record<string, string> = {}
for (const k of Object.keys(JSON.parse(readFileSync('/home/ubuntu/qa/r776-text-replay.json', 'utf8'))))
  texts[`text:${k}`] = readFileSync(k, 'utf8')
const pdf = JSON.parse(readFileSync('/home/ubuntu/qa/r786-extract-after.json', 'utf8')) as Record<string, string>
for (const k of Object.keys(pdf)) texts[`pdf:${k}`] = pdf[k]

let same = 0
for (const k of Object.keys(texts).sort()) {
  const b = scoreOld(texts[k], ''), a = scoreNew(texts[k], '')
  const bc = b.checks.map((c) => `${c.label}=${c.pass}`), ac = a.checks.map((c) => `${c.label}=${c.pass}`)
  if (a.score === b.score && bc.join() === ac.join()) same++
  else {
    console.log(`CHANGED ${k}: ${b.score} → ${a.score}`)
    for (const l of new Set([...bc, ...ac])) if (!bc.includes(l) || !ac.includes(l)) console.log('   ', bc.includes(l) ? '-' : '+', l)
  }
}
console.log(`same ${same} / ${Object.keys(texts).length}`)
