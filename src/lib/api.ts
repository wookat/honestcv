/** Worker API helpers for the AI features. */

import { licenseHeaders } from '@/lib/license'
import { trackEvent } from '@/lib/track'

export class PaymentRequiredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PaymentRequiredError'
  }
}

/** The worker rejects /api/ai/* bodies over 60KB, yet its prompts only read
 * the first few thousand characters of each long-text field. Clamp those
 * fields client-side (with generous slack over what the prompts consume) so
 * an oversized pasted input can never push a request past the body cap. */
const RESUME_TEXT_MAX = 9_000
const JOB_DESCRIPTION_MAX = 9_000
const SCORE_SUMMARY_MAX = 3_000
const TURN_CONTENT_MAX = 2_500

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...licenseHeaders() },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error(
      'You appear to be offline — check your connection and try again.'
    )
  }
  const data = (await res.json().catch(() => ({}))) as T & {
    error?: string
    code?: string
  }
  if (!res.ok) throw apiError(res.status, data)
  if (path.startsWith('/api/ai/')) trackEvent('ai-use')
  return data
}

type AiText = { text: string; freeRemaining: number | null }

/** POST that asks the Worker to forward the model reply as it is generated
 * (SSE: `delta` / `reset` / `done` / `error`). `onDelta` receives the text so
 * far; the resolved value is the Worker's authoritative final text. A Worker
 * that answers plain JSON (older deploy, quota/validation errors) is handled
 * exactly like `post`. */
async function postLive(
  path: string,
  body: unknown,
  onDelta: (textSoFar: string) => void
): Promise<AiText> {
  let res: Response
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream',
        ...licenseHeaders(),
      },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error(
      'You appear to be offline — check your connection and try again.'
    )
  }
  if (!(res.headers.get('content-type') ?? '').includes('text/event-stream') || !res.body) {
    const data = (await res.json().catch(() => ({}))) as AiText & {
      error?: string
      code?: string
    }
    if (!res.ok) throw apiError(res.status, data)
    trackEvent('ai-use')
    return data
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let soFar = ''
  const final: { value: AiText | null } = { value: null }
  const handleEvent = (event: string, data: string) => {
    if (event === 'delta') {
      soFar += JSON.parse(data) as string
      onDelta(soFar)
    } else if (event === 'reset') {
      soFar = ''
      onDelta('')
    } else if (event === 'done') {
      final.value = JSON.parse(data) as AiText
    } else if (event === 'error') {
      const err = JSON.parse(data) as { error?: string; status?: number }
      throw apiError(err.status ?? 502, err)
    }
  }
  const handleBlock = (block: string) => {
    let event = 'message'
    const data: string[] = []
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim()
      else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''))
    }
    if (data.length) handleEvent(event, data.join('\n'))
  }
  for (;;) {
    const { value, done: eof } = await reader.read()
    if (eof) break
    buffer += decoder.decode(value, { stream: true })
    const blocks = buffer.split(/\r?\n\r?\n/)
    buffer = blocks.pop() ?? ''
    for (const block of blocks) handleBlock(block)
  }
  buffer += decoder.decode()
  if (buffer.trim()) handleBlock(buffer)
  if (!final.value) {
    throw new Error(
      'The connection dropped before the AI finished — please try again. Your free AI uses are only spent on a finished result.'
    )
  }
  trackEvent('ai-use')
  return final.value
}

function apiError(
  status: number,
  data: { error?: string; code?: string }
): Error {
  if (status === 402 || data.code === 'payment_required') {
    return new PaymentRequiredError(data.error || 'Unlock RezUp to continue.')
  }
  return new Error(
    data.error ||
      (status === 429
        ? 'Too many requests right now — wait a moment and try again.'
        : status >= 500
          ? 'Something went wrong on our side — please try again in a moment.'
          : `The request didn’t go through (error ${status}). Please try again.`)
  )
}

/** Remaining free-AI quota for this client, without consuming any.
 * Concurrent callers share one request; the promise is dropped once settled
 * so later calls always fetch a fresh value. */
