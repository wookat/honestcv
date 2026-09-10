// R813: parse a spread of retained real documents into Resume JSON so the preview/PDF page-count
// probe can run on more than one authored fixture.
// Run: npx vite-node qa/r813-fixtures.mts
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { parseResumeText } from '../src/lib/importText'

const pdf = JSON.parse(readFileSync('/home/ubuntu/qa/r786-extract-after.json', 'utf8')) as Record<string, string>
const picks: Record<string, string> = {
  sumit: '/home/ubuntu/qa/r763-pdfs/pages-mac-sumit.pdf',
  oxford: '/home/ubuntu/qa/r763-pdfs/word-mac-quartz-stonybrook.pdf',
  kenneth: '/home/ubuntu/qa/r773-linkedin/Kenneth-Adams-LinkedIn-Profile-and-Resume.pdf',
  giovanni: '/home/ubuntu/qa/r773-linkedin/giovanni-toraldo-cv.pdf',
  bhu: '/home/ubuntu/qa/r773-linkedin/BhuResumeLatest.pdf',
  alex: '/home/ubuntu/qa/alex-morgan-resume.pdf',
}
mkdirSync('/home/ubuntu/qa/r813', { recursive: true })
for (const [name, key] of Object.entries(picks)) {
  const r = parseResumeText(pdf[key])
  const bullets = r.experience.reduce((n, e) => n + e.bullets.length, 0)
  console.log(name, r.contact.fullName, 'exp', r.experience.length, 'bullets', bullets, 'edu', r.education.length, 'summary', r.summary.length)
  writeFileSync(`/home/ubuntu/qa/r813/${name}.json`, JSON.stringify(r))
}
