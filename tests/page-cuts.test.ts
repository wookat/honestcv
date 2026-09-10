import { describe, expect, it } from 'vitest'
import { pageCuts, type LineBox } from '../src/lib/pageCuts'

/** `n` stacked lines of `h` px each starting at `top`. */
const stack = (n: number, h: number, top = 0): LineBox[] =>
  Array.from({ length: n }, (_, i) => ({
    top: top + i * h,
    bottom: top + (i + 1) * h,
  }))

describe('R814: page cuts never run through a line box', () => {
  it('a column that fits is one page starting at 0', () => {
    expect(pageCuts(stack(10, 20), 200, 992)).toEqual([0])
    expect(pageCuts([], 0, 992)).toEqual([0])
  })

  it("a cut that would split a line moves up to that line's top", () => {
    // 20px lines, 990px window: line 49 spans 980–1000 and straddles the cut at 990.
    const lines = stack(100, 20)
    const starts = pageCuts(lines, 2000, 990)
    expect(starts[1]).toBe(980)
    // Every page starts on a line top and shows only whole lines.
    for (const s of starts) expect(s % 20).toBe(0)
    for (let i = 1; i < starts.length; i++)
      expect(starts[i] - starts[i - 1]).toBeLessThanOrEqual(990)
    expect(starts).toEqual([0, 980, 1960])
  })

  it('a cut that falls exactly between two lines stays where it is', () => {
    expect(pageCuts(stack(100, 20), 2000, 1000)).toEqual([0, 1000])
  })

  it('the page count follows the moved cuts, not ceil(height / window)', () => {
    // 2 windows' worth of 30px lines whose last line straddles the second cut.
    const lines = stack(66, 30) // 1980px; window 990 → cut at 990 sits between lines
    expect(pageCuts(lines, 1980, 990)).toEqual([0, 990])
    const shifted = stack(66, 30, 5) // every cut now splits a line → 3 pages
    expect(pageCuts(shifted, 1985, 990)).toEqual([0, 965, 1955])
  })

  it('a box taller than a whole page is cut through rather than looping', () => {
    const tall: LineBox[] = [{ top: 0, bottom: 2900 }]
    expect(pageCuts(tall, 2900, 992)).toEqual([0, 992, 1984])
  })

  it('slack treats a line whose edge sits within a px of the cut as straddling it', () => {
    // Without slack the cut at 1000 falls exactly between two 20px lines.
    expect(pageCuts(stack(100, 20), 2000, 1000)).toEqual([0, 1000])
    // With 2px slack the line ending on the limit (980–1000) counts as straddling and the
    // page ends above it; the lines touch, so there is no gap to back into.
    expect(pageCuts(stack(100, 20), 2000, 1000, 2)[1]).toBe(980)
    // A lone line just under the limit (999–1019): the cut sits `slack` above the limit.
    expect(pageCuts([{ top: 999, bottom: 1019 }], 1019, 1000, 2)).toEqual([0, 997])
    // Whole-page-tall boxes and lines flush with the page top are still untouched.
    expect(pageCuts([{ top: 0, bottom: 2900 }], 2900, 992, 2)).toEqual([0, 992, 1984])
  })

  it("a cut moved to a line's top backs into the gap above it, never past the middle", () => {
    // Heading at 1010–1026 straddles the limit 1014, 11px of white above it (990–1010 empty).
    const lines: LineBox[] = [...stack(50, 20), { top: 1010, bottom: 1026 }]
    expect(pageCuts(lines, 1026, 1014, 2)).toEqual([0, 1008])
    // With a 1px gap the cut backs up half of it.
    const tight: LineBox[] = [...stack(50, 20), { top: 1001, bottom: 1021 }]
    expect(pageCuts(tight, 1021, 1010, 2)).toEqual([0, 1000.5])
    // No slack: the cut stays exactly on the line top.
    expect(pageCuts(lines, 1026, 1014)).toEqual([0, 1010])
    // The line above reaches 0.16px into the straddling line (sub-px snapping): there is
    // no gap, so the cut sits on the straddler's top instead of backing into the neighbour.
    const touching: LineBox[] = [
      { top: 979.6, bottom: 1000.6 },
      { top: 1000.44, bottom: 1021.44 },
    ]
    expect(pageCuts(touching, 1021.44, 1016, 2)).toEqual([0, 1000.44])
  })

  it('realistic columns (headings, gaps, wrapped paragraphs): no cut bisects a line, pages never overflow', () => {
    // Deterministic LCG so the layouts are reproducible; the shapes mimic the resume templates:
    // section gaps, headings, 1–4-line paragraphs, and per-frame snapping noise of ≤ 1px.
    let seed = 0x2f6e2b1
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff
    const slack = 1 / 0.665 + 0.5 // cutSlack(scale) at a 543px frame
    for (let layout = 0; layout < 40; layout++) {
      const lines: LineBox[] = []
      let y = 0
      while (y < 6000) {
        y += 8 + Math.floor(rnd() * 30) // section gap
        const lh = 12 + Math.floor(rnd() * 12)
        const n = 1 + Math.floor(rnd() * 4)
        for (let i = 0; i < n; i++) {
          const jitter = rnd() // sub-px snapping between frames
          lines.push({ top: y + jitter, bottom: y + lh + jitter })
          y += lh
        }
      }
      const contentH = y
      const windowH = 992
      const starts = pageCuts(lines, contentH, windowH, slack)
      expect(starts[0]).toBe(0)
      for (let i = 1; i < starts.length; i++) {
        const start = starts[i]
        expect(start).toBeGreaterThan(starts[i - 1])
        // Nothing shown on page i−1 reaches below its window.
        expect(start - starts[i - 1]).toBeLessThanOrEqual(windowH + 1e-6)
        // No line is bisected by the cut (with ≥ slack clearance to either edge, as the
        // second frame may snap the same text up to one device px away).
        for (const l of lines) {
          const bisected = l.top < start - slack && l.bottom > start + slack
          expect(bisected, `layout ${layout} cut ${start} through ${l.top}–${l.bottom}`).toBe(false)
        }
      }
      // The last page holds the rest of the column.
      expect(contentH - starts[starts.length - 1]).toBeLessThanOrEqual(windowH + 1)
    }
  })

  it('overlapping boxes on one line (marker + text) move the cut to the highest top', () => {
    const lines: LineBox[] = [
      { top: 0, bottom: 980 },
      { top: 975, bottom: 1000 }, // glyph that hangs slightly above the text line
      { top: 980, bottom: 1000 },
    ]
    expect(pageCuts(lines, 1000, 990)).toEqual([0, 975])
  })
})