let quotaInFlight: Promise<number | null> | null = null
export function fetchAiQuota(): Promise<number | null> {
  quotaInFlight ??= (async () => {
    try {
      const res = await fetch('/api/ai/quota', { headers: licenseHeaders() })
      if (!res.ok) return null
      const data = (await res.json()) as { freeRemaining: number | null }
      return data.freeRemaining
    } catch {
      return null
    }
  })().finally(() => {
    quotaInFlight = null
  })
  return quotaInFlight
}

export type RewriteKind = 'bullets' | 'summary' | 'skills'

export async function aiRewrite(
  kind: RewriteKind,
  text: string,
  context: { role?: string; jobDescription?: string; language?: string },
  variants = false,
  emphasis?: 'key-numbers',
  avoid?: string[]
): Promise<{ text: string; texts?: string[]; freeRemaining: number | null }> {
  const data = await post<{
    text: string
    texts?: string[]
    freeRemaining: number | null
  }>('/api/ai/rewrite', {
    kind,
    text,
    variants,
    ...(emphasis ? { emphasis } : {}),
    ...(avoid?.length ? { avoid } : {}),
    ...context,
    ...(context.jobDescription !== undefined
      ? { jobDescription: context.jobDescription.slice(0, JOB_DESCRIPTION_MAX) }
      : {}),
  })
  return data
}

export async function aiSkillSuggest(input: {
  skills: string
  role: string
  jobDescription: string
  context?: string
  category?: string
}): Promise<{ skills: string[]; freeRemaining: number | null }> {
  return post<{ skills: string[]; freeRemaining: number | null }>('/api/ai/skill-suggest', {
    ...input,
    jobDescription: input.jobDescription.slice(0, JOB_DESCRIPTION_MAX),
  })
}

export async function aiSummaryDraft(input: {
  resumeText: string
  role: string
  highlights?: string[]
  jobDescription?: string
  avoid?: string[]
  language?: string
}): Promise<{ text: string; texts: string[]; freeRemaining: number | null }> {
  return post<{ text: string; texts: string[]; freeRemaining: number | null }>(
    '/api/ai/summary-draft',
    {
      ...input,
      resumeText: input.resumeText.slice(0, RESUME_TEXT_MAX),
      ...(input.jobDescription !== undefined
        ? { jobDescription: input.jobDescription.slice(0, JOB_DESCRIPTION_MAX) }
        : {}),
    }
  )
}

export interface TailorItemInput {
  id: string
  kind: 'summary' | 'bullet'
  text: string
}

export async function aiTailor(input: {
  items: TailorItemInput[]
  jobDescription: string
  role: string
  language?: string
}): Promise<{ suggestions: { id: string; text: string }[]; freeRemaining: number | null }> {
  return post<{ suggestions: { id: string; text: string }[]; freeRemaining: number | null }>(
    '/api/ai/tailor',
    { ...input, jobDescription: input.jobDescription.slice(0, JOB_DESCRIPTION_MAX) }
  )
}

export async function aiKeywordBullet(input: {
  keyword: string
  resumeText: string
  jobDescription: string
  role: string
  language?: string
}): Promise<{ text: string; freeRemaining: number | null }> {
  return post<{ text: string; freeRemaining: number | null }>('/api/ai/keyword-bullet', {
    ...input,
    resumeText: input.resumeText.slice(0, RESUME_TEXT_MAX),
    jobDescription: input.jobDescription.slice(0, JOB_DESCRIPTION_MAX),
  })
}

export async function aiSuggestBullet(input: {
  role: string
  company: string
  companyInfo?: string
  bullets: string[]
  resumeText: string
  variant?: 'key-numbers'
  language?: string
  section?: 'project' | 'involvement'
  targetRole?: string
  jobDescription?: string
  draft?: string
}): Promise<{ text: string; freeRemaining: number | null }> {
  return post<{ text: string; freeRemaining: number | null }>('/api/ai/suggest-bullet', {
    ...input,
    resumeText: input.resumeText.slice(0, RESUME_TEXT_MAX),
    ...(input.jobDescription !== undefined
      ? { jobDescription: input.jobDescription.slice(0, JOB_DESCRIPTION_MAX) }
      : {}),
  })
}

