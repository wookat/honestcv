import { describe, expect, it } from 'vitest'
import { parseInlineMarks } from '../src/lib/marks'

const runs = (text: string) => parseInlineMarks(text).map((r) => [r.text, r.bold, r.italic])

describe('inline marks follow CommonMark flanking (R769)', () => {
  it('keeps UK grades literal — "A*, Mathematics A*" is not an italic span', () => {
    expect(runs('A Levels: Chemistry A*, Mathematics A*')).toEqual([
      ['A Levels: Chemistry A*, Mathematics A*', false, false],
    ])
    expect(runs('Rated 5* by 4* reviewers')).toEqual([['Rated 5* by 4* reviewers', false, false]])
  })

  it('still parses real emphasis', () => {
    expect(runs('Built **Python** tooling and *reduced* latency')).toEqual([
      ['Built ', false, false],
      ['Python', true, false],
      [' tooling and ', false, false],
      ['reduced', false, true],
      [' latency', false, false],
    ])
  })
})
