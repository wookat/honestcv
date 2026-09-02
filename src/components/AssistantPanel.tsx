/**
 * Resume assistant — a chat side panel inside the builder, grounded in the
 * current draft. Advises and points at in-editor tools; it can propose a
 * summary or skills edit, which is only written after the user clicks Apply.
 * History is kept locally per browser.
 */

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BriefcaseBusiness, Check, Loader2, MapPin, Send, Sparkles, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  aiAssistant,
  PaymentRequiredError,
  type AssistantAction,
  type AssistantTurnInput,
} from '@/lib/api'
import { aiTargetRole, resumeToPlainText, type Resume } from '@/lib/resume'
import { matchReport, type AtsResult } from '@/lib/ats'

const CHAT_KEY = 'honestcv.assistantChat'
const CHAT_MAX = 40

interface ChatMsg extends AssistantTurnInput {
  action?: AssistantAction
  applied?: boolean
  /** Job-board search this turn recommends; rendered as a link to /jobs */
  jobsQuery?: string
}

function validAction(a: unknown): a is AssistantAction {
  if (!a || typeof a !== 'object') return false
  const action = a as { type?: unknown; value?: unknown; entry?: unknown; replace?: unknown }
  if (action.type === 'summary') return typeof action.value === 'string' && Boolean(action.value)
  if (action.type === 'bullet')
    return (
      typeof action.entry === 'string' &&
      Boolean(action.entry) &&
      typeof action.value === 'string' &&
      Boolean(action.value) &&
      (action.replace === undefined || typeof action.replace === 'string')
    )
  if (action.type === 'skills')
    return (
      Array.isArray(action.value) &&
      action.value.length > 0 &&
      action.value.every((s) => typeof s === 'string')
    )
  return false
}

function loadChat(): ChatMsg[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(CHAT_KEY) ?? '[]') as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (t): t is ChatMsg =>
          Boolean(t && typeof (t as { content?: unknown }).content === 'string') &&
          ((t as { role?: unknown }).role === 'user' ||
            (t as { role?: unknown }).role === 'assistant')
      )
      .map((t) => ({
        role: t.role,
        content: t.content,
        ...(validAction(t.action) ? { action: t.action, applied: t.applied === true } : {}),
        ...(typeof t.jobsQuery === 'string' ? { jobsQuery: t.jobsQuery } : {}),
      }))
  } catch {
    return []
  }
}

function persistChat(turns: ChatMsg[]) {
  try {
    localStorage.setItem(CHAT_KEY, JSON.stringify(turns.slice(-CHAT_MAX)))
  } catch {
    // storage full — chat history is best-effort
  }
}

const QUICK_TASKS: { label: string; prompt: string }[] = [
  {
    label: 'Improve my ATS score',
    prompt: 'How can I improve my resume\u2019s ATS score? Give me the highest-impact fixes first.',
  },
  {
    label: 'Draft my summary',
    prompt: 'Help me write a professional summary based on what\u2019s in my resume.',
  },
  {
    label: 'Suggest skills',
    prompt: 'Which skills am I missing or under-selling for my target role?',
  },
  {
    label: 'Target my job',
    prompt:
      'How well does my resume match my target job? Point out the biggest gaps and how to tailor it.',
  },
]

const FIND_JOBS_LABEL = 'Find matching jobs'
const FIND_JOBS_PROMPT = 'Find job opportunities that match my resume.'

/** Top skill names from the free-text skills section, category prefixes stripped. */
function topSkills(r: Resume, max = 5): string[] {
  return r.skills
    .split(/\n/)
    .map((line) => (line.includes(':') ? line.slice(line.indexOf(':') + 1) : line))
    .flatMap((line) => line.split(','))
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max)
}

/** Locally composed Find-jobs reply: recommended board search + the resume signals behind it. */
function findJobsReply(r: Resume): { content: string; jobsQuery: string } {
  const role =
    r.targetRole.trim() || r.experience.find((e) => !e.hidden && e.role.trim())?.role.trim() || ''
  const skills = topSkills(r)
  const location = r.contact.location.trim()
  const signals = [
    skills.length ? `your skills (${skills.join(', ')})` : '',
    location ? `your location (${location})` : '',
  ].filter(Boolean)
  const content = role
    ? `Based on your resume, I'd search the job board for “${role}”.` +
      (signals.length
        ? ` Once you're there, ${signals.join(' and ')} can help you judge which postings fit best.`
        : '') +
      ' Track anything promising and use “Target my resume” on a posting — I can then help you tailor your resume to it.'
    : 'Your resume doesn’t name a target role yet, so I’ll take you to the job board to browse. Add a target role (or an experience entry) and I can recommend a sharper search.'
  return { content, jobsQuery: role }
}

