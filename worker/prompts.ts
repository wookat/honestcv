/**
 * LLM prompt builders for resume AI features. Plain chat-completions
 * message arrays for an OpenAI-compatible relay.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type RewriteKind = 'bullets' | 'summary' | 'skills'

/** Resume output languages the writer endpoints can be asked to reply in. */
const OUTPUT_LANGUAGES: Record<string, string> = {
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
}

/**
 * Ask the writer to reply in the resume's language. Unknown codes and 'en'
 * are no-ops, so the client can always pass the resume's language through.
 */
export function withOutputLanguage(messages: ChatMessage[], language?: string): ChatMessage[] {
  const name = language ? OUTPUT_LANGUAGES[language] : undefined
  if (!name) return messages
  return messages.map((m) =>
    m.role === 'system'
      ? {
          ...m,
          content: `${m.content}\n- Write your entire output in ${name}. Keep every fact from the input unchanged; translate phrasing, not facts.`,
        }
      : m
  )
}

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
  variants = false,
  emphasis?: 'key-numbers',
  avoid: string[] = []
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
  if (kind === 'bullets' && emphasis === 'key-numbers') {
    task += `\nEvery rewritten bullet must emphasize measurable results: lead with a concrete outcome (percentage, money, time saved, volume, team size). Reuse any numbers the input already provides; where a figure is missing, use a bracketed placeholder such as [add %], [add $ amount] or [add number] for the user to fill in — never invent a figure.`
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
  if (avoid.length) parts.push(avoidPart(avoid))
  parts.push(`Input:\n"""\n${text.slice(0, 4000)}\n"""`)
  return [
    { role: 'system', content: SYSTEM_WRITER },
    { role: 'user', content: parts.join('\n\n') },
  ]
}

/** Rejected earlier versions the next round must steer clear of. */
function avoidPart(avoid: string[]): string {
  return `The user rejected these earlier versions — write clearly different takes and do not reuse their phrasing:\n${avoid
    .map((t) => `"""\n${t}\n"""`)
    .join('\n')}`
}

/**
 * Draft candidate summaries from the resume alone (no user draft needed),
 * grounded strictly in the resume's existing content.
 */
export function buildSummaryDraftMessages(
  resumeText: string,
  role: string,
  highlights: string[] = [],
  jobDescription = '',
  avoid: string[] = []
): ChatMessage[] {
  const parts = [`Target role: ${role || 'not specified'}`]
  if (highlights.length)
    parts.push(
      `Emphasize these skills, but only as the resume actually supports them: ${highlights.join(', ')}`
    )
  const jd = jobDescription.trim()
  if (jd)
    parts.push(
      `Tailor wording toward this job description (mirror its keywords only where the resume truthfully supports them):\n"""\n${jd.slice(0, 4000)}\n"""`
    )
  if (avoid.length) parts.push(avoidPart(avoid))
  parts.push(`Candidate resume:\n"""\n${resumeText.slice(0, 6000)}\n"""`)
  return [
    {
      role: 'system',
      content: `${SYSTEM_WRITER}
The user has a filled resume but no professional summary yet. Write 3 alternative professional summaries (each 2-3 sentences, max 60 words) using ONLY facts present in the resume text — job titles, employers, skills, education, and metrics that appear there. Different emphasis per version (1: concise, 2: impact-focused, 3: keyword/skills-focused). Never invent seniority, metrics, tools, or scope the resume does not show. Reply with ONLY a JSON array of 3 strings — no markdown, no commentary.`,
    },
    { role: 'user', content: parts.join('\n\n') },
  ]
}

/**
 * Suggest additional resume skills related to what the user already has —
 * discovery chips the user taps only for skills they actually possess.
 */
