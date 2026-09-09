// A Markdown résumé (our own .md export, a GitHub profile): drop the heading
// markers, the *(dates)* emphasis, link syntax and whole-line italics so the
// lines read like the plain-text shape. Inline marks inside bullets stay.
export const looksLikeMarkdown = (raw: string) =>
  (raw.match(/^#{1,6}\s+\S/gm) ?? []).length >= 2

export function unmarkdown(raw: string): string {
  return raw
    .split(/\r?\n/)
    .map((l) =>
      l
        .replace(/^#{1,6}\s+/, '')
        .replace(/\s\*\((.*?)\)\*\s*$/, ' ($1)')
        .replace(/\[([^\]]+)\]\((\S+?)\)/g, '$1 ($2)')
        .replace(/^\*([^*]+)\*$/, '$1')
    )
    .join('\n')
}

/** The `## …` section headings of a Markdown résumé (trimmed, ≤ 60 chars); [] for anything else. */
export function markdownSectionHeadings(raw: string): string[] {
  if (!looksLikeMarkdown(raw)) return []
  return [...raw.matchAll(/^##\s+(\S.*?)(?:\s+#+)?\s*$/gm)].map((m) => m[1].trim()).filter((t) => t.length <= 60)
}

/** Markdown résumé text as plain text; anything else unchanged. */
export const plainResumeText = (raw: string) => (looksLikeMarkdown(raw) ? unmarkdown(raw) : raw)
