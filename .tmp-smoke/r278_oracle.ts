// R278 oracle: inline marks in entry headline lines render (not literal) in PDF + DOCX
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { sampleResume } from '@/lib/resume'
import { buildResumePdf } from '@/lib/pdf'

let fail = 0
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ` got=${JSON.stringify(got)} want=${JSON.stringify(want)}`}`)
  if (!ok) fail++
}

async function main() {
  const r = sampleResume()
  r.experience[0].role = '**Senior** __Engineer__'
  r.education[0].degree = '*M.S.* in __CS__'
  if (r.projects[0]) r.projects[0].name = '__Atlas__ *Pipeline*'
  const dir = mkdtempSync(join(tmpdir(), 'r278-'))
  const pdfBytes = await buildResumePdf(r)
  const pdfPath = join(dir, 'r.pdf')
  writeFileSync(pdfPath, pdfBytes)
  const txt = execFileSync('pdftotext', ['-layout', pdfPath, '-']).toString()
  eq('role words extracted', txt.includes('Senior Engineer'), true)
  eq('degree words extracted', txt.includes('M.S. in CS'), true)
  eq('no literal marks in pdf', /\*\*|__/.test(txt), false)
  // dates still on the same line as the marked role
  const roleLine = txt.split('\n').find((l) => l.includes('Senior Engineer')) ?? ''
  eq('dates share role line', /\d{4}/.test(roleLine), true)

  // mark-free regression: byte-identical inputs produce clean output
  const plain = sampleResume()
  const ptxt = execFileSync('pdftotext', ['-layout', '-', '-'], {
    input: Buffer.from(await buildResumePdf(plain)),
  }).toString()
  eq('mark-free pdf clean', /\*\*|__/.test(ptxt), false)

  // DOCX: real underline/italic runs, no literal marks
  const { downloadResumeDocx } = await import('@/lib/docx')
  const saved: Blob[] = []
  ;(globalThis as unknown as { document: unknown }).document = {
    createElement: () => ({ click() {}, set href(_: string) {}, set download(_: string) {} }),
    body: { appendChild() {}, removeChild() {} },
  }
  ;(globalThis as unknown as { URL: unknown }).URL = Object.assign(URL, {
    createObjectURL: (b: Blob) => (saved.push(b), 'blob:x'),
    revokeObjectURL: () => {},
  })
  await downloadResumeDocx(r, 'r278.docx')
  const buf = Buffer.from(await saved[0].arrayBuffer())
  const docxPath = join(dir, 'r.docx')
  writeFileSync(docxPath, buf)
  const xml = execFileSync('bash', ['-c', `cd ${dir} && unzip -p r.docx word/document.xml`]).toString()
  eq('docx no literal marks', /\*\*|__/.test(xml.replace(/<[^>]+>/g, '')), false)
  eq('docx has underline runs', /<w:u\b/.test(xml), true)
  eq('docx Senior present', xml.includes('Senior'), true)
  console.log(fail ? `${fail} FAILURES` : 'ALL GREEN')
  if (fail) process.exit(1)
}
main()
