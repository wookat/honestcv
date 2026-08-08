/**
 * Live HTML preview of the resume, styled per template to closely mirror the
 * PDF/DOCX output. Rendered inside a fixed-aspect "page".
 */

import { type Resume, fontScaleOf, lineSpacingOf, orderedSectionKeys } from '@/lib/resume'
import { accentTint, resolveTemplate } from '@/lib/templates'

export function ResumePreview({ resume }: { resume: Resume }) {
  const tpl = resolveTemplate(resume.templateId, resume.accentColor)
  const c = resume.contact
  const fontFamily = tpl.serif ? 'Georgia, "Times New Roman", serif' : 'Inter, Arial, sans-serif'
  const contactLine = [c.email, c.phone, c.location, c.website, c.linkedin]
    .filter(Boolean)
    .join('  |  ')

  const heading = (label: string) => (
    <h3
      className="mt-4 mb-1.5 text-[11px] font-bold tracking-wide"
      style={{
        color: tpl.accent,
        borderBottom:
          tpl.divider === 'none'
            ? 'none'
            : `${tpl.divider === 'thick' ? 2 : 1}px solid ${tpl.accent}`,
        paddingBottom: tpl.band ? 3 : tpl.divider === 'none' ? 0 : 3,
        ...(tpl.band
          ? { background: accentTint(tpl.accent), padding: '3px 6px', borderRadius: 2 }
          : {}),
      }}
    >
      {tpl.headingCase === 'upper' ? label.toUpperCase() : label}
    </h3>
  )

  return (
    <div
      data-resume-preview
      className="mx-auto w-full rounded-md border bg-white p-8 text-[#1f1f1f] shadow-sm"
      style={{
        fontFamily,
        aspectRatio: resume.pageSize === 'a4' ? '210 / 297' : '8.5 / 11',
        overflow: 'hidden',
        // Mirror the export's text-size and line-spacing settings
        zoom: fontScaleOf(resume),
        lineHeight: lineSpacingOf(resume) + 0.1,
      }}
      aria-label="Resume preview"
    >
      <div className={tpl.headerAlign === 'left' ? 'text-left' : 'text-center'}>
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
        {contactLine && (
          <p className="mt-1 text-[10px] text-neutral-500">{contactLine}</p>
        )}
      </div>

      {orderedSectionKeys(resume).map((key) => (
        <SectionBlock key={key} sectionKey={key} resume={resume} heading={heading} />
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
                <ul className="mt-0.5 space-y-0.5">
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
                <p className="text-[11px] font-bold">
                  {p.name}
                  {p.link && <span className="font-normal"> — {p.link}</span>}
                </p>
                {p.description.trim() && (
                  <p className="text-[11px]">{p.description.trim()}</p>
                )}
              </div>
          )
        )}
      </>
    ) : null
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
                {e.details.trim() && (
                  <p className="text-[11px]">{e.details.trim()}</p>
                )}
              </div>
          )
        )}
      </>
    ) : null
  if (sectionKey === 'skills')
    return resume.skills.trim() ? (
      <>
        {heading('Skills')}
        <p className="text-[11px]">{resume.skills.trim()}</p>
      </>
    ) : null
  if (sectionKey === 'certifications')
    return resume.certifications.trim() ? (
      <>
        {heading('Certifications')}
        <p className="text-[11px]">{resume.certifications.trim()}</p>
      </>
    ) : null
  if (sectionKey.startsWith('custom:')) {
    const s = resume.customSections.find((x) => `custom:${x.id}` === sectionKey)
    if (!s || (!s.title.trim() && !s.bullets.some((b) => b.trim()))) return null
    return (
      <>
        {heading(s.title.trim() || 'Additional')}
        <ul className="mt-0.5 space-y-0.5">
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
