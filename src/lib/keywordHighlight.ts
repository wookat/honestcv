/**
 * Paints matched job-description keywords inside the live resume preview using
 * the CSS Custom Highlight API — no DOM mutation, so inline preview editing
 * and pagination are unaffected. Styled by the ::highlight(kw-match) rule.
 */

const HIGHLIGHT_NAME = 'kw-match'

export function supportsKeywordHighlight(): boolean {
  return typeof CSS !== 'undefined' && 'highlights' in CSS
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Word-boundary match for single-word keywords, substring for phrases — mirrors keywordScore. */
function keywordPattern(kw: string): RegExp {
  const escaped = escapeRegExp(kw)
  return kw.includes(' ')
    ? new RegExp(escaped, 'gi')
    : new RegExp(`(?:^|[^a-z0-9])(${escaped})(?=$|[^a-z0-9])`, 'gi')
}

export function clearKeywordHighlight(): void {
  if (supportsKeywordHighlight()) CSS.highlights.delete(HIGHLIGHT_NAME)
}

/** Highlights every occurrence of each keyword within root's text nodes. */
export function applyKeywordHighlight(root: HTMLElement, keywords: string[]): void {
  if (!supportsKeywordHighlight()) return
  const patterns = keywords.filter((k) => k.trim()).map(keywordPattern)
  if (patterns.length === 0) {
    CSS.highlights.delete(HIGHLIGHT_NAME)
    return
  }
  const ranges: Range[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? ''
    if (!text.trim()) continue
    for (const re of patterns) {
      re.lastIndex = 0
      for (let m = re.exec(text); m; m = re.exec(text)) {
        const word = m[1] ?? m[0]
        const start = m.index + m[0].indexOf(word)
        const range = document.createRange()
        range.setStart(node, start)
        range.setEnd(node, start + word.length)
        ranges.push(range)
        // Allow adjacent matches: continue right after this word
        re.lastIndex = start + word.length
      }
    }
  }
  if (ranges.length === 0) CSS.highlights.delete(HIGHLIGHT_NAME)
  else CSS.highlights.set(HIGHLIGHT_NAME, new Highlight(...ranges))
}
