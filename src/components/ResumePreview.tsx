/**
 * Live HTML preview of the resume, styled per template to closely mirror the
 * PDF/DOCX output. Rendered inside fixed-aspect "pages" — pass `paginated`
 * to show every page of a long resume instead of clipping after page one.
 */

import { useEffect, useRef, useState } from 'react'

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
  onSectionJump,
}: {
  resume: Resume
  paginated?: boolean
  /** When set, clicking a section in the preview jumps to its editor card */
  onSectionJump?: (key: string) => void
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
  const contactFields: { text: string; icon: ContactIconKind }[] = [
    { text: c.email, icon: 'mail' as const },
    { text: c.phone, icon: 'phone' as const },
    { text: c.location, icon: 'pin' as const },
    { text: c.website, icon: 'globe' as const },
    { text: c.linkedin, icon: 'linkedin' as const },
  ].filter((f) => f.text)
  const contactLine = contactFields.map((f) => f.text).join('  |  ')

  const divider = tpl.band ? 'none' : dividerOf(resume, tpl.divider)
  const headingMarginTop = 16 * sectionSpacingOf(resume)
  const heading = (label: string) => (
    <h3
      className="mb-1.5 text-[11px] font-bold tracking-wide"
      style={{
        marginTop: headingMarginTop,
        color: tpl.accent,
        borderBottom:
          divider === 'none' ? 'none' : `${divider === 'thick' ? 2 : 1}px solid ${tpl.accent}`,
        paddingBottom: tpl.band ? 3 : divider === 'none' ? 0 : 3,
        ...(tpl.band
          ? { background: accentTint(tpl.accent), padding: '3px 6px', borderRadius: 2 }
          : {}),
      }}
    >
      {tpl.headingCase === 'upper' ? label.toUpperCase() : label}
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
          {tpl.nameCase === 'upper'
            ? (c.fullName || 'Your Name').toUpperCase()
            : c.fullName || 'Your Name'}
        </h2>
        {c.title && (
          <p className="mt-0.5 text-sm" style={{ color: tpl.accent }}>
            {c.title}
          </p>
        )}
        {contactLine &&
          (contactIconsOf(resume) ? (
            <p
              className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-neutral-500 ${
                tpl.headerAlign === 'left' ? 'justify-start' : 'justify-center'
              }`}
            >
              {contactFields.map((f) => (
                <span key={f.icon} className="inline-flex items-center gap-1">
                  <ContactIcon kind={f.icon} />
                  {f.text}
                </span>
              ))}
            </p>
          ) : (
            <p className="mt-1 text-[10px] text-neutral-500">{contactLine}</p>
          ))}
      </div>

      {orderedSectionKeys(resume).map((key) => (
        <div key={key} {...jumpProps(key, sectionLabel(resume, key))}>
          <SectionBlock sectionKey={key} resume={resume} heading={heading} />
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

function SectionBlock({
  sectionKey,
  resume,
  heading,
}: {
  sectionKey: string
  resume: Resume
  heading: (label: string) => React.ReactNode
}) {
  const tpl = resolveTemplate(resume.templateId, resume.accentColor)
  const ulIndent = bulletIndentOf(resume) ? { paddingLeft: 12 } : undefined
  if (sectionKey === 'summary')
    return resume.summary.trim() ? (
      <>
        {heading('Summary')}
        <p className="text-[11px]">{resume.summary.trim()}</p>
      </>
    ) : null
  if (sectionKey === 'experience')
    return resume.experience.some((e) => e.company || e.role) ? (
      <>
        {heading('Experience')}
          {resume.experience.map((e) =>
            !e.company && !e.role ? null : (
              <div key={e.id} className="mb-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <p className="text-[11.5px] font-bold">
                    {e.role || 'Role'}
                    <span className="font-normal">
                      {'  ·  '}
                      {e.company}
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
                  {e.bullets.map(
                    (b, i) =>
                      b.trim() && (
                        <li key={i} className="flex gap-1.5 text-[11px]">
                          <span style={{ color: tpl.accent }}>•</span>
                          <span>{b.trim()}</span>
                        </li>
                      )
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
        {heading('Projects')}
          {resume.projects.map((p) =>
            !p.name ? null : (
              <div key={p.id} className="mb-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <p className="text-[11px] font-bold">
                    {p.name}
                    {p.org?.trim() && <span className="font-normal">{'  ·  '}{p.org.trim()}</span>}
                    {p.link && <span className="font-normal"> — {p.link}</span>}
                  </p>
                  {projectDates(p) && (
                    <p className="text-[10px] text-neutral-500 italic">{projectDates(p)}</p>
                  )}
                </div>
                {p.description.trim() && (
                  <p className="text-[11px]">{p.description.trim()}</p>
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
        {heading('Involvement')}
        {items.map((inv) => (
          <div key={inv.id} className="mb-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <p className="text-[11.5px] font-bold">
                {inv.role.trim() || 'Role'}
                {inv.organization.trim() && (
                  <span className="font-normal">
                    {'  ·  '}
                    {inv.organization.trim()}
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
                  <span>{b}</span>
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
        {heading('Education')}
          {resume.education.map((e) =>
            !e.school ? null : (
              <div key={e.id} className="mb-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <p className="text-[11px] font-bold">
                    {e.degree || 'Degree'}
                    <span className="font-normal">
                      {'  ·  '}
                      {e.school}
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
        {heading('Coursework')}
        {items.map((cw) => (
          <div key={cw.id} className="mb-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <p className="text-[11.5px] font-bold">
                {cw.name.trim() || 'Course'}
                {cw.institution.trim() && (
                  <span className="font-normal">
                    {'  ·  '}
                    {cw.institution.trim()}
                  </span>
                )}
              </p>
              {cw.date.trim() && (
                <p className="text-[10px] text-neutral-500 italic">{cw.date.trim()}</p>
              )}
            </div>
            <ul className="mt-0.5 space-y-0.5" style={ulIndent}>
              {courseworkBullets(cw).map((b, i) => (
                <li key={i} className="flex gap-1.5 text-[11px]">
                  <span style={{ color: tpl.accent }}>•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </>
    ) : null
  }
  if (sectionKey === 'skills')
    return resume.skills.trim() ? (
      <>
        {heading('Skills')}
        {skillLines(resume).map((line, i) => (
          <p key={i} className="text-[11px]">
            {line.label ? <span className="font-semibold">{line.label}: </span> : null}
            {line.text}
          </p>
        ))}
      </>
    ) : null
  if (sectionKey === 'certifications') {
    const certs = certEntries(resume)
    return certs.length > 0 || resume.certifications.trim() ? (
      <>
        {heading('Certifications')}
        {certs.map((c) => (
          <div key={c.id} className="mb-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <p className="text-[11px] font-bold">
                {c.name.trim() || 'Certificate'}
                {c.issuer.trim() && <span className="font-normal"> — {c.issuer.trim()}</span>}
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
        {heading('Awards & Honors')}
        {items.map((a) => (
          <div key={a.id} className="mb-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <p className="text-[11.5px] font-bold">
                {a.name.trim() || 'Award'}
                {a.organization.trim() && (
                  <span className="font-normal"> — {a.organization.trim()}</span>
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
                  <span>{b}</span>
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
        {heading('Publications')}
        {items.map((p) => (
          <div key={p.id} className="mb-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <p className="text-[11.5px] font-bold">
                {p.title.trim() || 'Publication'}
                {p.venue.trim() && (
                  <span className="font-normal"> — {p.venue.trim()}</span>
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
                  <span>{b}</span>
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
        {heading('References')}
        {items.map((x) => (
          <div key={x.id} className="mb-2">
            <p className="text-[11.5px] font-bold">
              {x.name.trim()}
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
        {heading('Military service')}
        {items.map((m) => (
          <div key={m.id} className="mb-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <p className="text-[11.5px] font-bold">
                {m.rank.trim() || 'Rank'}
                {m.branch.trim() && (
                  <span className="font-normal">
                    {'  ·  '}
                    {m.branch.trim()}
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
                  <span>{b}</span>
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
        {heading('Agents')}
        {items.map((a) => (
          <div key={a.id} className="mb-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <p className="text-[11.5px] font-bold">{a.name.trim()}</p>
              {a.date.trim() && (
                <p className="text-[10px] text-neutral-500 italic">{a.date.trim()}</p>
              )}
            </div>
            <ul className="mt-0.5 space-y-0.5" style={ulIndent}>
              {agentBullets(a).map((b, i) => (
                <li key={i} className="flex gap-1.5 text-[11px]">
                  <span style={{ color: tpl.accent }}>•</span>
                  <span>{b}</span>
                </li>
              ))}
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
        {heading(s.title.trim() || 'Additional')}
        <ul className="mt-0.5 space-y-0.5" style={ulIndent}>
          {s.bullets.map(
            (b, i) =>
              b.trim() && (
                <li key={i} className="flex gap-1.5 text-[11px]">
                  <span style={{ color: tpl.accent }}>•</span>
                  <span>{b.trim()}</span>
                </li>
              )
          )}
        </ul>
      </>
    )
  }
  return null
}
