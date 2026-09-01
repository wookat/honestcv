/**
 * Markdown-style inline marks in resume text: `**bold**`, `*italic*`, and
 * `***bold italic***`. Marks live inside the ordinary string fields — parsing
 * happens at render/export boundaries and unmatched asterisks stay literal.
 */

export interface InlineRun {
  text: string
  bold: boolean
  italic: boolean
}

const MARK_RE = /(\*\*\*(?:[^*]|\*(?!\*\*))+\*\*\*|\*\*(?:[^*]|\*(?!\*))+\*\*|\*[^*\s](?:[^*]*[^*\s])?\*)/

export function hasInlineMarks(text: string): boolean {
  return MARK_RE.test(text)
}

export function parseInlineMarks(text: string): InlineRun[] {
  const runs: InlineRun[] = []
  let rest = text
  while (rest) {
    const m = MARK_RE.exec(rest)
    if (!m) {
      runs.push({ text: rest, bold: false, italic: false })
      break
    }
    if (m.index > 0) runs.push({ text: rest.slice(0, m.index), bold: false, italic: false })
    const token = m[0]
    if (token.startsWith('***')) {
      runs.push({ text: token.slice(3, -3), bold: true, italic: true })
    } else if (token.startsWith('**')) {
      runs.push({ text: token.slice(2, -2), bold: true, italic: false })
    } else {
      runs.push({ text: token.slice(1, -1), bold: false, italic: true })
    }
    rest = rest.slice(m.index + token.length)
  }
  return runs.length ? runs : [{ text: '', bold: false, italic: false }]
}

export function stripInlineMarks(text: string): string {
  if (!hasInlineMarks(text)) return text
  return parseInlineMarks(text)
    .map((r) => r.text)
    .join('')
}

/** Toggle-wrap a textarea selection with a mark; returns the next value and selection. */
export function wrapSelection(
  value: string,
  start: number,
  end: number,
  mark: '**' | '*'
): { value: string; start: number; end: number } | null {
  if (start === end) return null
  const before = value.slice(0, start)
  const sel = value.slice(start, end)
  const after = value.slice(end)
  if (sel.startsWith(mark) && sel.endsWith(mark) && sel.length >= mark.length * 2) {
    const inner = sel.slice(mark.length, sel.length - mark.length)
    return { value: before + inner + after, start, end: start + inner.length }
  }
  if (before.endsWith(mark) && after.startsWith(mark)) {
    return {
      value: before.slice(0, -mark.length) + sel + after.slice(mark.length),
      start: start - mark.length,
      end: end - mark.length,
    }
  }
  const trimmedStart = sel.length - sel.trimStart().length
  const trimmedEnd = sel.length - sel.trimEnd().length
  const core = sel.slice(trimmedStart, sel.length - trimmedEnd)
  if (!core) return null
  const next =
    before + sel.slice(0, trimmedStart) + mark + core + mark + sel.slice(sel.length - trimmedEnd) + after
  return { value: next, start, end: end + mark.length * 2 }
}

/** Serialize a contentEditable subtree back to marked-up text, mapping
 *  B/STRONG → `**` and I/EM → `*` so native Ctrl+B/Ctrl+I edits round-trip. */
export function domToMarks(node: Node): string {
  const walk = (n: Node, bold: boolean, italic: boolean): string => {
    if (n.nodeType === Node.TEXT_NODE) {
      const t = n.textContent ?? ''
      if (!t) return ''
      const trimmed = t.replace(/\s+/g, ' ')
      const core = trimmed.trim()
      if (!core) return trimmed
      const lead = trimmed.slice(0, trimmed.length - trimmed.trimStart().length)
      const trail = trimmed.slice(trimmed.trimEnd().length)
      const mark = bold && italic ? '***' : bold ? '**' : italic ? '*' : ''
      return lead + mark + core + mark + trail
    }
    if (n.nodeType !== Node.ELEMENT_NODE) return ''
    const el = n as HTMLElement
    const tag = el.tagName
    if (tag === 'BR') return ' '
    const b = bold || tag === 'B' || tag === 'STRONG' || /bold/.test(el.style.fontWeight)
    const i = italic || tag === 'I' || tag === 'EM' || el.style.fontStyle === 'italic'
    let out = ''
    for (const child of Array.from(el.childNodes)) out += walk(child, b, i)
    return out
  }
  let out = ''
  for (const child of Array.from(node.childNodes)) out += walk(child, false, false)
  // merge adjacent same-mark runs produced by fragmented DOM text nodes
  return out
    .replace(/\*\*\* \*\*\*/g, ' ')
    .replace(/\*\* \*\*/g, ' ')
    .replace(/(?<![*])\* \*(?![*])/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
