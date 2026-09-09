import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AtsScoreValue } from '../src/components/AtsScoreValue'
import { scoreResume } from '../src/lib/ats'
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
