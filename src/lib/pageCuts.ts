/** One rendered line box (or image) in content-column px, measured from the column's top. */
export interface LineBox {
  top: number
  bottom: number
}

/**
 * Where the paginated preview cuts its content column into page windows.
 * Returns the offset each page starts at (`[0, …]`, one entry per page). A cut
 * never runs through a line box: when the natural cut at `start + windowH` would
 * split a line, the page ends above that line and it opens the next page. A box
 * taller than a whole page is the one exception and is cut through as before.
 *
 * `slack` (px) absorbs measurement noise: the same text run reports its rect up to
 * a px differently on the first (untransformed) frame and the translated ones. A
 * line whose edge is within `slack` of the cut counts as straddling it, the cut
 * moves at least `slack` above the limit, and when it moves up to a line's top it
 * backs into the gap above that line (up to `slack`, never past the gap's middle).
 */
export function pageCuts(
  lines: readonly LineBox[],
  contentH: number,
  windowH: number,
  slack = 0,
): number[] {
  const starts = [0]
  let start = 0
  while (contentH - start > windowH + 1) {
    const limit = start + windowH
    let cut = limit
    for (const l of lines) {
      if (l.top < limit + slack && l.bottom > limit - slack && l.top > start + slack) {
        cut = Math.min(cut, l.top - Math.min(slack, gapAbove(lines, l, start) / 2), limit - slack)
      }
    }
    if (cut <= start + 1) cut = limit
    starts.push(cut)
    start = cut
  }
  return starts
}

/**
 * Height of the empty band between `line` and the nearest box above it (or the page
 * start). A box that begins above `line` and reaches into it leaves no gap.
 */
const gapAbove = (lines: readonly LineBox[], line: LineBox, start: number) => {
  let floor = start
  for (const l of lines) {
    if (l === line || l.top >= line.top) continue
    floor = Math.max(floor, Math.min(l.bottom, line.top))
  }
  return Math.max(0, line.top - floor)
}

/**
 * Line boxes of every rendered text run and image under `content`, in the
 * column's own px (the frame's `scale()` transform is divided out).
 */
export function lineBoxesOf(content: HTMLElement, scale: number): LineBox[] {
  const rect = content.getBoundingClientRect()
  if (!(scale > 0)) return []
  const out: LineBox[] = []
  const push = (r: DOMRect) => {
    if (r.width > 0 && r.height > 0) {
      out.push({
        top: (r.top - rect.top) / scale,
        bottom: (r.bottom - rect.top) / scale,
      })
    }
  }
  const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent?.trim()) continue
    range.selectNodeContents(n)
    for (const r of range.getClientRects()) push(r)
  }
  for (const img of content.querySelectorAll('img')) push(img.getBoundingClientRect())
  return out
}
