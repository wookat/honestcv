import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AtsScoreValue } from '../src/components/AtsScoreValue'
import { scoreResume } from '../src/lib/ats'
import { countUpValue } from '../src/lib/motion'
import { measureResumePdf } from '../src/lib/pdf'
import { sampleResume, sanitizeResume, visibleResume, type Resume } from '../src/lib/resume'

const src = (file: string) => readFileSync(path.resolve(import.meta.dirname, '..', file), 'utf8')

const PAGE_CHECK = 'Fits the recommended page count'
/** The page-length check as reported; undefined when it is not applicable (na checks are dropped from `checks`). */
const pageCheck = (r: Resume, pages?: number | null) =>
  scoreResume(r, r.jobDescription, pages).checks.find((c) => c.label === PAGE_CHECK)

/** The R820 production fixture: a mid-level draft whose PDF export runs to two pages. */
const fixture = (): Resume => {
  const r = sanitizeResume(JSON.parse(src('tests/fixtures/all-sections.json')))
  if (!r) throw new Error('fixture does not sanitize')
  return r
}

describe('ATS page-length check semantics (R820)', () => {
  const r = sampleResume()

  it('omitted, undefined and null page counts are the same not-applicable check and the same score', () => {
    const omitted = scoreResume(r, r.jobDescription)
    const undef = scoreResume(r, r.jobDescription, undefined)
    const nul = scoreResume(r, r.jobDescription, null)
    expect(pageCheck(r)).toBeUndefined()
    expect(pageCheck(r, undefined)).toBeUndefined()
    expect(pageCheck(r, null)).toBeUndefined()
    expect(pageCheck(r, 0)).toBeUndefined()
    expect(pageCheck(r, 1)).toBeDefined()
    expect(undef.score).toBe(omitted.score)
    expect(nul.score).toBe(omitted.score)
  })

  it('the same resume, job description and page count always give the same score', () => {
    for (const pages of [1, 2, 3]) {
      expect(scoreResume(r, r.jobDescription, pages).score).toBe(
        scoreResume(r, r.jobDescription, pages).score,
      )
    }
  })

  it('one page passes at every level; two pages fail below director and pass at director / executive', () => {
    expect(pageCheck({ ...r, experienceLevel: 'mid' }, 1)?.pass).toBe(true)
    expect(pageCheck({ ...r, experienceLevel: 'mid' }, 2)?.pass).toBe(false)
    expect(pageCheck({ ...r, experienceLevel: 'senior' }, 2)?.pass).toBe(false)
    expect(pageCheck({ ...r, experienceLevel: '' }, 2)?.pass).toBe(false)
    expect(pageCheck({ ...r, experienceLevel: 'director' }, 2)?.pass).toBe(true)
    expect(pageCheck({ ...r, experienceLevel: 'executive' }, 2)?.pass).toBe(true)
    expect(pageCheck({ ...r, experienceLevel: 'executive' }, 3)?.pass).toBe(false)
  })

  it('a two-page mid-level resume scores lower than the same resume with the page count unknown', () => {
    const mid: Resume = { ...r, experienceLevel: 'mid' }
    const blind = scoreResume(mid, mid.jobDescription)
    const two = scoreResume(mid, mid.jobDescription, 2)
    const one = scoreResume(mid, mid.jobDescription, 1)
    expect(two.score).toBeLessThan(blind.score)
    expect(one.score).toBeGreaterThanOrEqual(blind.score)
    // only the page-length check differs: it joins the applicable set, nothing else moves
    expect(two.checks.length).toBe(blind.checks.length + 1)
    expect(two.checks.filter((c) => c.label !== PAGE_CHECK).map((c) => [c.label, c.pass])).toEqual(
      blind.checks.map((c) => [c.label, c.pass]),
    )
    expect(blind.checks.some((c) => c.label === PAGE_CHECK)).toBe(false)
  })
})

describe('the production fixture scores the same everywhere once the PDF is measured (R820)', () => {
  it('exports to two pages and drops from 83 to 79 when that count is scored', async () => {
    const shown = visibleResume(fixture())
    const { pages } = await measureResumePdf(shown)
    expect(pages).toBe(2)
    expect(scoreResume(shown, shown.jobDescription).score).toBe(83)
    expect(scoreResume(shown, shown.jobDescription, pages).score).toBe(79)
    expect(pageCheck(shown)).toBeUndefined()
    expect(pageCheck(shown, pages)?.pass).toBe(false)
    expect(pageCheck(shown, pages)?.hint).toContain('runs 2 pages')
  })
})

describe('AtsScoreValue (R820)', () => {
  it('shows a pending mark, never a page-count-blind number, before the PDF has been measured', () => {
    const html = renderToStaticMarkup(createElement(AtsScoreValue, { resume: fixture() }))
    expect(html).not.toMatch(/\d+\/100/)
    expect(html).toContain('…')
    expect(html).toContain('measuring')
    expect(html).toContain('Measuring the exported PDF&#x27;s page count')
  })
})

