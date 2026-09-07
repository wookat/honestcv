/**
 * Markdown-style inline marks in resume text: `**bold**`, `*italic*`,
 * `***bold italic***`, `__underline__` and `[text](url)` links. Marks live
 * inside the ordinary string fields — parsing happens at render/export
 * boundaries and unmatched markers stay literal.
 */

export interface InlineRun {
  text: string
  bold: boolean
  italic: boolean
  underline: boolean
  /** Normalized absolute URL when the run is part of a `[text](url)` link. */
  href?: string
}

const LINK_RE = /\[([^[\]]+)\]\(([^\s()]+)\)/

/** Light URL shape check; scheme-less hosts like `example.com/x` pass. */
function linkHref(raw: string): string | null {
  if (/^https?:\/\/[^\s]+\.[^\s]+/i.test(raw)) return raw
  if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(?:[/?#][^\s]*)?$/i.test(raw)) return `https://${raw}`
  return null
}

const MARK_RE = /(\*\*\*(?:[^*]|\*(?!\*\*))+\*\*\*|\*\*(?:[^*]|\*(?!\*))+\*\*|\*[^*\s](?:[^*]*[^*\s])?\*|__(?:[^_]|_(?!_))+__)/

export function hasInlineMarks(text: string): boolean {
  if (MARK_RE.test(text)) return true
  const l = LINK_RE.exec(text)
  return !!l && linkHref(l[2]) !== null
}

export function parseInlineMarks(text: string): InlineRun[] {
  const runs: InlineRun[] = []
  let rest = text
  while (rest) {
    const l = LINK_RE.exec(rest)
    if (!l) {
      runs.push(...parseMarkRuns(rest))
      break
    }
    const href = linkHref(l[2])
    const cut = l.index + l[0].length
    if (href) {
      if (l.index > 0) runs.push(...parseMarkRuns(rest.slice(0, l.index)))
      runs.push(...parseMarkRuns(l[1]).map((r) => ({ ...r, href })))
    } else {
      runs.push(...parseMarkRuns(rest.slice(0, cut)))
    }
    rest = rest.slice(cut)
  }
  return runs.length ? runs : [{ text: '', bold: false, italic: false, underline: false }]
}

/** Bold/italic/underline parsing for link-free text. */
function parseMarkRuns(text: string): InlineRun[] {
  const runs: InlineRun[] = []
  let rest = text
  while (rest) {
    const m = MARK_RE.exec(rest)
    if (!m) {
      runs.push(...plainRuns(rest))
      break
    }
    if (m.index > 0) runs.push(...plainRuns(rest.slice(0, m.index)))
    const token = m[0]
    if (token.startsWith('***')) {
      runs.push(...innerRuns(token.slice(3, -3), { bold: true, italic: true }))
    } else if (token.startsWith('**')) {
      runs.push(...innerRuns(token.slice(2, -2), { bold: true, italic: false }))
    } else if (token.startsWith('__')) {
      runs.push(
        ...parseMarkRuns(token.slice(2, -2)).map((r) => ({ ...r, underline: true }))
      )
    } else {
      runs.push(...innerRuns(token.slice(1, -1), { bold: false, italic: true }))
    }
    rest = rest.slice(m.index + token.length)
  }
  return runs
}

const UNDER_RE = /(__(?:[^_]|_(?!_))+__)/

/** Plain (asterisk-free) text may still carry `__underline__` tokens. */
function plainRuns(text: string): InlineRun[] {
  const runs: InlineRun[] = []
  let rest = text
  while (rest) {
    const m = UNDER_RE.exec(rest)
    if (!m) {
      runs.push({ text: rest, bold: false, italic: false, underline: false })
      break
    }
    if (m.index > 0)
      runs.push({ text: rest.slice(0, m.index), bold: false, italic: false, underline: false })
    runs.push({ text: m[0].slice(2, -2), bold: false, italic: false, underline: true })
    rest = rest.slice(m.index + m[0].length)
  }
  return runs
}

/** Text inside a bold/italic token may nest `__underline__`. */
function innerRuns(text: string, style: { bold: boolean; italic: boolean }): InlineRun[] {
  return plainRuns(text).map((r) => ({ ...r, bold: style.bold, italic: style.italic }))
}

export function stripInlineMarks(text: string): string {
  if (!hasInlineMarks(text)) return text
  return parseInlineMarks(text)
    .map((r) => r.text)
    .join('')
}

/** Plain text with link targets preserved as `label (url)` — for TXT export,
 *  where a stripped link would otherwise lose the address entirely. */
export function stripInlineMarksKeepLinks(text: string): string {
  if (!hasInlineMarks(text)) return text
  const runs = parseInlineMarks(text)
  let out = ''
  let i = 0
  while (i < runs.length) {
    const href = runs[i].href
    if (!href) {
      out += runs[i].text
      i++
      continue
    }
    let label = ''
    while (i < runs.length && runs[i].href === href) {
      label += runs[i].text
      i++
    }
    out += label
    if (label !== href && `https://${label}` !== href) out += ` (${href})`
  }
  return out
}

/** `[label](target)` tokens whose target is not an acceptable URL — the shape
 *  Ctrl/Cmd+K leaves behind when the `url` placeholder is never replaced. */
export function unfinishedLinks(text: string): { token: string; label: string; target: string }[] {
  const out: { token: string; label: string; target: string }[] = []
  for (const m of text.matchAll(new RegExp(LINK_RE.source, 'g'))) {
    if (linkHref(m[2]) === null) out.push({ token: m[0], label: m[1], target: m[2] })
  }
  return out
}

/** Uppercase the visible text of a marked string, leaving `](url)` link
 *  targets untouched so uppercase templates don't corrupt hrefs. */
export function upperInlineMarks(text: string): string {
  return text.replace(/\]\([^)]*\)|[^\]]+|\]/g, (m) =>
    m.startsWith('](') ? m : m.toUpperCase()
  )
}