export function AssistantPanel({
  open,
  onClose,
  resume,
  jobDescription,
  scoreSummary,
  ats,
  onQuota,
  onPaymentRequired,
  onApply,
  onLocate,
}: {
  open: boolean
  onClose: () => void
  resume: Resume
  jobDescription: string
  scoreSummary: string
  ats: AtsResult
  onQuota: (remaining: number) => void
  onPaymentRequired: (message: string) => void
  onApply: (action: AssistantAction) => void
  onLocate?: (action: AssistantAction) => void
}) {
  // Live tailoring status — same helper as the Target job panel and /jobs report
  const report = matchReport(resumeToPlainText(resume), jobDescription)

  const [turns, setTurns] = useState<ChatMsg[]>(loadChat)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [open, turns, busy])

  if (!open) return null

  const send = async (content: string) => {
    const text = content.trim().slice(0, 2000)
    if (!text || busy) return
    const next = [...turns, { role: 'user' as const, content: text }].slice(-CHAT_MAX)
    setTurns(next)
    persistChat(next)
    setInput('')
    setError('')
    setBusy(true)
    try {
      const { text: reply, action, freeRemaining } = await aiAssistant({
        turns: next.slice(-12).map((t) => ({ role: t.role, content: t.content })),
        resumeText: resumeToPlainText(resume),
        jobDescription,
        role: aiTargetRole(resume),
        scoreSummary,
      })
      if (freeRemaining !== null) onQuota(freeRemaining)
      const withReply = [
        ...next,
        {
          role: 'assistant' as const,
          content: reply,
          ...(validAction(action) ? { action } : {}),
        },
      ].slice(-CHAT_MAX)
      setTurns(withReply)
      persistChat(withReply)
    } catch (e) {
      if (e instanceof PaymentRequiredError) onPaymentRequired(e.message)
      setError(e instanceof Error ? e.message : 'Something went wrong — please retry.')
    } finally {
      setBusy(false)
    }
  }

  const findJobs = () => {
    if (busy) return
    const { content, jobsQuery } = findJobsReply(resume)
    const next = [
      ...turns,
      { role: 'user' as const, content: FIND_JOBS_PROMPT },
      { role: 'assistant' as const, content, jobsQuery },
    ].slice(-CHAT_MAX)
    setTurns(next)
    persistChat(next)
    setError('')
  }

  const apply = (index: number) => {
    const msg = turns[index]
    if (!msg.action || msg.applied) return
    onApply(msg.action)
    const next = turns.map((t, i) => (i === index ? { ...t, applied: true } : t))
    setTurns(next)
    persistChat(next)
  }

  const clear = () => {
    setTurns([])
    setError('')
    try {
      localStorage.removeItem(CHAT_KEY)
    } catch {
      // ignore
    }
  }

  return (
    <aside className="bg-background fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l shadow-xl sm:w-[420px]">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Sparkles className="text-primary size-4" />
        <h2 className="text-sm font-semibold">Resume assistant</h2>
        <div className="ml-auto flex items-center gap-1">
          {turns.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clear}
              title="Clear chat"
              className="min-h-10 min-w-10 sm:min-h-8 sm:min-w-8"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            title="Close assistant"
            className="min-h-10 min-w-10 sm:min-h-8 sm:min-w-8"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {turns.length === 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm font-medium">How can I help with your resume?</p>
            <p className="text-muted-foreground mt-1 text-xs">
              I can see your current draft and target job. I&rsquo;ll suggest changes — you stay in
              control of every edit.
            </p>
            <div className="bg-muted mt-4 rounded-lg px-3 py-2 text-left">
              <p className="text-sm">
                Your ATS score is <span className="font-semibold">{ats.score}/100</span>.
              </p>
              {ats.checks.some((c) => !c.pass) ? (
                <>
                  <p className="text-muted-foreground mt-1 text-xs">To raise it:</p>
                  <ul className="text-muted-foreground mt-0.5 list-disc space-y-0.5 pl-4 text-xs">
                    {ats.checks
                      .filter((c) => !c.pass)
                      .slice(0, 3)
                      .map((c) => (
                        <li key={c.label}>{c.hint}</li>
                      ))}
                  </ul>
                </>
              ) : (
                <p className="text-muted-foreground mt-1 text-xs">
                  All structure checks pass — ask me how to sharpen the content.
                </p>
              )}
            </div>
            {report && (
              <div className="bg-muted mt-2 rounded-lg px-3 py-2 text-left">
                <p className="text-sm">
                  Your resume matches{' '}
                  <span className="font-semibold">{report.pct}%</span> of the target
                  job&rsquo;s keywords ({report.covered.length} of{' '}
                  {report.covered.length + report.missing.length}).
                </p>
                {report.highPriorityMissing.length > 0 ? (
                  <p className="mt-1 text-xs text-amber-800">
                    High priority to work in:{' '}
                    {report.highPriorityMissing.slice(0, 3).join(', ')}
                  </p>
                ) : report.missing.length > 0 ? (
                  <p className="text-muted-foreground mt-1 text-xs">
                    Still missing: {report.missing.slice(0, 3).join(', ')}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                    All job keywords covered — nice tailoring.
                  </p>
                )}
              </div>
            )}
            <div className="mt-4 flex flex-col items-stretch gap-1.5">
              {QUICK_TASKS.map((t) => (
                <Button
                  key={t.label}
                  size="sm"
                  variant="outline"
                  className="min-h-10 sm:min-h-8"
                  onClick={() => void send(t.prompt)}
                >
                  {t.label}
                </Button>
              ))}
              <Button
                size="sm"
                variant="outline"
                className="min-h-10 sm:min-h-8"
                onClick={findJobs}
              >
                {FIND_JOBS_LABEL}
              </Button>
            </div>
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className={t.role === 'user' ? 'ml-8 space-y-2' : 'mr-8 space-y-2'}>
            <div
              className={
                t.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm whitespace-pre-wrap'
                  : 'bg-muted rounded-lg px-3 py-2 text-sm whitespace-pre-wrap'
              }
            >
              {t.content}
            </div>
            {t.jobsQuery !== undefined && (
              <Button asChild size="sm" variant="outline" className="min-h-10 sm:min-h-8">
                <Link to={t.jobsQuery ? `/jobs?q=${encodeURIComponent(t.jobsQuery)}` : '/jobs'}>
                  <BriefcaseBusiness className="size-3.5" /> Search jobs
                  {t.jobsQuery ? ` “${t.jobsQuery}”` : ''} →
                </Link>
              </Button>
            )}
            {t.action && (
              <div className="rounded-lg border px-3 py-2">
                <p className="text-muted-foreground text-xs font-medium">
                  {t.action.type === 'summary'
                    ? 'Proposed summary'
                    : t.action.type === 'bullet'
                      ? `${t.action.replace ? 'Proposed rewrite' : 'Proposed bullet'} \u00b7 ${t.action.entry}`
                      : 'Proposed skills'}
                </p>
                <p className="mt-1 text-sm whitespace-pre-wrap">
                  {t.action.type === 'skills' ? t.action.value.join(', ') : t.action.value}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {t.applied ? (
                    <p className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Check className="size-3.5" /> Applied to your resume
                    </p>
                  ) : (
                    <Button size="sm" className="min-h-10 sm:min-h-8" onClick={() => apply(i)}>
                      {t.action.type === 'summary'
                        ? 'Apply to summary'
                        : t.action.type === 'bullet'
                          ? t.action.replace
                            ? 'Replace bullet'
                            : 'Add bullet'
                          : 'Add to skills'}
                    </Button>
                  )}
                  {onLocate && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground min-h-10 text-xs sm:min-h-8"
                      onClick={() => onLocate(t.action as AssistantAction)}
                    >
                      <MapPin className="size-3.5" /> Show in editor
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="bg-muted text-muted-foreground mr-8 flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
            <Loader2 className="size-3.5 animate-spin" /> Thinking…
          </div>
        )}
        {error && <p className="text-destructive text-xs">{error}</p>}
      </div>
      {turns.length > 0 && report && (
        <p className="text-muted-foreground border-t px-4 py-1.5 text-xs">
          Target job: <span className="text-foreground font-medium">{report.pct}%</span>{' '}
          keyword match
          {report.highPriorityMissing.length > 0 && (
            <>
              {' \u00b7 high priority: '}
              <span className="text-amber-800">
                {report.highPriorityMissing.slice(0, 2).join(', ')}
              </span>
            </>
          )}
        </p>
      )}
      {turns.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t px-4 py-2">
          {QUICK_TASKS.map((t) => (
            <Button
              key={t.label}
              size="sm"
              variant="outline"
              disabled={busy}
              className="min-h-10 rounded-full text-xs sm:min-h-7"
              onClick={() => void send(t.prompt)}
            >
              {t.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            className="min-h-10 rounded-full text-xs sm:min-h-7"
            onClick={findJobs}
          >
            {FIND_JOBS_LABEL}
          </Button>
        </div>
      )}
      <form
        className="flex items-end gap-2 border-t px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault()
          void send(input)
        }}
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send(input)
            }
          }}
          placeholder="Ask about your resume or job search…"
          rows={2}
          className="min-h-10 flex-1 resize-none text-sm"
        />
        <Button type="submit" size="sm" disabled={busy || !input.trim()} className="min-h-10 min-w-10 sm:min-h-9">
          <Send className="size-3.5" />
        </Button>
      </form>
    </aside>
  )
}