describe('every stored-copy score display goes through AtsScoreValue (R820)', () => {
  const dashboard = src('src/pages/Dashboard.tsx')
  const builder = src('src/pages/Builder.tsx')

  it('the dashboard never calls scoreResume itself', () => {
    expect(dashboard).not.toContain('scoreResume(')
    expect(dashboard).toContain("import { AtsScoreValue } from '@/components/AtsScoreValue'")
    expect(dashboard).toContain('Current draft · ATS <AtsScoreValue resume={draft} />')
    expect(dashboard.match(/ATS <AtsScoreValue resume=\{v\.data\} \/>/g)).toHaveLength(2)
  })

  it('the builder scores the open draft with the measured page count and its copies dialog via AtsScoreValue', () => {
    expect(builder).toContain("import { usePdfLength } from '@/lib/usePdfLength'")
    expect(builder).not.toMatch(/function usePdfLength|function whenIdleForPdfMeasure/)
    expect(builder).toContain('scoreResume(shown, shown.jobDescription, pdfLength?.pages ?? null)')
    expect(builder).not.toMatch(/scoreResume\(visibleResume\(/)
    expect(builder).toContain('· ATS <AtsScoreValue resume={v.data} />')
    // the tailoring report compares keyword coverage before / after; it never shows a /100 score
    const tailor = builder.slice(builder.indexOf('const before = scoreResume(snapshot, jd)'))
    expect(tailor.slice(0, 4000)).not.toMatch(/report\.(before|after)\.score\b/)
  })
})

describe('the builder shows no score before its first PDF measurement (R821)', () => {
  const builder = src('src/pages/Builder.tsx')
  const hook = src('src/lib/usePdfLength.ts')

  it('the first measurement starts at once; only re-measurements after edits are debounced', () => {
    expect(hook).toContain('started.current ? delayMs : 0')
    expect(hook).toMatch(/started\.current = true\s*\n\s*measurePdfOnceIdle\(resume\)/)
  })

  it('usePdfLength tells pending (undefined) apart from unavailable (null)', () => {
    const body = hook.slice(hook.indexOf('export function usePdfLength('))
    expect(body).toContain('ResumeLength | null | undefined')
    expect(body.slice(0, 400)).toContain('if (m === null) return undefined')
    expect(body.slice(0, 400)).toContain("if (m === 'unavailable') return null")
  })

  it('every /100 number, the ring, the badge and the readiness tier wait for the measurement', () => {
    expect(builder).toContain('const atsPending = pdfMeasure === undefined')
    expect(builder).toContain('const pdfLength = pdfMeasure ?? null')
    expect(builder).toMatch(/atsPending \? \(\s*<PendingScoreRing size=\{72\} \/>\s*\) : \(\s*<ScoreRing score=\{ats\.score\} size=\{72\} \/>/)
    expect(builder).toContain("{atsPending ? '…' : ats.score}")
    expect(builder).toContain("? 'ATS match score: measuring the exported PDF'")
    expect(builder).toContain('{atsPending ? <PendingScoreMark /> : ats.structureScore}')
    expect(builder).toContain('Score breakdown — ATS {atsPending ? <PendingScoreMark /> : ats.score}/100')
    expect(builder).toContain('{!atsPending && readiness.blockers.length > 0 && (')
    // no other bare score digit is rendered
    expect(builder).not.toMatch(/>\s*\{ats\.score\}\s*</)
    expect(builder.match(/<ScoreRing score=\{ats\.score\}/g)).toHaveLength(1)
    expect(builder).toMatch(/aria-label="ATS match score: measuring the exported PDF's page count"/)
  })

  it('the length meter says "unavailable" when the measurement failed, "measuring" only while pending', () => {
    expect(builder).toContain("? 'Resume length is being measured'\n                      : 'Resume length is unavailable'")
    expect(builder).toMatch(
      /atsPending \? \(\s*'Resume length: measuring[^']*'\s*\) : \(\s*'Resume length: unavailable — the PDF preview could not be prepared[^']*'/,
    )
  })

  it('the ring count-up never swings below its start when the first frame timestamp predates the tween', () => {
    // Production R821 QA sampled the ring at 0, -12, 18, … 79: the rAF timestamp of the first
    // frame preceded the performance.now() the tween was armed with.
    expect(countUpValue(0, 79, -35, 900)).toBe(0)
    expect(countUpValue(0, 79, 0, 900)).toBe(0)
    expect(countUpValue(0, 79, 450, 900)).toBe(69)
    expect(countUpValue(0, 79, 900, 900)).toBe(79)
    expect(countUpValue(0, 79, 1200, 900)).toBe(79)
    expect(countUpValue(79, 83, -35, 900)).toBe(79)
    for (let ms = -200; ms <= 1200; ms += 10) {
      const v = countUpValue(0, 79, ms, 900)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(79)
    }
  })
})