export async function aiCoverLetter(
  input: {
    resumeText: string
    jobDescription: string
    company: string
    role: string
    addressee?: string
    highlights?: string
    language?: string
    tone?: 'formal' | 'friendly'
  },
  onDelta?: (textSoFar: string) => void
): Promise<AiText> {
  const body = {
    ...input,
    resumeText: input.resumeText.slice(0, RESUME_TEXT_MAX),
    jobDescription: input.jobDescription.slice(0, JOB_DESCRIPTION_MAX),
  }
  return onDelta
    ? postLive('/api/ai/cover-letter', body, onDelta)
    : post<AiText>('/api/ai/cover-letter', body)
}

export async function aiResignationLetter(input: {
  company: string
  role: string
  lastDay: string
  reason: string
  name: string
  language?: string
  tone?: 'formal' | 'friendly'
}): Promise<{ text: string; freeRemaining: number | null }> {
  return post<{ text: string; freeRemaining: number | null }>('/api/ai/resignation-letter', input)
}

export async function aiInterviewBrief(
  input: {
    resumeText: string
    jobDescription: string
    role: string
  },
  onDelta?: (textSoFar: string) => void
): Promise<AiText> {
  const body = {
    ...input,
    resumeText: input.resumeText.slice(0, RESUME_TEXT_MAX),
    jobDescription: input.jobDescription.slice(0, JOB_DESCRIPTION_MAX),
  }
  return onDelta
    ? postLive('/api/ai/interview-brief', body, onDelta)
    : post<AiText>('/api/ai/interview-brief', body)
}

export async function aiInterviewQuestions(input: {
  resumeText: string
  jobDescription: string
  role: string
}): Promise<{ questions: string[]; freeRemaining: number | null }> {
  return post<{ questions: string[]; freeRemaining: number | null }>(
    '/api/ai/interview-questions',
    {
      ...input,
      resumeText: input.resumeText.slice(0, RESUME_TEXT_MAX),
      jobDescription: input.jobDescription.slice(0, JOB_DESCRIPTION_MAX),
    }
  )
}

export type AssistantAction =
  | { type: 'summary'; value: string }
  | { type: 'skills'; value: string[] }
  | { type: 'bullet'; entry: string; value: string; replace?: string }

export interface AssistantTurnInput {
  role: 'user' | 'assistant'
  content: string
}

export async function aiAssistant(input: {
  turns: AssistantTurnInput[]
  resumeText: string
  jobDescription: string
  role: string
  scoreSummary: string
}): Promise<{ text: string; action: AssistantAction | null; freeRemaining: number | null }> {
  return post<{ text: string; action: AssistantAction | null; freeRemaining: number | null }>(
    '/api/ai/assistant',
    {
      ...input,
      turns: input.turns.map((t) => ({ ...t, content: t.content.slice(0, TURN_CONTENT_MAX) })),
      resumeText: input.resumeText.slice(0, RESUME_TEXT_MAX),
      jobDescription: input.jobDescription.slice(0, JOB_DESCRIPTION_MAX),
      scoreSummary: input.scoreSummary.slice(0, SCORE_SUMMARY_MAX),
    }
  )
}

export async function aiInterviewFeedback(input: {
  question: string
  answer: string
  resumeText: string
  jobDescription: string
  role: string
}): Promise<{ text: string; freeRemaining: number | null }> {
  return post<{ text: string; freeRemaining: number | null }>('/api/ai/interview-feedback', {
    ...input,
    resumeText: input.resumeText.slice(0, RESUME_TEXT_MAX),
    jobDescription: input.jobDescription.slice(0, JOB_DESCRIPTION_MAX),
  })
}
