/** Worker API helpers for the AI features. */

import { licenseHeaders } from '@/lib/license'

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
      throw new PaymentRequiredError(data.error || 'Unlock HonestCV to continue.')
    }
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data
}

export type RewriteKind = 'bullets' | 'summary' | 'skills'

export async function aiRewrite(
  kind: RewriteKind,
  text: string,
  context: { role?: string; jobDescription?: string },
  variants = false
): Promise<{ text: string; texts?: string[]; freeRemaining: number | null }> {
  const data = await post<{
    text: string
    texts?: string[]
    freeRemaining: number | null
  }>('/api/ai/rewrite', { kind, text, variants, ...context })
  return data
}

export async function aiCoverLetter(input: {
  resumeText: string
  jobDescription: string
  company: string
  role: string
}): Promise<{ text: string; freeRemaining: number | null }> {
  return post<{ text: string; freeRemaining: number | null }>('/api/ai/cover-letter', input)
}

export async function aiInterviewBrief(input: {
  resumeText: string
  jobDescription: string
  role: string
}): Promise<{ text: string; freeRemaining: number | null }> {
  return post<{ text: string; freeRemaining: number | null }>('/api/ai/interview-brief', input)
}
