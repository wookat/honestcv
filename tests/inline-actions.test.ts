import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { CopyTargetNote } from '../src/components/CopyTargetNote'
import type { JobListing, PipelineEntry } from '../src/lib/jobs'
import { emptyResume, type ResumeVersion } from '../src/lib/resume'
import { INLINE_ACTION, INLINE_LABEL, INLINE_LINK } from '../src/lib/utils'

const srcDir = path.resolve(import.meta.dirname, '../src')
const tsxFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name)
    return statSync(p).isDirectory() ? tsxFiles(p) : p.endsWith('.tsx') ? [p] : []
  })

/**
 * Every element whose className interpolates INLINE_ACTION / INLINE_LINK, with the JSX that
 * directly follows its opening tag (brace-aware, so `onClick={() => …}` does not end the tag early).
 */
const inlineSites = (): { file: string; line: number; kind: string; firstChild: string }[] => {
  const out: { file: string; line: number; kind: string; firstChild: string }[] = []
  for (const file of tsxFiles(srcDir)) {
    const src = readFileSync(file, 'utf8')
    const re = /\$\{(INLINE_ACTION|INLINE_LINK)\}/g
    for (const m of src.matchAll(re)) {
      let i = m.index + m[0].length
      // inside `className={…}`; walk to the `>` that closes the opening tag
      let depth = 1
      for (; i < src.length; i++) {
        const ch = src[i]
        if (ch === '{') depth++
        else if (ch === '}') depth--
        else if (ch === '>' && depth === 0) break
      }
      const rest = src.slice(i + 1).trimStart()
      out.push({
        file: path.relative(srcDir, file),
        line: src.slice(0, m.index).split('\n').length,
        kind: m[1],
        firstChild: rest.slice(0, 40),
      })
    }
  }
  return out
}

describe('R852: inline actions and links reach 32px on touch widths and never steal a neighbour', () => {
  it('extend 8px either side of the line (fits the product row gaps), nothing from sm up', () => {
    expect(INLINE_ACTION).toBe('relative -my-2 inline-flex items-center py-2 sm:my-0 sm:py-0')
    expect(INLINE_LINK).toBe('relative py-2 sm:py-0')
    expect(INLINE_ACTION).not.toMatch(/-my-3|py-3/)
    expect(INLINE_LINK).not.toMatch(/py-3/)
  })

  it('the visible label is raised above a neighbouring action’s invisible padding', () => {
    expect(INLINE_LABEL).toBe('relative z-[1]')
  })

  it('every INLINE_ACTION / INLINE_LINK element wraps its label in INLINE_LABEL', () => {
    const sites = inlineSites()
    expect(sites.length).toBeGreaterThanOrEqual(29)
    const bare = sites.filter((s) => !s.firstChild.startsWith('<span className={INLINE_LABEL}>'))
    expect(bare.map((s) => `${s.file}:${s.line} ${s.kind} → ${s.firstChild}`)).toEqual([])
  })

  it('the /jobs broader-query pill is a real 32px / 24px pill, not a text action with hidden padding', () => {
    const jobs = readFileSync(path.join(srcDir, 'pages/Jobs.tsx'), 'utf8')
    const pill = jobs.match(/onClick=\{\(\) => searchBroader\(b\.query\)\}\s*className="([^"]+)"/)
    expect(pill).not.toBeNull()
    const cls = pill?.[1] ?? ''
    expect(cls).toMatch(/\bmin-h-8\b/)
    expect(cls).toMatch(/\bsm:min-h-6\b/)
    expect(cls).toMatch(/\bborder\b/)
    expect(cls).not.toMatch(/-my-\d/)
  })

  it('renders the copy note with raised labels inside the link and the action', () => {
    const job: JobListing = {
      id: 'j1',
      title: 'Nurse',
      company: 'Clinic',
      category: '',
      type: '',
      location: '',
      postedAt: '',
      salary: '',
      url: '',
      description: 'Ward nurse',
    }
    const version: ResumeVersion = {
      id: 'v1',
      name: 'Copy',
      data: { ...emptyResume(), targetRole: 'Nurse', targetCompany: 'Clinic', jobDescription: 'x' },
      updatedAt: 1,
    }
    const other: ResumeVersion = { ...version, id: 'v2', name: 'Other' }
    const pipeline: PipelineEntry[] = [
      { job, status: 'saved', resumeVersionId: 'v2', updatedAt: 1 },
    ]
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(CopyTargetNote, {
          version,
          pipeline,
          versions: [version, other],
          onLinkToJob: () => {},
        }),
      ),
    )
    expect(html).toContain(`class="${INLINE_LINK} underline underline-offset-2"`)
    expect(html).toContain(`class="${INLINE_ACTION} text-primary underline-offset-2 hover:underline"`)
    expect(html.match(/<span class="relative z-\[1\]">/g)?.length).toBe(2)
    expect(html).toMatch(/<span class="relative z-\[1\]">use this one instead<\/span><\/button>/)
  })
})
