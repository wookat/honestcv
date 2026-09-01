/**
 * Live HTML preview of the resume, styled per template to closely mirror the
 * PDF/DOCX output. Rendered inside fixed-aspect "pages" — pass `paginated`
 * to show every page of a long resume instead of clipping after page one.
 */

import { Fragment, useEffect, useRef, useState } from 'react'

import {
  type Resume,
  awardBullets,
  awardEntries,
  publicationBullets,
  publicationEntries,
  referenceDetailLine,
  referenceEntries,
  certEntries,
  courseworkBullets,
  courseworkEntries,
  dividerOf,
  editDescriptionLine,
  involvementBullets,
  involvementDates,
  involvementEntries,
  militaryBullets,
  militaryDates,
  militaryEntries,
  agentBullets,
  agentEntries,
  fontScaleOf,
  lineSpacingOf,
  educationDetailLine,
  orderedSectionKeys,
  projectDates,
  sectionHeading,
  sectionLabel,
  sectionSpacingOf,
  skillLines,
  bulletIndentOf,
  contactIconsOf,
  familyOf,
  textInkOf,
} from '@/lib/resume'
import { CONTACT_ICON_PATHS, type ContactIconKind } from '@/lib/contactIcons'
import { accentTint, resolveTemplate } from '@/lib/templates'

/** Click-to-type text in the preview: commits on blur/Enter, reverts on Escape. */
function InlineText({
  value,
  fallback = '',
  onCommit,
  onEnterNext,
}: {
  value: string
  fallback?: string
  /** When set, the span is contentEditable and commits plain text edits */
  onCommit?: (next: string) => void
  /** Called after an Enter-commit, e.g. to open a draft bullet below */
  onEnterNext?: () => void
}) {
  const shown = value || fallback
  if (!onCommit) return <>{shown}</>
  return (
    <span
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      role="textbox"
      aria-label="Edit text"
      className="cursor-text rounded-sm outline-none focus:bg-sky-100/70 focus:ring-1 focus:ring-sky-300"
      onClick={(e) => e.stopPropagation()}
      onPaste={(e) => {
        e.preventDefault()
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          e.currentTarget.blur()
          onEnterNext?.()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          e.currentTarget.textContent = shown
          e.currentTarget.blur()
        }
      }}
      onBlur={(e) => {
        const next = (e.currentTarget.textContent ?? '').replace(/\s+/g, ' ').trim()
        if (next === shown || next === value || (next === fallback && !value)) {
          e.currentTarget.textContent = shown
          return
        }
        onCommit(next)
      }}
    >
      {shown}
    </span>
  )
}


/** Uncommitted bullet row: Enter/blur commits non-empty text, Escape or empty blur discards. */
function DraftBullet({
  accent,
  position = 0,
  onCommit,
  onClose,
}: {
  accent: string
  /** Where the row sits in the list; refocuses when a commit moves the row */
  position?: number
  onCommit: (text: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const justCommitted = useRef(false)
  useEffect(() => {
    ref.current?.focus()
  }, [position])
  return (
    <li className="flex gap-1.5 text-[11px]">
      <span style={{ color: accent }}>•</span>
      <span
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        role="textbox"
        aria-label="New bullet"
        className="min-w-[60px] cursor-text rounded-sm outline-none focus:bg-sky-100/70 focus:ring-1 focus:ring-sky-300"
        onClick={(e) => e.stopPropagation()}
        onPaste={(e) => {
          e.preventDefault()
          document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            const text = (e.currentTarget.textContent ?? '').replace(/\s+/g, ' ').trim()
            if (text) {
              justCommitted.current = true
              onCommit(text)
              e.currentTarget.textContent = ''
            } else {
              onClose()
            }
          } else if (e.key === 'Escape') {
            e.preventDefault()
            e.currentTarget.textContent = ''
            onClose()
          }
        }}
        onBlur={(e) => {
          if (justCommitted.current) {
            justCommitted.current = false
            return
          }
          const text = (e.currentTarget.textContent ?? '').replace(/\s+/g, ' ').trim()
          if (text) onCommit(text)
          onClose()
        }}
      />
    </li>
  )
}

function ContactIcon({ kind }: { kind: ContactIconKind }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={10}
      height={10}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      <path d={CONTACT_ICON_PATHS[kind]} />
    </svg>
  )
}