export function buildSkillSuggestMessages(
  skills: string,
  role: string,
  jobDescription: string,
  context = '',
  category = ''
): ChatMessage[] {
  const parts = [
    `Suggest up to 12 additional skills this candidate might list on their resume, closely related to their existing skills and target role (adjacent tools, frameworks, methods, and industry-standard names). These are discovery suggestions the user confirms — do NOT repeat skills already listed. Each suggestion must be a short canonical skill name (1-3 words). Reply with ONLY a JSON array of strings — no markdown, no commentary.`,
  ]
  if (role) parts.push(`Target role: ${role}`)
  if (skills) parts.push(`Existing skills: ${skills.slice(0, 1500)}`)
  if (context) parts.push(`The candidate describes what they did: ${context}`)
  if (category) parts.push(`Focus suggestions on this kind of skill: ${category}`)
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
  const list = `[\n${items
    .map((i) => JSON.stringify({ id: i.id, kind: i.kind, text: i.text.slice(0, 500) }))
    .join(',\n')}\n]`
  return [
    {
      role: 'system',
      content: `${SYSTEM_WRITER}
You are tailoring an existing resume to one specific job description.
For each input item, decide whether rewording it toward the JD makes it stronger. Mirror the JD's exact keywords and phrasing ONLY where the underlying fact is already in the item's text — never add tools, metrics, scope, or responsibilities the item does not contain.
Output STRICT JSON only: one array of objects {"id": string, "text": string} for the items you changed, e.g. [{"id":"b0","text":"…"},{"id":"b2","text":"…"}]. Omit items that are already well-tailored. Not one object per line — a single array. No markdown fences, no commentary.`,
    },
    {
      role: 'user',
      content: `Target role: ${role || 'not specified'}\n\nJob description:\n"""\n${jobDescription.slice(0, 4000)}\n"""\n\nResume items (JSON array):\n${list}`,
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
The user says they genuinely have experience with a keyword the job description asks for, but it is missing from their resume. Draft exactly ONE candidate work-experience bullet that uses the keyword naturally — a bullet the user will confirm or reject, not a record of what they did.
Attach the keyword to work the resume already shows (a project, product, system or outcome that is on the resume). Where the resume shows nothing the keyword can attach to, or a project, metric, audience or scope is unknown, use bracketed placeholders such as [project where you used ${keyword}], [team or audience] or [add %] for the user to fill in — never invent specifics.
The job description is there for the keyword's meaning and vocabulary only. Its duties, product and customers are the employer's, not the user's history: do not describe the employer's product or responsibilities as something the user built or did, and do not upgrade the resume's verbs (built → owned, contributed → led) or borrow phrases from the ad that the resume never uses.
Output the single bullet as one line of plain text. No leading dash, no quotes, no commentary.`,
    },
    {
      role: 'user',
      content: `Keyword to work in: ${keyword}\nTarget role: ${role || 'not specified'}\n\nJob description (for the keyword's meaning and vocabulary only — its duties are not the user's history):\n"""\n${jobDescription.slice(0, 4000)}\n"""\n\nCandidate resume:\n"""\n${resumeText.slice(0, 6000)}\n"""`,
    },
  ]
}

/**
 * Draft one bullet for a specific experience, project or involvement entry,
 * grounded strictly in the candidate's existing resume (bracketed placeholders
 * where specifics are unknown, never invented facts).
 */
export function buildSuggestBulletMessages(
  role: string,
  company: string,
  existingBullets: string[],
  resumeText: string,
  variant?: 'key-numbers',
  companyInfo = '',
  section?: 'project' | 'involvement',
  targetRole = '',
  jobDescription = '',
  draft = ''
): ChatMessage[] {
  const existing = existingBullets
    .filter((b) => b.trim())
    .map((b) => `- ${b.slice(0, 300)}`)
    .join('\n')
  const completeLine =
    section === 'project'
      ? "Complete the user's partially written project bullet into exactly ONE finished bullet. Keep the user's words, facts and intent — extend and polish the fragment, never replace it with a different achievement."
      : section === 'involvement'
        ? "Complete the user's partially written involvement bullet into exactly ONE finished bullet. Keep the user's words, facts and intent — extend and polish the fragment, never replace it with a different contribution."
        : "Complete the user's partially written work-experience bullet into exactly ONE finished bullet. Keep the user's words, facts and intent — extend and polish the fragment, never replace it with a different achievement."
  const suggestLine =
    section === 'project'
      ? 'Draft exactly ONE candidate project bullet for the project described by the user — an outcome (what was built, improved, or delivered) the user will confirm or reject.'
      : section === 'involvement'
        ? 'Draft exactly ONE candidate involvement bullet for the volunteer, club or extracurricular role described by the user — a contribution the user will confirm or reject.'
        : 'Draft exactly ONE candidate work-experience bullet for the role described by the user — an achievement the user will confirm or reject.'
  const groundingLine = draft.trim()
    ? 'Ground the completion only in the fragment and what the resume already shows; where a specific project, metric or scope is unknown, use bracketed placeholders such as [project name] or [add %] for the user to fill in — never invent specifics.'
    : 'The bullet is a candidate, not a record: the user has not told you this happened, so it must be one they can check against their own memory. Prefer work the resume already evidences for this entry or nearby entries. Anything the resume does not show — a deliverable, an audience, a scope, a metric — goes in a bracketed placeholder such as [project name], [team or audience] or [add %] instead of being asserted. Do not present a duty from the job description as something the user did; at most offer it as a placeholder-marked candidate.'
  const draftLine = draft.trim() ? completeLine : suggestLine
  return [
    {
      role: 'system',
      content: `${SYSTEM_WRITER}
${draftLine}
${groundingLine}
Do not repeat or lightly rephrase any of the existing bullets; cover a different responsibility or outcome.
Start with a strong action verb. Output the single bullet as one line of plain text ending with a period. No leading dash, no quotes, no commentary.${
        variant === 'key-numbers'
          ? '\nThis bullet must be a KEY-NUMBER bullet: lead with a measurable outcome (percentage, money, time saved, volume, team size). You do not know the real figures, so every number MUST be a bracketed placeholder such as [add %], [add $ amount] or [add number] for the user to fill in — never a concrete number.'
          : ''
      }`,
    },
    {
      role: 'user',
      content: `${
        section === 'project'
          ? `Project: ${role || 'not specified'}\nOrganization: ${company || 'not specified'}`
          : section === 'involvement'
            ? `Role: ${role || 'not specified'}\nOrganization: ${company || 'not specified'}`
            : `Role: ${role || 'not specified'}\nCompany: ${company || 'not specified'}`
      }${
        companyInfo ? `\nCompany info: ${companyInfo}` : ''
      }${
        draft.trim() ? `\nPartially written bullet to complete: "${draft.trim().slice(0, 300)}"` : ''
      }\n\nExisting bullets for this ${
        section === 'project' ? 'project' : 'role'
      }:\n${existing || '(none yet)'}${
        targetRole.trim() ? `\n\nTarget role: ${targetRole.trim()}` : ''
      }${
        jobDescription.trim()
          ? `\n\nTailor wording toward this job description (mirror its keywords only where the resume truthfully supports them; its duties are not the user's history):\n"""\n${jobDescription.slice(0, 4000)}\n"""`
          : ''
      }\n\nCandidate resume:\n"""\n${resumeText.slice(0, 6000)}\n"""`,
    },
  ]
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
}
const DATE_TOKEN = String.raw`(?:[A-Za-z]{3,9}\.?\s+\d{4}|\d{4}-\d{2}|\d{1,2}/\d{4}|\d{4})`
const PRESENT_TOKEN = String.raw`(?:Present|Current|Now|Today|Ongoing)`
const DATE_RANGE_RE = new RegExp(
  String.raw`\((${DATE_TOKEN})\s*[–—-]\s*(${DATE_TOKEN}|${PRESENT_TOKEN})\)`,
  'i'
)

/** Month index (year*12+month) for a resume date token; null when unparseable. */
function monthIndex(token: string, today: Date): number | null {
  const t = token.trim()
  if (new RegExp(`^${PRESENT_TOKEN}$`, 'i').test(t)) {
    return today.getUTCFullYear() * 12 + today.getUTCMonth()
  }
  let m = /^([A-Za-z]{3,9})\.?\s+(\d{4})$/.exec(t)
  if (m) {
    const mon = MONTHS[m[1].slice(0, 4).toLowerCase()] ?? MONTHS[m[1].slice(0, 3).toLowerCase()]
    return mon === undefined ? null : Number(m[2]) * 12 + mon
  }
  m = /^(\d{4})-(\d{2})$/.exec(t)
  if (m) return Number(m[1]) * 12 + Number(m[2]) - 1
  m = /^(\d{1,2})\/(\d{4})$/.exec(t)
  if (m) return Number(m[2]) * 12 + Number(m[1]) - 1
  m = /^(\d{4})$/.exec(t)
  if (m) return Number(m[1]) * 12
  return null
}

const formatMonths = (n: number): string => {
  const y = Math.floor(n / 12)
  const mo = n % 12
  const parts = [y ? `${y} year${y === 1 ? '' : 's'}` : '', mo ? `${mo} month${mo === 1 ? '' : 's'}` : '']
  return parts.filter(Boolean).join(' ') || 'under a month'
}

/**
 * Deterministic tenure arithmetic for every "(start – end)" heading in the
 * plain-text resume, so the model quotes durations instead of computing them
 * (it has no clock and mis-estimates "July 2020 – Present").
 */
export function tenureFacts(resumeText: string, today = new Date()): string {
  const lines: string[] = []
  for (const raw of resumeText.split('\n')) {
    const m = DATE_RANGE_RE.exec(raw)
    if (!m) continue
    const start = monthIndex(m[1], today)
    let end = monthIndex(m[2], today)
    if (start === null || end === null) continue
    if (/^\d{4}$/.test(m[2].trim())) end += 11
    const ongoing = new RegExp(`^${PRESENT_TOKEN}$`, 'i').test(m[2].trim())
    const span = end - start + 1
    const label = raw.slice(0, m.index).trim().replace(/[\s:–—-]+$/, '')
    if (!label || span < 0) continue
    lines.push(`- ${label} (${m[1].trim()} – ${m[2].trim()}): ${formatMonths(span)}${ongoing ? ', ongoing' : ''}`)
    if (lines.length >= 12) break
  }
  return lines.join('\n')
}

const formatToday = (today: Date): string =>
  today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })

/**
 * Rules and computed facts every resume-grounded coaching prompt shares:
 * the current date, pre-computed tenures, and the ban on attributing
 * anything to the candidate that the resume text does not state.
 */
export function groundingRules(resumeText: string, today = new Date()): string {
  const tenure = tenureFacts(resumeText, today)
  return `Grounding rules:
- Today is ${formatToday(today)}. "Present" in the resume means today.${
    tenure
      ? ` Use these pre-computed lengths of service whenever you mention how long the candidate did something — never do the date arithmetic yourself:\n${tenure}`
      : ''
  }
- Every statement about the candidate must be traceable to the resume text. Do not attribute tools, technologies, methods, employers, team sizes, remote or hybrid work, metrics, certifications or duties the resume does not state, even when the job description asks for them. When the job description needs something the resume does not show, name it as a gap to prepare an honest answer for — never as experience the candidate has.
- The resume records what the candidate did, not what they have never done and not how they feel: never tell them what they have or have not experienced beyond the resume ("you've operated at the execution end"), and never attribute preferences, comfort, opinions or working style ("comfortable working with product managers", "cares deeply about") the resume does not state. Interest in this role and company is fine.
- Where a specific is unknown, write a bracketed placeholder such as [metric] or [project] instead of a guess.`
}

export function buildCoverLetterMessages(
  resumeText: string,
  jobDescription: string,
  company: string,
  role: string,
  addressee = '',
  highlights = '',
  tone?: 'formal' | 'friendly'
): ChatMessage[] {
  const toneLine =
    tone === 'formal'
      ? ' Keep the register strictly formal and businesslike throughout.'
      : tone === 'friendly'
        ? ' Keep the register warm and personable while staying professional.'
        : ''
  return [
    {
      role: 'system',
      content: `You are an expert cover-letter writer.${toneLine} Write a concise, specific, one-page cover letter (250-350 words). Structure: hook tied to the company/role, 2 short paragraphs mapping the candidate's real experience to the job's needs, warm closing. Never fabricate experience: every skill, tool, employer, metric or duty you mention must appear in the candidate's resume or in the "details to highlight" — a job-description requirement the resume does not show is not the candidate's experience. Do not claim preferences, comfort levels, opinions or working style the resume does not state ("I'm comfortable working with product managers to refine quarterly goals", "I care deeply about …"); interest in this company and role is welcome, feelings about job-description duties are not. Plain text, no markdown. Start with "Dear Hiring Manager," unless an "Addressed to" name is given — then address that person directly ("Dear <name>,"). If the candidate lists details to highlight, weave them naturally into the body paragraphs (do not present them as a list). Do not include addresses or dates.`,
    },
    {
      role: 'user',
      content: `Company: ${company || 'the company'}\nRole: ${role || 'the role'}${
        addressee ? `\nAddressed to: ${addressee}` : ''
      }${
        highlights ? `\nDetails the candidate specifically wants highlighted: ${highlights.slice(0, 500)}` : ''
      }\n\nJob description:\n"""\n${jobDescription.slice(0, 4000)}\n"""\n\nCandidate resume:\n"""\n${resumeText.slice(0, 6000)}\n"""`,
    },
  ]
}

export function buildResignationLetterMessages(
  company: string,
  role: string,
  lastDay: string,
  reason: string,
  name: string,
  tone?: 'formal' | 'friendly'
): ChatMessage[] {
  const toneLine =
    tone === 'formal'
      ? ' Keep the register strictly formal and businesslike throughout.'
      : tone === 'friendly'
        ? ' Keep the register warm and personable while staying professional.'
        : ''
  return [
    {
      role: 'system',
      content: `You are an expert career writer.${toneLine} Write a professional, gracious resignation letter (120-200 words). Structure: clear statement of resignation with the final working day, one short paragraph of genuine gratitude, an offer to help with the transition, warm closing. Keep the tone respectful and positive regardless of the reason; never badmouth the employer. Never fabricate details — where a specific (manager name, project) is unknown, use a bracketed placeholder like [Manager name]. Plain text, no markdown, no addresses or dates at the top. Start with "Dear [Manager name]," unless a name is given. End with "Sincerely," and the employee's name.`,
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
  role: string,
  today = new Date()
): ChatMessage[] {
  return [
    {
      role: 'system',
      content: `You are the interviewer for the given role. Write exactly 5 interview questions tailored to this job description and this candidate's resume: a mix of behavioral questions probing their actual experience and role-specific questions from the JD's key requirements. Behavioral questions may only reference employers, projects, tools and dates that appear in the resume text. Each question must be a single sentence under 200 characters. Reply with ONLY a JSON array of 5 strings — no markdown, no commentary.
${groundingRules(resumeText, today)}`,
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
  role: string,
  today = new Date()
): ChatMessage[] {
  return [
    {
      role: 'system',
      content: `You are an interview coach reviewing one practice answer. Assess the candidate's answer to the given question and reply in plain text with exactly these headings:
WHAT WORKED — 2-3 specific strengths of this answer.
WHAT TO IMPROVE — 2-3 concrete, actionable fixes (structure, specificity, relevance to the role).
STRONGER ANSWER — a rewritten answer the candidate could give, grounded only in their real resume content; where a specific detail is unknown, use a bracketed placeholder like [metric] or [project name]. Never invent experience the resume does not support. No markdown syntax beyond the plain headings above.
${groundingRules(resumeText, today)}`,
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
  role: string,
  today = new Date()
): ChatMessage[] {
  return [
    {
      role: 'system',
      content: `You are an interview coach. Produce a practical interview prep brief with exactly these sections, in plain text with these headings:
LIKELY QUESTIONS — 8 questions this specific role/JD will ask, each followed by a one-line answer angle drawn from the candidate's real resume (cite the employer or bullet it comes from; if the resume has nothing on the topic, write "not on your resume — if you have done this, say so and add it; otherwise the closest analogue is …" and name the closest real bullet).
YOUR STORIES — 3 STAR stories the candidate should prepare, each built from one actual experience bullet quoted from the resume; the Situation and Task come from that bullet or are bracketed placeholders — never a plausible backstory the resume does not state.
QUESTIONS TO ASK — 4 sharp questions for the interviewer.
GAPS TO PREPARE FOR — 2-3 JD requirements the resume does not show. Phrase each as what the resume does not show (not as what the candidate has never done), then two lines: "If you have done this: …" (add it to the resume and how to say it) and "If not: …" (the closest real experience and an honest framing).
Never fabricate experience. No markdown syntax beyond the plain headings above.
${groundingRules(resumeText, today)}`,
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
- Exception: when the user explicitly asks you to write or rewrite their summary, to suggest skills to add, or to write/rewrite/strengthen a bullet point for one of their experience entries, you MUST propose one concrete edit for them to approve — answering such a request with prose alone and no tail is an error. End your reply with a single line in exactly this form (no markdown, nothing after it):
@@APPLY {"type":"summary","value":"<the full replacement summary, under 700 characters>"}
or
@@APPLY {"type":"skills","value":["Skill One","Skill Two"]}
or
@@APPLY {"type":"bullet","entry":"<the company or role of the target experience entry, exactly as it appears in the resume>","value":"<one bullet under 300 characters, grounded in that entry>"}
or, when the user asks you to rewrite or improve one specific existing bullet, include the exact original so it can be replaced in place:
@@APPLY {"type":"bullet","entry":"<company or role as in the resume>","replace":"<the existing bullet being rewritten, exactly as it appears in the resume>","value":"<the rewritten bullet, under 300 characters>"}
Include the tail whenever the request is clearly for a summary rewrite, skills to add, or an experience bullet — and only then; the proposal must be fully grounded in the resume context, with exactly one tail. The user sees an Apply button and decides; never present the change as already made.
- Answer questions about job search, interviews, and resume strategy honestly and practically. If asked something unrelated to resumes, careers, or job search, briefly decline and steer back.

${context}`,
    },
    ...turns.map((t) => ({ role: t.role, content: t.content.slice(0, 2000) })),
  ]
}

export type AssistantAction =
  | { type: 'summary'; value: string }
  | { type: 'skills'; value: string[] }
  | { type: 'bullet'; entry: string; value: string; replace?: string }

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
    if (
      parsed.type === 'bullet' &&
      typeof (parsed as { entry?: unknown }).entry === 'string' &&
      ((parsed as { entry: string }).entry.trim() !== '') &&
      typeof parsed.value === 'string' &&
      parsed.value.trim()
    ) {
      const replaceRaw = (parsed as { replace?: unknown }).replace
      const replace =
        typeof replaceRaw === 'string' && replaceRaw.trim()
          ? replaceRaw.trim().slice(0, 300)
          : undefined
      return {
        text,
        action: {
          type: 'bullet',
          entry: (parsed as { entry: string }).entry.trim().slice(0, 80),
          value: parsed.value.trim().slice(0, 300),
          ...(replace ? { replace } : {}),
        },
      }
    }
  } catch {
    // fall through — treat as plain text
  }
  return { text, action: null }
}
