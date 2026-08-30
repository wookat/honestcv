/**
 * Resume assistant — a chat side panel inside the builder, grounded in the
 * current draft. Advises and points at in-editor tools; it never edits the
 * resume itself. History is kept locally per browser.
 */

import { useEffect, useRef, useState } from 'react'
import { Loader2, Send, Sparkles, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { aiAssistant, PaymentRequiredError, type AssistantTurnInput } from '@/lib/api'
import { resumeToPlainText, type Resume } from '@/lib/resume'

const CHAT_KEY = 'honestcv.assistantChat'
const CHAT_MAX = 40

function loadChat(): AssistantTurnInput[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(CHAT_KEY) ?? '[]') as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (t): t is AssistantTurnInput =>
        Boolean(t && typeof (t as { content?: unknown }).content === 'string') &&
        ((t as { role?: unknown }).role === 'user' || (t as { role?: unknown }).role === 'assistant')
    )
  } catch {
    return []
  }
}

function persistChat(turns: AssistantTurnInput[]) {
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
]

export function AssistantPanel({
  open,
  onClose,
  resume,
  jobDescription,
  onQuota,
  onPaymentRequired,
}: {
  open: boolean
  onClose: () => void
  resume: Resume
  jobDescription: string
  onQuota: (remaining: number) => void
  onPaymentRequired: (message: string) => void
}) {
  const [turns, setTurns] = useState<AssistantTurnInput[]>(loadChat)
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
      const { text: reply, freeRemaining } = await aiAssistant({
        turns: next.slice(-12),
        resumeText: resumeToPlainText(resume),
        jobDescription,
        role: resume.targetRole,
      })
      if (freeRemaining !== null) onQuota(freeRemaining)
      const withReply = [...next, { role: 'assistant' as const, content: reply }].slice(-CHAT_MAX)
      setTurns(withReply)
      persistChat(withReply)
    } catch (e) {
      if (e instanceof PaymentRequiredError) onPaymentRequired(e.message)
      setError(e instanceof Error ? e.message : 'Something went wrong — please retry.')
    } finally {
      setBusy(false)
    }
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
            </div>
          </div>
        )}
        {turns.map((t, i) => (
          <div
            key={i}
            className={
              t.role === 'user'
                ? 'bg-primary text-primary-foreground ml-8 rounded-lg px-3 py-2 text-sm whitespace-pre-wrap'
                : 'bg-muted mr-8 rounded-lg px-3 py-2 text-sm whitespace-pre-wrap'
            }
          >
            {t.content}
          </div>
        ))}
        {busy && (
          <div className="bg-muted text-muted-foreground mr-8 flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
            <Loader2 className="size-3.5 animate-spin" /> Thinking…
          </div>
        )}
        {error && <p className="text-destructive text-xs">{error}</p>}
      </div>
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
