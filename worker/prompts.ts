/**
 * LLM prompt builders for resume AI features. Plain chat-completions
 * message arrays for an OpenAI-compatible relay.
 */

export interface ChatMessage {
  role: 'system' | 'user'
  content: string
}

export type RewriteKind = 'bullets' | 'summary' | 'skills'

const SYSTEM_WRITER = `You are an expert resume writer for the US/international job market.
Rules:
- Never invent employers, titles, dates, degrees, metrics, or tools that are not in the input. You may sharpen phrasing, but every fact must come from the user's text.
- If a bullet would be stronger with a number the input doesn't provide, insert a bracketed placeholder such as [add %] or [team size] instead of making one up.
- Use strong action verbs, active voice, and quantified impact where the input provides numbers.
- ATS-friendly: no tables, no columns, no emojis, no first-person pronouns.
- Keep each bullet to one line where possible (max ~2 lines), start with a verb, no trailing periods.
- Output plain text only. No markdown, no commentary, no headings.`

export function buildRewriteMessages(
  kind: RewriteKind,
  text: string,
  context: { role?: string; jobDescription?: string },
  variants = false
): ChatMessage[] {
  const jd = context.jobDescription?.trim()
  const target = context.role?.trim()
  let task: string
  if (kind === 'summary') {
    task = `Rewrite the following professional summary in 2-3 punchy sentences (max 60 words). No first person ("I", "my").`
  } else if (kind === 'skills') {
    task = `Clean up the following skills list: deduplicate, group related skills, use canonical industry names, order by relevance. Output a single comma-separated list.`
  } else {
    task = `Rewrite the following work-experience bullet points. Return the same number of bullets (or merge only redundant ones), one per line, each starting with "- ".`
  }
  if (variants && kind !== 'skills') {
    task += `\nProduce 3 alternative versions with different emphasis (1: concise, 2: impact-focused, 3: keyword/skills-focused). Separate the versions with a line containing only "===". No labels or numbering — just the content.`
  }
  const parts = [task]
  if (target) parts.push(`Target role: ${target}`)
  if (jd)
    parts.push(
      `Tailor wording toward this job description (mirror its keywords where truthful):\n"""\n${jd.slice(0, 4000)}\n"""`
    )
  parts.push(`Input:\n"""\n${text.slice(0, 4000)}\n"""`)
  return [
    { role: 'system', content: SYSTEM_WRITER },
    { role: 'user', content: parts.join('\n\n') },
  ]
}

export interface TailorItem {
  id: string
  kind: 'summary' | 'bullet'
  text: string
}

/**
 * Tailor pass: one call that rewrites the summary and each bullet toward a
 * specific JD, returning strict JSON so the UI can show per-item diffs.
 */
export function buildTailorMessages(
  items: TailorItem[],
  jobDescription: string,
  role: string
): ChatMessage[] {
  const list = items
    .map((i) => JSON.stringify({ id: i.id, kind: i.kind, text: i.text.slice(0, 500) }))
    .join('\n')
  return [
    {
      role: 'system',
      content: `${SYSTEM_WRITER}
You are tailoring an existing resume to one specific job description.
For each input item, decide whether rewording it toward the JD makes it stronger. Mirror the JD's exact keywords and phrasing ONLY where the underlying fact is already in the item's text — never add tools, metrics, scope, or responsibilities the item does not contain.
Output STRICT JSON only: an array of objects {"id": string, "text": string} for the items you changed. Omit items that are already well-tailored. No markdown fences, no commentary.`,
    },
    {
      role: 'user',
      content: `Target role: ${role || 'not specified'}\n\nJob description:\n"""\n${jobDescription.slice(0, 4000)}\n"""\n\nResume items (JSON, one per line):\n${list}`,
    },
  ]
}

export function buildCoverLetterMessages(
  resumeText: string,
  jobDescription: string,
  company: string,
  role: string
): ChatMessage[] {
  return [
    {
      role: 'system',
      content: `You are an expert cover-letter writer. Write a concise, specific, one-page cover letter (250-350 words). Structure: hook tied to the company/role, 2 short paragraphs mapping the candidate's real experience to the job's needs, warm closing. Never fabricate experience. Plain text, no markdown. Start with "Dear Hiring Manager," unless a name is given. Do not include addresses or dates.`,
    },
    {
      role: 'user',
      content: `Company: ${company || 'the company'}\nRole: ${role || 'the role'}\n\nJob description:\n"""\n${jobDescription.slice(0, 4000)}\n"""\n\nCandidate resume:\n"""\n${resumeText.slice(0, 6000)}\n"""`,
    },
  ]
}

export function buildInterviewBriefMessages(
  resumeText: string,
  jobDescription: string,
  role: string
): ChatMessage[] {
  return [
    {
      role: 'system',
      content: `You are an interview coach. Produce a practical interview prep brief with exactly these sections, in plain text with these headings:
LIKELY QUESTIONS — 8 questions this specific role/JD will ask, each followed by a one-line answer angle drawn from the candidate's real resume.
YOUR STORIES — 3 STAR stories the candidate should prepare, built from their actual experience bullets.
QUESTIONS TO ASK — 4 sharp questions for the interviewer.
GAPS TO PREPARE FOR — 2-3 likely weak spots vs the JD and how to address them honestly.
Never fabricate experience. No markdown syntax beyond the plain headings above.`,
    },
    {
      role: 'user',
      content: `Role: ${role || 'the role'}\n\nJob description:\n"""\n${jobDescription.slice(0, 4000)}\n"""\n\nCandidate resume:\n"""\n${resumeText.slice(0, 6000)}\n"""`,
    },
  ]
}
