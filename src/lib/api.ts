/** Worker API helpers for the AI features. */

import { licenseHeaders } from '@/lib/license'
import { trackEvent } from '@/lib/track'

export class PaymentRequiredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PaymentRequiredError'
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...licenseHeaders() },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as T & {
    error?: string
    code?: string
  }
  if (!res.ok) {
    if (res.status === 402 || data.code === 'payment_required') {
      throw new PaymentRequiredError(data.error || 'Unlock RezUp to continue.')
    }
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  if (path.startsWith('/api/ai/')) trackEvent('ai-use')
  return data
}

/** Remaining free-AI quota for this client, without consuming any. */
export async function fetchAiQuota(): Promise<number | null> {
  try {
    const res = await fetch('/api/ai/quota', { headers: licenseHeaders() })
    if (!res.ok) return null
    const data = (await res.json()) as { freeRemaining: number | null }
    return data.freeRemaining
  } catch {
    return null
  }
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
  return post<{ skills: string[]; freeRemaining: number | null }>(
    '/api/ai/skill-suggest',
    input
  )
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
    input
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
    input
  )
}

export async function aiKeywordBullet(input: {
  keyword: string
  resumeText: string
  jobDescription: string
  role: string
  language?: string
}): Promise<{ text: string; freeRemaining: number | null }> {
  return post<{ text: string; freeRemaining: number | null }>('/api/ai/keyword-bullet', input)
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
  return post<{ text: string; freeRemaining: number | null }>('/api/ai/suggest-bullet', input)
}

export async function aiCoverLetter(input: {
  resumeText: string
  jobDescription: string
  company: string
  role: string
  addressee?: string
  highlights?: string
  language?: string
  tone?: 'formal' | 'friendly'
}): Promise<{ text: string; freeRemaining: number | null }> {
  return post<{ text: string; freeRemaining: number | null }>('/api/ai/cover-letter', input)
}

export async function aiResignationLetter(input: {
  company: string
  role: string
  lastDay: string
  reason: string
  name: string
  tone?: 'formal' | 'friendly'
}): Promise<{ text: string; freeRemaining: number | null }> {
  return post<{ text: string; freeRemaining: number | null }>('/api/ai/resignation-letter', input)
}

export async function aiInterviewBrief(input: {
  resumeText: string
  jobDescription: string
  role: string
}): Promise<{ text: string; freeRemaining: number | null }> {
  return post<{ text: string; freeRemaining: number | null }>('/api/ai/interview-brief', input)
}

export async function aiInterviewQuestions(input: {
  resumeText: string
  jobDescription: string
  role: string
}): Promise<{ questions: string[]; freeRemaining: number | null }> {
  return post<{ questions: string[]; freeRemaining: number | null }>(
    '/api/ai/interview-questions',
    input
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
    input
  )
}

export async function aiInterviewFeedback(input: {
  question: string
  answer: string
  resumeText: string
  jobDescription: string
  role: string
}): Promise<{ text: string; freeRemaining: number | null }> {
  return post<{ text: string; freeRemaining: number | null }>('/api/ai/interview-feedback', input)
}
