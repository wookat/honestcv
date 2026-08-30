/**
 * LLM prompt builders for resume AI features. Plain chat-completions
 * message arrays for an OpenAI-compatible relay.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
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

/**
 * Draft candidate summaries from the resume alone (no user draft needed),
 * grounded strictly in the resume's existing content.
 */
export function buildSummaryDraftMessages(resumeText: string, role: string): ChatMessage[] {
  return [
    {
      role: 'system',
      content: `${SYSTEM_WRITER}
The user has a filled resume but no professional summary yet. Write 3 alternative professional summaries (each 2-3 sentences, max 60 words) using ONLY facts present in the resume text — job titles, employers, skills, education, and metrics that appear there. Different emphasis per version (1: concise, 2: impact-focused, 3: keyword/skills-focused). Never invent seniority, metrics, tools, or scope the resume does not show. Reply with ONLY a JSON array of 3 strings — no markdown, no commentary.`,
    },
    {
      role: 'user',
      content: `Target role: ${role || 'not specified'}\n\nCandidate resume:\n"""\n${resumeText.slice(0, 6000)}\n"""`,
    },
  ]
}

/**
 * Suggest additional resume skills related to what the user already has —
 * discovery chips the user taps only for skills they actually possess.
 */
export function buildSkillSuggestMessages(
  skills: string,
  role: string,
  jobDescription: string
): ChatMessage[] {
  const parts = [
    `Suggest up to 12 additional skills this candidate might list on their resume, closely related to their existing skills and target role (adjacent tools, frameworks, methods, and industry-standard names). These are discovery suggestions the user confirms — do NOT repeat skills already listed. Each suggestion must be a short canonical skill name (1-3 words). Reply with ONLY a JSON array of strings — no markdown, no commentary.`,
  ]
  if (role) parts.push(`Target role: ${role}`)
  if (skills) parts.push(`Existing skills: ${skills.slice(0, 1500)}`)
  const jd = jobDescription.trim()
  if (jd) parts.push(`Job description they are targeting:\n"""\n${jd.slice(0, 3000)}\n"""`)
  return [
    {
      role: 'system',
      content:
        'You are an expert on job-market skills taxonomies. You suggest related, real, commonly-recognized skill names for resumes. Never invent niche tools that do not exist.',
    },
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

export function buildInterviewQuestionsMessages(
  resumeText: string,
  jobDescription: string,
  role: string
): ChatMessage[] {
  return [
    {
      role: 'system',
      content: `You are the interviewer for the given role. Write exactly 5 interview questions tailored to this job description and this candidate's resume: a mix of behavioral questions probing their actual experience and role-specific questions from the JD's key requirements. Each question must be a single sentence under 200 characters. Reply with ONLY a JSON array of 5 strings — no markdown, no commentary.`,
    },
    {
      role: 'user',
      content: `Role: ${role || 'the role'}\n\nJob description:\n"""\n${jobDescription.slice(0, 4000)}\n"""\n\nCandidate resume:\n"""\n${resumeText.slice(0, 6000)}\n"""`,
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

export interface AssistantTurn {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Multi-turn resume assistant chat grounded in the user's current draft.
 * The assistant advises and points at in-editor tools; it never edits the
 * resume itself and never invents facts the resume does not contain. It may
 * propose a summary/skills edit via an @@APPLY tail that the user must
 * explicitly confirm in the editor before anything is written.
 */
export function buildAssistantMessages(
  turns: AssistantTurn[],
  resumeText: string,
  jobDescription: string,
  role: string,
  scoreSummary: string
): ChatMessage[] {
  const context = [
    `Target role: ${role.trim() || 'not specified'}`,
    jobDescription.trim()
      ? `Target job description:\n"""\n${jobDescription.slice(0, 4000)}\n"""`
      : 'No target job description provided.',
    resumeText.trim()
      ? `Candidate's current resume draft:\n"""\n${resumeText.slice(0, 6000)}\n"""`
      : 'The resume draft is currently empty.',
    scoreSummary.trim()
      ? `Live ATS score report, computed by the editor from this draft (the same numbers the user sees):\n"""\n${scoreSummary.slice(0, 2500)}\n"""`
      : 'No ATS score report available.',
  ].join('\n\n')
  return [
    {
      role: 'system',
      content: `You are RezUp's resume assistant, chatting inside the resume editor. The user's current resume draft, target role, and target job description are provided below as context.
Rules:
- When the user asks about their ATS score or how to improve it, ground the answer in the live ATS score report: cite the actual score, name the actual failing checks and missing keywords, and recommend the highest-impact fixes from that report. Never invent your own score or checks the report does not show.
- Ground every statement in the resume context. Never invent employers, titles, dates, metrics, or skills the resume does not show; where a detail is unknown, say so or use a bracketed placeholder like [metric].
- Be concise: plain text, short paragraphs or "- " bullet lists, no markdown headings or bold, under 250 words per reply.
- You cannot edit the resume directly. When an in-editor tool fits the request, point the user to it by name: "Tailor to job" (rewrites summary/bullets toward the JD), "Resume health" (checks), "Draft from my resume" (summary drafting), "AI suggest related skills" (skills), the Cover Letter / Interview Prep / Resignation Letter tools, and Auto-fit (layout).
- Exception: when the user explicitly asks you to write or rewrite their summary, or to suggest skills to add, you may propose one concrete edit for them to approve. End your reply with a single line in exactly this form (no markdown, nothing after it):
@@APPLY {"type":"summary","value":"<the full replacement summary, under 700 characters>"}
or
@@APPLY {"type":"skills","value":["Skill One","Skill Two"]}
Only include the tail when the request is clearly for a summary rewrite or skills to add, the proposal is fully grounded in the resume context, and there is exactly one tail. The user sees an Apply button and decides; never present the change as already made.
- Answer questions about job search, interviews, and resume strategy honestly and practically. If asked something unrelated to resumes, careers, or job search, briefly decline and steer back.

${context}`,
    },
    ...turns.map((t) => ({ role: t.role, content: t.content.slice(0, 2000) })),
  ]
}

export type AssistantAction =
  | { type: 'summary'; value: string }
  | { type: 'skills'; value: string[] }

/**
 * Split an assistant reply into visible text and an optional validated
 * @@APPLY action tail. A malformed tail is stripped and ignored.
 */
export function parseAssistantAction(reply: string): {
  text: string
  action: AssistantAction | null
} {
  const idx = reply.lastIndexOf('@@APPLY')
  if (idx === -1) return { text: reply.trim(), action: null }
  const text = reply.slice(0, idx).trim()
  const tail = reply.slice(idx + '@@APPLY'.length).trim()
  try {
    const parsed = JSON.parse(tail) as { type?: unknown; value?: unknown }
    if (parsed.type === 'summary' && typeof parsed.value === 'string' && parsed.value.trim()) {
      return { text, action: { type: 'summary', value: parsed.value.trim().slice(0, 700) } }
    }
    if (parsed.type === 'skills' && Array.isArray(parsed.value)) {
      const skills = parsed.value
        .filter((s): s is string => typeof s === 'string' && Boolean(s.trim()))
        .map((s) => s.trim().slice(0, 40))
        .slice(0, 12)
      if (skills.length > 0) return { text, action: { type: 'skills', value: skills } }
    }
  } catch {
    // fall through — treat as plain text
  }
  return { text, action: null }
}
