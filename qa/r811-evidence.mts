// R811 evidence: do the 186 retained texts open with a non-English document
// title ("Lebenslauf", "Currículum Vitae", "Hoja de Vida", "Currículo",
// "Persönliche Daten", "Datos personales", …) or a bare-city contact row, and
// what does the parser store as the name today? Run: npx vite-node qa/r811-evidence.mts
import { readFileSync } from 'node:fs'
import { parseResumeText } from '../src/lib/importText'

const texts: Record<string, string> = {}
for (const k of Object.keys(JSON.parse(readFileSync('/home/ubuntu/qa/r776-text-replay.json', 'utf8'))))
  texts[`text:${k}`] = readFileSync(k, 'utf8')
const pdf = JSON.parse(readFileSync('/home/ubuntu/qa/r786-extract-after.json', 'utf8')) as Record<string, string>
for (const k of Object.keys(pdf)) texts[`pdf:${k}`] = pdf[k]

const TITLE =
  /^(?:lebenslauf|curr[ií]cul[ou]m?(?:\s+vit[aæ]e?)?|hoja\s+de\s+vida|cv|r[ée]sum[ée]|curriculum\s+vit[aæ]e?|pers[öo]nliche\s+(?:daten|angaben)|angaben\s+zur\s+person|datos\s+personales|informaci[óo]n\s+personal|dados\s+pessoais|informa[çc][õo]es\s+pessoais|coordonn[ée]es|informations\s+personnelles|[ée]tat\s+civil|personal\s+(?:details|information))\s*:?$/i
let hits = 0
let nonEnglish = 0
for (const k of Object.keys(texts).sort()) {
  const lines = texts[k].split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 8)
  for (let i = 0; i < lines.length; i++) {
    if (!TITLE.test(lines[i])) continue
    hits++
    if (!/^(?:cv|r[ée]sum[ée]|curriculum\s+vitae|personal\s+(?:details|information))\s*:?$/i.test(lines[i])) nonEnglish++
    const r = parseResumeText(texts[k])
    console.log(`${k.slice(0, 70)}\n   L${i}: ${lines[i]}\n   name=${JSON.stringify(r.contact.fullName)} title=${JSON.stringify(r.contact.title)}`)
  }
}
console.log(`document-title lines in the first 8: ${hits} (non-English ${nonEnglish}) / ${Object.keys(texts).length} files`)

// non-ASCII letters in the first 8 lines — which files are not English at all?
let foreign = 0
for (const k of Object.keys(texts).sort()) {
  const head = texts[k].split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 8).join(' | ')
  if (/[äöüßáéíóúñçãõàèêôûœæ]/i.test(head)) {
    foreign++
    console.log(`accented head: ${k.slice(0, 60)} :: ${head.slice(0, 120)}`)
  }
}
console.log(`files with accented letters in the first 8 lines: ${foreign}`)
