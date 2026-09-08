// R790 evidence: the same resume, exported in each product language, scored by /ats-checker's text path.
import { resumeToMarkdown, resumeToPlainText, sampleResume, type Resume } from '../src/lib/resume'
import { scoreResumeText } from '../src/lib/ats'
import { plainResumeText } from '../src/lib/markdownText'

const JD = `Senior Frontend Engineer
Requirements:
- 4+ years building web applications with React and TypeScript
- Experience with Node.js, PostgreSQL and AWS
- CI/CD, Docker, GraphQL and Jest`

const build = (language?: Resume['language']): Resume => {
  const r = sampleResume()
  if (language) r.language = language
  return r
}

const langs = ['en', 'es', 'fr', 'de', 'pt'] as const
const base = new Map<string, boolean>()
for (const lang of langs) {
  const r = build(lang === 'en' ? undefined : lang)
  for (const [fmt, text] of [
    ['txt', resumeToPlainText(r, { keepLinkUrls: true })],
    ['md', plainResumeText(resumeToMarkdown(r))],
  ] as const) {
    const res = scoreResumeText(text, JD)
    const diffs: string[] = []
    for (const c of res.checks) {
      const k = c.label
      if (lang === 'en' && fmt === 'txt') base.set(k, c.pass)
      else if (!base.has(k)) diffs.push(`+${k}`)
      else if (base.get(k) !== c.pass) diffs.push(`${k}: ${base.get(k)} → ${c.pass}`)
    }
    if (lang !== 'en' || fmt !== 'txt')
      for (const k of base.keys()) if (!res.checks.some((c) => c.label === k)) diffs.push(`−${k}`)
    console.log(
      `${lang} ${fmt}: score ${res.score} structure ${res.structureScore} keyword ${res.keywordScore} checks ${res.checks.length}` +
        (diffs.length ? `\n   ${diffs.join('\n   ')}` : '')
    )
  }
}
