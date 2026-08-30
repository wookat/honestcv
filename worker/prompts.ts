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

/**
 * Draft one bullet that works a missing JD keyword into the resume, grounded
 * strictly in the candidate's existing content (bracketed placeholders where
 * specifics are unknown).
 */
export function buildKeywordBulletMessages(
  keyword: string,
  resumeText: string,
  jobDescription: string,
  role: string
): ChatMessage[] {
  return [
    {
      role: 'system',
      content: `${SYSTEM_WRITER}
The user says they genuinely have experience with a keyword the job description asks for, but it is missing from their resume. Draft exactly ONE work-experience bullet that uses the keyword naturally.
Ground the bullet only in what the resume already shows; where a specific project, metric or scope is unknown, use bracketed placeholders such as [project name] or [add %] for the user to fill in — never invent specifics.
Output the single bullet as one line of plain text. No leading dash, no quotes, no commentary.`,
    },
    {
      role: 'user',
      content: `Keyword to work in: ${keyword}\nTarget role: ${role || 'not specified'}\n\nJob description:\n"""\n${jobDescription.slice(0, 4000)}\n"""\n\nCandidate resume:\n"""\n${resumeText.slice(0, 6000)}\n"""`,
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

export function buildResignationLetterMessages(
  company: string,
  role: string,
  lastDay: string,
  reason: string,
  name: string
): ChatMessage[] {
  return [
    {
      role: 'system',
      content: `You are an expert career writer. Write a professional, gracious resignation letter (120-200 words). Structure: clear statement of resignation with the final working day, one short paragraph of genuine gratitude, an offer to help with the transition, warm closing. Keep the tone respectful and positive regardless of the reason; never badmouth the employer. Never fabricate details — where a specific (manager name, project) is unknown, use a bracketed placeholder like [Manager name]. Plain text, no markdown, no addresses or dates at the top. Start with "Dear [Manager name]," unless a name is given. End with "Sincerely," and the employee's name.`,
    },
    {
      role: 'user',
      content: `Company: ${company}\nCurrent role: ${role}\nLast working day: ${lastDay || 'two weeks from today'}\nEmployee name: ${name || '[Your name]'}${reason.trim() ? `\nContext for tone (do not state negatively): ${reason.slice(0, 500)}` : ''}`,
    },
  ]
}

export function buildInterviewFeedbackMessages(
  question: string,
  answer: string,
  resumeText: string,
  jobDescription: string,
  role: string
): ChatMessage[] {
  return [
    {
      role: 'system',
      content: `You are an interview coach reviewing one practice answer. Assess the candidate's answer to the given question and reply in plain text with exactly these headings:
WHAT WORKED — 2-3 specific strengths of this answer.
WHAT TO IMPROVE — 2-3 concrete, actionable fixes (structure, specificity, relevance to the role).
STRONGER ANSWER — a rewritten answer the candidate could give, grounded only in their real resume content; where a specific detail is unknown, use a bracketed placeholder like [metric] or [project name]. Never invent experience the resume does not support. No markdown syntax beyond the plain headings above.`,
    },
    {
      role: 'user',
      content: `Role: ${role || 'the role'}\n\nInterview question:\n"""\n${question.slice(0, 300)}\n"""\n\nCandidate's answer:\n"""\n${answer.slice(0, 3000)}\n"""${jobDescription.trim() ? `\n\nJob description:\n"""\n${jobDescription.slice(0, 3000)}\n"""` : ''}${resumeText.trim() ? `\n\nCandidate resume:\n"""\n${resumeText.slice(0, 5000)}\n"""` : ''}`,
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
