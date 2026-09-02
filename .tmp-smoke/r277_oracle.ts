/* R277 oracle: no spurious space around styled runs in PDF rich text.
 * Run: npx tsx --tsconfig tsconfig.app.json .tmp-smoke/r277_oracle.ts */
import { writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'

let fail = 0
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) fail++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ` got=${JSON.stringify(got)} want=${JSON.stringify(want)}`}`)
}
const pdfText = (path: string) => execFileSync('pdftotext', [path, '-'], { encoding: 'utf8' })

async function main() {
  const { buildResumePdf } = await import('../src/lib/pdf')
  const { sampleResume } = await import('../src/lib/resume')

  const r = sampleResume()
  r.summary = 'Led **growth** with __rigor__. Then (**fast**) wins, __daily__, at [Acme](https://acme.com).'
  r.skills = 'Languages: __Python__, **Go**'
  r.experience[0].bullets[0] = 'Shipped __v2__; cut costs by **40%**.'
  await writeFile('/tmp/r277.pdf', Buffer.from(await buildResumePdf(r)))
  const txt = pdfText('/tmp/r277.pdf')
  eq('period glued after underline', txt.includes('rigor.'), true)
  eq('paren glued around bold', txt.includes('(fast)'), true)
  eq('comma glued after bold-paren cluster', txt.includes('wins,'), true)
  eq('comma glued after underline (daily)', txt.includes('daily,'), true)
  eq('period glued after link', txt.includes('Acme.'), true)
  eq('comma glued after Python', txt.includes('Python,'), true)
  eq('semicolon glued after v2', txt.includes('v2;'), true)
  eq('period glued after 40%', txt.includes('40%.'), true)
  eq('no literal marks', /\*|__/.test(txt), false)
  eq('no space-before-punct anywhere', / [.,;)]/.test(txt), false)

  // Long marked paragraph still wraps (multi-line) without crashing or leaking.
  const long = sampleResume()
  long.summary = `Working with __TypeScript__, **React**, and __Node__. ${'Delivered measurable results across teams. '.repeat(6)}Ended with **impact**.`
  await writeFile('/tmp/r277-long.pdf', Buffer.from(await buildResumePdf(long)))
  const lt = pdfText('/tmp/r277-long.pdf')
  eq('long wrap: no literal marks', /\*|__/.test(lt), false)
  eq('long wrap: glued words intact', lt.includes('TypeScript,') && lt.includes('Node.') && lt.includes('impact.'), true)

  console.log(fail === 0 ? 'ALL GREEN' : `${fail} FAILURES`)
  process.exit(fail === 0 ? 0 : 1)
}
void main()