export function ResumePreview({
  resume,
  paginated = false,
  view = 'pages',
  onSectionJump,
  onEdit,
}: {
  resume: Resume
  paginated?: boolean
  /** Paged stack of page frames, or one continuous flow with break markers */
  view?: 'pages' | 'flow'
  /** When set, clicking a section in the preview jumps to its editor card */
  onSectionJump?: (key: string) => void
  /** When set, common text fields become editable in place */
  onEdit?: (next: Resume) => void
}) {
  const tpl = resolveTemplate(resume.templateId, resume.accentColor)
  const c = resume.contact
  const fontFamily = {
    serif: 'Georgia, "Times New Roman", serif',
    sans: 'Inter, Arial, sans-serif',
    mono: '"Courier New", ui-monospace, monospace',
    merriweather: 'Merriweather, Georgia, serif',
    sourcesans: '"Source Sans 3", "Source Sans Pro", Inter, Arial, sans-serif',
    robotomono: '"Roboto Mono", "Courier New", ui-monospace, monospace',
  }[familyOf(resume, tpl.serif)]
  const contactFields: { text: string; icon: ContactIconKind; key: 'email' | 'phone' | 'location' | 'website' | 'linkedin' }[] = [
    { text: c.email, icon: 'mail' as const, key: 'email' as const },
    { text: c.phone, icon: 'phone' as const, key: 'phone' as const },
    { text: c.location, icon: 'pin' as const, key: 'location' as const },
    { text: c.website, icon: 'globe' as const, key: 'website' as const },
    { text: c.linkedin, icon: 'linkedin' as const, key: 'linkedin' as const },
  ].filter((f) => f.text)
  const contactField = (f: (typeof contactFields)[number]) => (
    <InlineText
      value={f.text}
      onCommit={
        onEdit && ((v) => onEdit({ ...resume, contact: { ...resume.contact, [f.key]: v } }))
      }
    />
  )

  const divider = tpl.band ? 'none' : dividerOf(resume, tpl.divider)
  const headingMarginTop = 16 * sectionSpacingOf(resume)
  const heading = (label: React.ReactNode, key?: string) => (
    <h3
      className="mb-1.5 text-[11px] font-bold tracking-wide"
      style={{
        marginTop: headingMarginTop,
        color: tpl.accent,
        textTransform: tpl.headingCase === 'upper' ? 'uppercase' : undefined,
        borderBottom:
          divider === 'none' ? 'none' : `${divider === 'thick' ? 2 : 1}px solid ${tpl.accent}`,
        paddingBottom: tpl.band ? 3 : divider === 'none' ? 0 : 3,
        ...(tpl.band
          ? { background: accentTint(tpl.accent), padding: '3px 6px', borderRadius: 2 }
          : {}),
      }}
    >
      {onEdit && key ? (
        <InlineText
          value={(resume.sectionHeadings?.[key] ?? '').trim()}
          fallback={sectionLabel(resume, key)}
          onCommit={(v) => {
            const next = { ...(resume.sectionHeadings ?? {}) }
            if (!v || v === sectionLabel(resume, key)) delete next[key]
            else next[key] = v
            onEdit({
              ...resume,
              sectionHeadings: Object.keys(next).length ? next : undefined,
            })
          }}
        />
      ) : (
        label
      )}
    </h3>
  )

  const aspectRatio = resume.pageSize === 'a4' ? '210 / 297' : '8.5 / 11'
  const contentStyle: React.CSSProperties = {
    // Mirror the export's text-size and line-spacing settings
    zoom: fontScaleOf(resume),
    lineHeight: lineSpacingOf(resume) + 0.1,
  }
  const jumpProps = (key: string, label: string) =>
    onSectionJump
      ? {
          onClick: () => onSectionJump(key),
          title: `Edit ${label}`,
          className: 'cursor-pointer rounded-sm hover:bg-black/5',
        }
      : {}
  const content = (
    <>
      <div
        {...jumpProps('contact', 'Contact')}
        className={`relative ${tpl.headerAlign === 'left' ? 'text-left' : 'text-center'}${
          onSectionJump ? ' cursor-pointer rounded-sm hover:bg-black/5' : ''
        }`}
      >
        {resume.photo && (
          <img
            src={resume.photo}
            alt=""
            className="absolute top-0 right-0 h-16 w-16 rounded object-cover"
          />
        )}
        <h2 className="text-2xl font-bold">
          <InlineText
            value={tpl.nameCase === 'upper' ? c.fullName.toUpperCase() : c.fullName}
            fallback={tpl.nameCase === 'upper' ? 'YOUR NAME' : 'Your Name'}
            onCommit={
              onEdit &&
              ((v) => onEdit({ ...resume, contact: { ...resume.contact, fullName: v } }))
            }
          />
        </h2>
        {c.title && (
          <p className="mt-0.5 text-sm" style={{ color: tpl.accent }}>
            <InlineText
              value={c.title}
              onCommit={
                onEdit &&
                ((v) => onEdit({ ...resume, contact: { ...resume.contact, title: v } }))
              }
            />
          </p>
        )}
        {contactFields.length > 0 &&
          (contactIconsOf(resume) ? (
            <p
              className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-neutral-500 ${
                tpl.headerAlign === 'left' ? 'justify-start' : 'justify-center'
              }`}
            >
              {contactFields.map((f) => (
                <span key={f.icon} className="inline-flex items-center gap-1">
                  <ContactIcon kind={f.icon} />
                  {contactField(f)}
                </span>
              ))}
            </p>
          ) : (
            <p className="mt-1 text-[10px] text-neutral-500">
              {contactFields.map((f, i) => (
                <Fragment key={f.icon}>
                  {i > 0 ? '  |  ' : null}
                  {contactField(f)}
                </Fragment>
              ))}
            </p>
          ))}
      </div>

      {orderedSectionKeys(resume).map((key) => (
        <div key={key} {...jumpProps(key, sectionLabel(resume, key))}>
          <SectionBlock sectionKey={key} resume={resume} heading={heading} onEdit={onEdit} />
        </div>
      ))}
    </>
  )

  if (!paginated)
    return (
      <div
        data-resume-preview
        className="mx-auto w-full rounded-md border bg-white p-8 shadow-sm"
        style={{ fontFamily, color: textInkOf(resume), aspectRatio, overflow: 'hidden', ...contentStyle }}
        aria-label="Resume preview"
      >
        {content}
      </div>
    )

  if (view === 'flow')
    return (
      <FlowPage resume={resume} fontFamily={fontFamily} contentStyle={contentStyle}>
        {content}
      </FlowPage>
    )

  return (
    <PaginatedPages resume={resume} fontFamily={fontFamily} contentStyle={contentStyle}>
      {content}
    </PaginatedPages>
  )
}

const PAGE_PAD = 32

/**
 * Renders the resume as a stack of page frames. Content is laid out at the
 * true page width (96dpi Letter/A4) and scaled down to fit the frame, so the
 * page count is independent of frame width and matches the PDF export's
 * page geometry. Each frame shows a window onto the same content, shifted
 * up by one page height per frame.
 */
function PaginatedPages({
  resume,
  fontFamily,
  contentStyle,
  children,
}: {
  resume: Resume
  fontFamily: string
  contentStyle: React.CSSProperties
  children: React.ReactNode
}) {
  const baseW = resume.pageSize === 'a4' ? 794 : 816
  const baseH = resume.pageSize === 'a4' ? 1123 : 1056
  const windowH = baseH - PAGE_PAD * 2
  const frameRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [pages, setPages] = useState(1)
  const [scale, setScale] = useState(0)

  useEffect(() => {
    const frame = frameRef.current
    const content = contentRef.current
    if (!frame || !content) return
    const measure = () => {
      setScale(frame.clientWidth / baseW)
      setPages(Math.max(1, Math.ceil((content.scrollHeight - 1) / windowH)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(frame)
    ro.observe(content)
    return () => ro.disconnect()
  }, [resume, baseW, windowH])

  return (
    <div className="space-y-4">
      {Array.from({ length: pages }, (_, i) => (
        <div
          key={i}
          ref={i === 0 ? frameRef : undefined}
          data-resume-preview={i === 0 ? '' : undefined}
          className="relative mx-auto w-full rounded-md border bg-white shadow-sm"
          style={{
            fontFamily,
            color: textInkOf(resume),
            overflow: 'hidden',
            ...(scale > 0
              ? { height: baseH * scale }
              : { aspectRatio: `${baseW} / ${baseH}` }),
          }}
          aria-label={`Resume preview page ${i + 1} of ${pages}`}
        >
          <div
            data-resume-page-window
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: baseW,
              height: baseH,
              padding: PAGE_PAD,
              overflow: 'hidden',
              transform: `scale(${scale || 1})`,
              transformOrigin: 'top left',
            }}
          >
            <div style={{ height: windowH, overflow: 'hidden' }}>
              <div
                ref={i === 0 ? contentRef : undefined}
                style={{ transform: i > 0 ? `translateY(-${i * windowH}px)` : undefined }}
              >
                <div style={contentStyle}>{children}</div>
              </div>
            </div>
          </div>
          {pages > 1 && (
            <span
              aria-hidden
              className="absolute right-2 bottom-1 text-[9px] text-neutral-400"
            >
              Page {i + 1} of {pages}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * Renders the resume as one continuous flow at the same 96dpi page geometry
 * as PaginatedPages, with a dashed marker where each PDF page break falls.
 */
function FlowPage({
  resume,
  fontFamily,
  contentStyle,
  children,
}: {
  resume: Resume
  fontFamily: string
  contentStyle: React.CSSProperties
  children: React.ReactNode
}) {
  const baseW = resume.pageSize === 'a4' ? 794 : 816
  const baseH = resume.pageSize === 'a4' ? 1123 : 1056
  const windowH = baseH - PAGE_PAD * 2
  const frameRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentH, setContentH] = useState(windowH)
  const [scale, setScale] = useState(0)

  useEffect(() => {
    const frame = frameRef.current
    const content = contentRef.current
    if (!frame || !content) return
    const measure = () => {
      setScale(frame.clientWidth / baseW)
      setContentH(Math.max(windowH, content.scrollHeight))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(frame)
    ro.observe(content)
    return () => ro.disconnect()
  }, [resume, baseW, windowH])

  const breaks = Math.max(0, Math.ceil((contentH - 1) / windowH) - 1)
  return (
    <div
      ref={frameRef}
      data-resume-preview
      className="mx-auto w-full rounded-md border bg-white shadow-sm"
      style={{
        fontFamily,
        color: textInkOf(resume),
        overflow: 'hidden',
        ...(scale > 0
          ? { height: (contentH + PAGE_PAD * 2) * scale }
          : { aspectRatio: `${baseW} / ${baseH}` }),
      }}
      aria-label="Resume preview (continuous)"
    >
      <div
        style={{
          position: 'relative',
          width: baseW,
          padding: PAGE_PAD,
          transform: `scale(${scale || 1})`,
          transformOrigin: 'top left',
        }}
      >
        <div ref={contentRef}>
          <div style={contentStyle}>{children}</div>
        </div>
        {Array.from({ length: breaks }, (_, i) => (
          <div
            key={i}
            aria-hidden
            className="pointer-events-none absolute right-0 left-0 border-t border-dashed border-neutral-300"
            style={{ top: PAGE_PAD + (i + 1) * windowH }}
          >
            <span className="absolute right-1 -top-2 bg-white px-1 text-[9px] text-neutral-400">
              Page break
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionBlock({
  sectionKey,
  resume,
  heading,
  onEdit,
}: {
  sectionKey: string
  resume: Resume
  heading: (label: React.ReactNode, key?: string) => React.ReactNode
  onEdit?: (next: Resume) => void
}) {
  const tpl = resolveTemplate(resume.templateId, resume.accentColor)
  const ulIndent = bulletIndentOf(resume) ? { paddingLeft: 12 } : undefined
  const [draft, setDraft] = useState<{ entryId: string; at: number; seq: number } | null>(null)
  if (sectionKey === 'summary')
    return resume.summary.trim() ? (
      <>
        {heading(sectionHeading(resume, 'summary'), 'summary')}
        <p className="text-[11px]">
          <InlineText
            value={resume.summary.trim()}
            onCommit={onEdit && ((v) => onEdit({ ...resume, summary: v }))}
          />
        </p>
      </>
    ) : null
  if (sectionKey === 'experience')
    return resume.experience.some((e) => e.company || e.role) ? (
      <>
        {heading(sectionHeading(resume, 'experience'), 'experience')}
          {resume.experience.map((e) =>
            !e.company && !e.role ? null : (
              <div key={e.id} className="mb-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <p className="text-[11.5px] font-bold">
                    <InlineText
                      value={e.role}
                      fallback="Role"
                      onCommit={
                        onEdit &&
                        ((v) =>
                          onEdit({
                            ...resume,
                            experience: resume.experience.map((x) =>
                              x.id === e.id ? { ...x, role: v } : x
                            ),
                          }))
                      }
                    />
                    <span className="font-normal">
                      {'  ·  '}
                      <InlineText
                        value={e.company}
                        onCommit={
                          onEdit &&
                          ((v) =>
                            onEdit({
                              ...resume,
                              experience: resume.experience.map((x) =>
                                x.id === e.id ? { ...x, company: v } : x
                              ),
                            }))
                        }
                      />
                      {e.location ? `, ${e.location}` : ''}
                    </span>
                  </p>
                  {(e.startDate || e.endDate) && (
                    <p className="text-[10px] text-neutral-500 italic">
                      {[e.startDate, e.endDate].filter(Boolean).join(' – ')}
                    </p>
                  )}
                </div>
                <ul className="mt-0.5 space-y-0.5" style={ulIndent}>
                  {e.bullets.map((b, i) => (
                    <Fragment key={i}>
                      {b.trim() && (
                        <li className="flex gap-1.5 text-[11px]">
                          <span style={{ color: tpl.accent }}>•</span>
                          <span>
                            <InlineText
                              value={b.trim()}
                              onCommit={
                                onEdit &&
                                ((v) =>
                                  onEdit({
                                    ...resume,
                                    experience: resume.experience.map((x) =>
                                      x.id === e.id
                                        ? {
                                            ...x,
                                            bullets: v
                                              ? x.bullets.map((bb, bi) => (bi === i ? v : bb))
                                              : x.bullets.filter((_, bi) => bi !== i),
                                          }
                                        : x
                                    ),
                                  }))
                              }
                              onEnterNext={
                                onEdit &&
                                (() =>
                                  setDraft((d) => ({
                                    entryId: e.id,
                                    at: i + 1,
                                    seq: (d?.seq ?? 0) + 1,
                                  })))
                              }
                            />
                          </span>
                        </li>
                      )}
                      {onEdit && draft?.entryId === e.id && draft.at === i + 1 && (
                        <DraftBullet
                          key={`draft-${draft.seq}`}
                          accent={tpl.accent}
                          position={draft.at}
                          onCommit={(text) => {
                            const at = Math.min(draft.at, e.bullets.length)
                            onEdit({
                              ...resume,
                              experience: resume.experience.map((x) =>
                                x.id === e.id
                                  ? {
                                      ...x,
                                      bullets: [
                                        ...x.bullets.slice(0, at),
                                        text,
                                        ...x.bullets.slice(at),
                                      ],
                                    }
                                  : x
                              ),
                            })
                            setDraft((d) => (d ? { ...d, at: at + 1 } : d))
                          }}
                          onClose={() => setDraft(null)}
                        />
                      )}
                    </Fragment>
                  ))}
                  {onEdit && draft?.entryId === e.id && draft.at > e.bullets.length && (
                    <DraftBullet
                      key={`draft-${draft.seq}`}
                      accent={tpl.accent}
                      position={draft.at}
                      onCommit={(text) => {
                        onEdit({
                          ...resume,
                          experience: resume.experience.map((x) =>
                            x.id === e.id ? { ...x, bullets: [...x.bullets, text] } : x
                          ),
                        })
                        setDraft((d) => (d ? { ...d, at: d.at + 1 } : d))
                      }}
                      onClose={() => setDraft(null)}
                    />
                  )}
                </ul>
              </div>
          )
        )}
      </>
    ) : null
  if (sectionKey === 'projects')
    return resume.projects.some((p) => p.name) ? (
      <>
        {heading(sectionHeading(resume, 'projects'), 'projects')}
          {resume.projects.map((p) =>
            !p.name ? null : (
              <div key={p.id} className="mb-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <p className="text-[11px] font-bold">
                    <InlineText
                      value={p.name}
                      onCommit={
                        onEdit &&
                        ((v) =>
                          onEdit({
                            ...resume,
                            projects: resume.projects.map((x) =>
                              x.id === p.id ? { ...x, name: v } : x
                            ),
                          }))
                      }
                    />
                    {p.org?.trim() && <span className="font-normal">{'  ·  '}{p.org.trim()}</span>}
                    {p.link && <span className="font-normal"> — {p.link}</span>}
                  </p>
                  {projectDates(p) && (
                    <p className="text-[10px] text-neutral-500 italic">{projectDates(p)}</p>
                  )}
                </div>
                {p.description.trim() && (
                  <p className="text-[11px]">
                    <InlineText
                      value={p.description.trim()}
                      onCommit={
                        onEdit &&
                        ((v) =>
                          onEdit({
                            ...resume,
                            projects: resume.projects.map((x) =>
                              x.id === p.id ? { ...x, description: v } : x
                            ),
                          }))
                      }
                    />
                  </p>
                )}
              </div>
          )
        )}
      </>
    ) : null
  if (sectionKey === 'involvement') {
    const items = involvementEntries(resume)
    return items.length > 0 ? (
      <>
        {heading(sectionHeading(resume, 'involvement'), 'involvement')}
        {items.map((inv) => (
          <div key={inv.id} className="mb-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <p className="text-[11.5px] font-bold">
                <InlineText
                  value={inv.role.trim()}
                  fallback="Role"
                  onCommit={
                    onEdit &&
                    ((v) =>
                      onEdit({
                        ...resume,
                        involvement: (resume.involvement ?? []).map((x) =>
                          x.id === inv.id ? { ...x, role: v } : x
                        ),
                      }))
                  }
                />
                {inv.organization.trim() && (
                  <span className="font-normal">
                    {'  ·  '}
                    <InlineText
                      value={inv.organization.trim()}
                      onCommit={
                        onEdit &&
                        ((v) =>
                          onEdit({
                            ...resume,
                            involvement: (resume.involvement ?? []).map((x) =>
                              x.id === inv.id ? { ...x, organization: v } : x
                            ),
                          }))
                      }
                    />
                    {inv.location.trim() ? `, ${inv.location.trim()}` : ''}
                  </span>
                )}
              </p>
              {involvementDates(inv) && (
                <p className="text-[10px] text-neutral-500 italic">{involvementDates(inv)}</p>
              )}
            </div>
            <ul className="mt-0.5 space-y-0.5" style={ulIndent}>
              {involvementBullets(inv).map((b, i) => (
                <li key={i} className="flex gap-1.5 text-[11px]">
                  <span style={{ color: tpl.accent }}>•</span>
                  <span>
                    <InlineText
                      value={b}
                      onCommit={
                        onEdit &&
                        ((v) =>
                          onEdit({
                            ...resume,
                            involvement: (resume.involvement ?? []).map((x) =>
                              x.id === inv.id
                                ? { ...x, description: editDescriptionLine(x.description, i, v) }
                                : x
                            ),
                          }))
                      }
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </>
    ) : null
  }
  if (sectionKey === 'education')
    return resume.education.some((e) => e.school) ? (
      <>
        {heading(sectionHeading(resume, 'education'), 'education')}
          {resume.education.map((e) =>
            !e.school ? null : (
              <div key={e.id} className="mb-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <p className="text-[11px] font-bold">
                    <InlineText
                      value={e.degree}
                      fallback="Degree"
                      onCommit={
                        onEdit &&
                        ((v) =>
                          onEdit({
                            ...resume,
                            education: resume.education.map((x) =>
                              x.id === e.id ? { ...x, degree: v } : x
                            ),
                          }))
                      }
                    />
                    <span className="font-normal">
                      {'  ·  '}
                      <InlineText
                        value={e.school}
                        onCommit={
                          onEdit &&
                          ((v) =>
                            onEdit({
                              ...resume,
                              education: resume.education.map((x) =>
                                x.id === e.id ? { ...x, school: v } : x
                              ),
                            }))
                        }
                      />
                      {e.location ? `, ${e.location}` : ''}
                    </span>
                  </p>
                  {(e.startDate || e.endDate) && (
                    <p className="text-[10px] text-neutral-500 italic">
                      {[e.startDate, e.endDate].filter(Boolean).join(' – ')}
                    </p>
                  )}
                </div>
                {educationDetailLine(e) && (
                  <p className="text-[11px]">{educationDetailLine(e)}</p>
                )}
              </div>
          )
        )}
      </>
    ) : null
  if (sectionKey === 'coursework') {
    const items = courseworkEntries(resume)
    return items.length > 0 ? (
      <>
        {heading(sectionHeading(resume, 'coursework'), 'coursework')}
        {items.map((cw) => (
          <div key={cw.id} className="mb-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <p className="text-[11.5px] font-bold">
                <InlineText
                  value={cw.name.trim()}
                  fallback="Course"
                  onCommit={
                    onEdit &&
                    ((v) =>
                      onEdit({
                        ...resume,
                        coursework: (resume.coursework ?? []).map((x) =>
                          x.id === cw.id ? { ...x, name: v } : x
                        ),
                      }))
                  }
                />
                {cw.institution.trim() && (
                  <span className="font-normal">
                    {'  ·  '}
                    <InlineText
                      value={cw.institution.trim()}
                      onCommit={
                        onEdit &&
                        ((v) =>
                          onEdit({
                            ...resume,
                            coursework: (resume.coursework ?? []).map((x) =>
                              x.id === cw.id ? { ...x, institution: v } : x
                            ),
                          }))
                      }
                    />
                  </span>
                )}
              </p>
              {cw.date.trim() && (
                <p className="text-[10px] text-neutral-500 italic">{cw.date.trim()}</p>
              )}
            </div>
            <ul className="mt-0.5 space-y-0.5" style={ulIndent}>
              {courseworkBullets(cw).map((b, i) => {
                const off = cw.skill.trim() ? 1 : 0
                return (
                  <li key={i} className="flex gap-1.5 text-[11px]">
                    <span style={{ color: tpl.accent }}>•</span>
                    <span>
                      {i < off ? (
                        b
                      ) : (
                        <InlineText
                          value={b}
                          onCommit={
                            onEdit &&
                            ((v) =>
                              onEdit({
                                ...resume,
                                coursework: (resume.coursework ?? []).map((x) =>
                                  x.id === cw.id
                                    ? {
                                        ...x,
                                        description: editDescriptionLine(x.description, i - off, v),
                                      }
                                    : x
                                ),
                              }))
                          }
                        />
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </>
    ) : null
  }
  if (sectionKey === 'skills')
    return resume.skills.trim() ? (
      <>
        {heading(sectionHeading(resume, 'skills'), 'skills')}
        {skillLines(resume).map((line, i) => (
          <p key={i} className="text-[11px]">
            {line.label ? (
              <span className="font-semibold">
                <InlineText
                  value={line.label}
                  onCommit={
                    onEdit &&
                    ((v) =>
                      onEdit({
                        ...resume,
                        skills: editDescriptionLine(
                          resume.skills,
                          i,
                          v ? `${v}: ${line.text}` : line.text
                        ),
                      }))
                  }
                />
                {': '}
              </span>
            ) : null}
            <InlineText
              value={line.text}
              onCommit={
                onEdit &&
                ((v) =>
                  onEdit({
                    ...resume,
                    skills: editDescriptionLine(
                      resume.skills,
                      i,
                      v && line.label ? `${line.label}: ${v}` : v
                    ),
                  }))
              }
            />
          </p>
        ))}
      </>
    ) : null
  if (sectionKey === 'certifications') {
    const certs = certEntries(resume)
    return certs.length > 0 || resume.certifications.trim() ? (
      <>
        {heading(sectionHeading(resume, 'certifications'), 'certifications')}
        {certs.map((c) => (
          <div key={c.id} className="mb-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <p className="text-[11px] font-bold">
                <InlineText
                  value={c.name.trim()}
                  fallback="Certificate"
                  onCommit={
                    onEdit &&
                    ((v) =>
                      onEdit({
                        ...resume,
                        certItems: (resume.certItems ?? []).map((x) =>
                          x.id === c.id ? { ...x, name: v } : x
                        ),
                      }))
                  }
                />
                {c.issuer.trim() && (
                  <span className="font-normal">
                    {' — '}
                    <InlineText
                      value={c.issuer.trim()}
                      onCommit={
                        onEdit &&
                        ((v) =>
                          onEdit({
                            ...resume,
                            certItems: (resume.certItems ?? []).map((x) =>
                              x.id === c.id ? { ...x, issuer: v } : x
                            ),
                          }))
                      }
                    />
                  </span>
                )}
              </p>
              {c.date.trim() && (
                <p className="text-[10px] text-neutral-500 italic">{c.date.trim()}</p>
              )}
            </div>
            {c.description.trim() && (
              <p className="text-[11px]">{c.description.trim()}</p>
            )}
          </div>
        ))}
        {resume.certifications.trim() && (
          <p className="text-[11px]">{resume.certifications.trim()}</p>
        )}
      </>
    ) : null
  }
  if (sectionKey === 'awards') {
    const items = awardEntries(resume)
    return items.length > 0 ? (
      <>
        {heading(sectionHeading(resume, 'awards'), 'awards')}
        {items.map((a) => (
          <div key={a.id} className="mb-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <p className="text-[11.5px] font-bold">
                <InlineText
                  value={a.name.trim()}
                  fallback="Award"
                  onCommit={
                    onEdit &&
                    ((v) =>
                      onEdit({
                        ...resume,
                        awards: (resume.awards ?? []).map((x) =>
                          x.id === a.id ? { ...x, name: v } : x
                        ),
                      }))
                  }
                />
                {a.organization.trim() && (
                  <span className="font-normal">
                    {' — '}
                    <InlineText
                      value={a.organization.trim()}
                      onCommit={
                        onEdit &&
                        ((v) =>
                          onEdit({
                            ...resume,
                            awards: (resume.awards ?? []).map((x) =>
                              x.id === a.id ? { ...x, organization: v } : x
                            ),
                          }))
                      }
                    />
                  </span>
                )}
              </p>
              {a.date.trim() && (
                <p className="text-[10px] text-neutral-500 italic">{a.date.trim()}</p>
              )}
            </div>
            <ul className="mt-0.5 space-y-0.5" style={ulIndent}>
              {awardBullets(a).map((b, i) => (
                <li key={i} className="flex gap-1.5 text-[11px]">
                  <span style={{ color: tpl.accent }}>•</span>
                  <span>
                    <InlineText
                      value={b}
                      onCommit={
                        onEdit &&
                        ((v) =>
                          onEdit({
                            ...resume,
                            awards: (resume.awards ?? []).map((x) =>
                              x.id === a.id
                                ? { ...x, description: editDescriptionLine(x.description, i, v) }
                                : x
                            ),
                          }))
                      }
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </>
    ) : null
  }
  if (sectionKey === 'publications') {
    const items = publicationEntries(resume)
    return items.length > 0 ? (
      <>
        {heading(sectionHeading(resume, 'publications'), 'publications')}
        {items.map((p) => (
          <div key={p.id} className="mb-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <p className="text-[11.5px] font-bold">
                <InlineText
                  value={p.title.trim()}
                  fallback="Publication"
                  onCommit={
                    onEdit &&
                    ((v) =>
                      onEdit({
                        ...resume,
                        publications: (resume.publications ?? []).map((x) =>
                          x.id === p.id ? { ...x, title: v } : x
                        ),
                      }))
                  }
                />
                {p.venue.trim() && (
                  <span className="font-normal">
                    {' — '}
                    <InlineText
                      value={p.venue.trim()}
                      onCommit={
                        onEdit &&
                        ((v) =>
                          onEdit({
                            ...resume,
                            publications: (resume.publications ?? []).map((x) =>
                              x.id === p.id ? { ...x, venue: v } : x
                            ),
                          }))
                      }
                    />
                  </span>
                )}
                {(p.kind ?? '').trim() && (
                  <span className="font-normal italic"> ({(p.kind ?? '').trim()})</span>
                )}
              </p>
              {p.date.trim() && (
                <p className="text-[10px] text-neutral-500 italic">{p.date.trim()}</p>
              )}
            </div>
            <ul className="mt-0.5 space-y-0.5" style={ulIndent}>
              {publicationBullets(p).map((b, i) => (
                <li key={i} className="flex gap-1.5 text-[11px]">
                  <span style={{ color: tpl.accent }}>•</span>
                  <span>
                    <InlineText
                      value={b}
                      onCommit={
                        onEdit &&
                        ((v) =>
                          onEdit({
                            ...resume,
                            publications: (resume.publications ?? []).map((x) =>
                              x.id === p.id
                                ? { ...x, description: editDescriptionLine(x.description, i, v) }
                                : x
                            ),
                          }))
                      }
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </>
    ) : null
  }
  if (sectionKey === 'references') {
    const items = referenceEntries(resume)
    return items.length > 0 ? (
      <>
        {heading(sectionHeading(resume, 'references'), 'references')}
        {items.map((x) => (
          <div key={x.id} className="mb-2">
            <p className="text-[11.5px] font-bold">
              <InlineText
                value={x.name.trim()}
                onCommit={
                  onEdit &&
                  ((v) =>
                    onEdit({
                      ...resume,
                      references: (resume.references ?? []).map((r) =>
                        r.id === x.id ? { ...r, name: v } : r
                      ),
                    }))
                }
              />
              {(x.title.trim() || x.employer.trim()) && (
                <span className="font-normal">
                  {' — '}
                  {[x.title.trim(), x.employer.trim()].filter(Boolean).join(', ')}
                </span>
              )}
            </p>
            {referenceDetailLine(x) && (
              <p className="mt-0.5 text-[11px]">{referenceDetailLine(x)}</p>
            )}
          </div>
        ))}
      </>
    ) : null
  }
  if (sectionKey === 'military') {
    const items = militaryEntries(resume)
    return items.length > 0 ? (
      <>
        {heading(sectionHeading(resume, 'military'), 'military')}
        {items.map((m) => (
          <div key={m.id} className="mb-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <p className="text-[11.5px] font-bold">
                <InlineText
                  value={m.rank.trim()}
                  fallback="Rank"
                  onCommit={
                    onEdit &&
                    ((v) =>
                      onEdit({
                        ...resume,
                        military: (resume.military ?? []).map((x) =>
                          x.id === m.id ? { ...x, rank: v } : x
                        ),
                      }))
                  }
                />
                {m.branch.trim() && (
                  <span className="font-normal">
                    {'  ·  '}
                    <InlineText
                      value={m.branch.trim()}
                      onCommit={
                        onEdit &&
                        ((v) =>
                          onEdit({
                            ...resume,
                            military: (resume.military ?? []).map((x) =>
                              x.id === m.id ? { ...x, branch: v } : x
                            ),
                          }))
                      }
                    />
                    {m.location.trim() ? `, ${m.location.trim()}` : ''}
                  </span>
                )}
              </p>
              {militaryDates(m) && (
                <p className="text-[10px] text-neutral-500 italic">{militaryDates(m)}</p>
              )}
            </div>
            <ul className="mt-0.5 space-y-0.5" style={ulIndent}>
              {militaryBullets(m).map((b, i) => (
                <li key={i} className="flex gap-1.5 text-[11px]">
                  <span style={{ color: tpl.accent }}>•</span>
                  <span>
                    <InlineText
                      value={b}
                      onCommit={
                        onEdit &&
                        ((v) =>
                          onEdit({
                            ...resume,
                            military: (resume.military ?? []).map((x) =>
                              x.id === m.id
                                ? { ...x, description: editDescriptionLine(x.description, i, v) }
                                : x
                            ),
                          }))
                      }
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </>
    ) : null
  }
  if (sectionKey === 'agents') {
    const items = agentEntries(resume)
    return items.length > 0 ? (
      <>
        {heading(sectionHeading(resume, 'agents'), 'agents')}
        {items.map((a) => (
          <div key={a.id} className="mb-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <p className="text-[11.5px] font-bold">
                <InlineText
                  value={a.name.trim()}
                  onCommit={
                    onEdit &&
                    ((v) =>
                      onEdit({
                        ...resume,
                        agents: (resume.agents ?? []).map((x) =>
                          x.id === a.id ? { ...x, name: v } : x
                        ),
                      }))
                  }
                />
              </p>
              {a.date.trim() && (
                <p className="text-[10px] text-neutral-500 italic">{a.date.trim()}</p>
              )}
            </div>
            <ul className="mt-0.5 space-y-0.5" style={ulIndent}>
              {agentBullets(a).map((b, i) => {
                const off = a.skills.trim() ? 1 : 0
                return (
                  <li key={i} className="flex gap-1.5 text-[11px]">
                    <span style={{ color: tpl.accent }}>•</span>
                    <span>
                      {i < off ? (
                        b
                      ) : (
                        <InlineText
                          value={b}
                          onCommit={
                            onEdit &&
                            ((v) =>
                              onEdit({
                                ...resume,
                                agents: (resume.agents ?? []).map((x) =>
                                  x.id === a.id
                                    ? {
                                        ...x,
                                        description: editDescriptionLine(x.description, i - off, v),
                                      }
                                    : x
                                ),
                              }))
                          }
                        />
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </>
    ) : null
  }
  if (sectionKey.startsWith('custom:')) {
    const s = resume.customSections.find((x) => `custom:${x.id}` === sectionKey)
    if (!s || (!s.title.trim() && !s.bullets.some((b) => b.trim()))) return null
    return (
      <>
        {heading(
          <InlineText
            value={s.title.trim()}
            fallback="Additional"
            onCommit={
              onEdit &&
              ((v) =>
                onEdit({
                  ...resume,
                  customSections: resume.customSections.map((x) =>
                    x.id === s.id ? { ...x, title: v } : x
                  ),
                }))
            }
          />
        )}
        <ul className="mt-0.5 space-y-0.5" style={ulIndent}>
          {s.bullets.map(
            (b, i) =>
              b.trim() && (
                <li key={i} className="flex gap-1.5 text-[11px]">
                  <span style={{ color: tpl.accent }}>•</span>
                  <span>
                    <InlineText
                      value={b.trim()}
                      onCommit={
                        onEdit &&
                        ((v) =>
                          onEdit({
                            ...resume,
                            customSections: resume.customSections.map((x) =>
                              x.id === s.id
                                ? {
                                    ...x,
                                    bullets: v
                                      ? x.bullets.map((bb, bi) => (bi === i ? v : bb))
                                      : x.bullets.filter((_, bi) => bi !== i),
                                  }
                                : x
                            ),
                          }))
                      }
                    />
                  </span>
                </li>
              )
          )}
        </ul>
      </>
    )
  }
  return null
}