/** Toggle-wrap a textarea selection with a mark; returns the next value and selection. */
export function wrapSelection(
  value: string,
  start: number,
  end: number,
  mark: '**' | '*' | '__'
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

/** Toggle-wrap a textarea selection as a `[text](url)` link. Wrapping leaves
 *  the `url` placeholder selected for immediate typing; a selection that is
 *  already a full link token unwraps back to its label. */
export function wrapLink(
  value: string,
  start: number,
  end: number
): { value: string; start: number; end: number } | null {
  if (start === end) return null
  const before = value.slice(0, start)
  const sel = value.slice(start, end)
  const after = value.slice(end)
  const full = new RegExp(`^${LINK_RE.source}$`).exec(sel)
  if (full) {
    return { value: before + full[1] + after, start, end: start + full[1].length }
  }
  const core = sel.trim()
  if (!core || /[[\]]/.test(core)) return null
  const lead = sel.slice(0, sel.length - sel.trimStart().length)
  const trail = sel.slice(sel.trimEnd().length)
  const next = before + lead + `[${core}](url)` + trail + after
  const urlStart = start + lead.length + core.length + 3
  return { value: next, start: urlStart, end: urlStart + 3 }
}

/** Serialize a contentEditable subtree back to marked-up text, mapping
 *  B/STRONG → `**`, I/EM → `*`, U → `__` and A → `[text](href)` so native
 *  Ctrl+B/I/U edits and existing links round-trip. */
export function domToMarks(node: Node): string {
  const walk = (n: Node, bold: boolean, italic: boolean, under: boolean): string => {
    if (n.nodeType === Node.TEXT_NODE) {
      const t = n.textContent ?? ''
      if (!t) return ''
      const trimmed = t.replace(/\s+/g, ' ')
      const core = trimmed.trim()
      if (!core) return trimmed
      const lead = trimmed.slice(0, trimmed.length - trimmed.trimStart().length)
      const trail = trimmed.slice(trimmed.trimEnd().length)
      const mark = bold && italic ? '***' : bold ? '**' : italic ? '*' : ''
      const marked = mark + core + mark
      return lead + (under ? `__${marked}__` : marked) + trail
    }
    if (n.nodeType !== Node.ELEMENT_NODE) return ''
    const el = n as HTMLElement
    const tag = el.tagName
    if (tag === 'BR') return ' '
    if (tag === 'A') {
      const href = el.getAttribute('href') ?? ''
      let label = ''
      for (const child of Array.from(el.childNodes)) label += walk(child, bold, italic, under)
      const core = label.trim()
      if (!core) return label
      return href ? `[${core}](${href})` : core
    }
    const b = bold || tag === 'B' || tag === 'STRONG' || /bold/.test(el.style.fontWeight)
    const i = italic || tag === 'I' || tag === 'EM' || el.style.fontStyle === 'italic'
    const u = under || tag === 'U' || /underline/.test(el.style.textDecoration)
    let out = ''
    for (const child of Array.from(el.childNodes)) out += walk(child, b, i, u)
    return out
  }
  let out = ''
  for (const child of Array.from(node.childNodes)) out += walk(child, false, false, false)
  // merge adjacent same-mark runs produced by fragmented DOM text nodes
  return out
    .replace(/__ __/g, ' ')
    .replace(/\*\*\* \*\*\*/g, ' ')
    .replace(/\*\* \*\*/g, ' ')
    .replace(/(?<![*])\* \*(?![*])/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Rewrite `__underline__` tokens for Markdown output (`__` means bold in
 *  CommonMark) as inline-HTML `<u>…</u>`; bold/italic marks pass through. */
export function marksToMarkdown(text: string): string {
  return text.replace(/__((?:[^_]|_(?!_))+)__/g, '<u>$1</u>')
}
