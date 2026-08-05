/**
 * Live HTML preview of the resume, styled per template to closely mirror the
 * PDF/DOCX output. Rendered inside a fixed-aspect "page".
 */

import type { Resume } from '@/lib/resume'
import { getTemplate } from '@/lib/templates'

export function ResumePreview({ resume }: { resume: Resume }) {
  const tpl = getTemplate(resume.templateId)
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
        paddingBottom: tpl.divider === 'none' ? 0 : 3,
      }}
    >
      {tpl.headingCase === 'upper' ? label.toUpperCase() : label}
    </h3>
  )

  return (
    <div
      className="mx-auto w-full rounded-md border bg-white p-8 text-[#1f1f1f] shadow-sm"
      style={{ fontFamily, aspectRatio: '8.5 / 11', overflow: 'hidden' }}
      aria-label="Resume preview"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold">{c.fullName || 'Your Name'}</h2>
        {c.title && (
          <p className="mt-0.5 text-sm" style={{ color: tpl.accent }}>
            {c.title}
          </p>
        )}
        {contactLine && (
          <p className="mt-1 text-[10px] text-neutral-500">{contactLine}</p>
        )}
      </div>

      {resume.summary.trim() && (
        <>
          {heading('Summary')}
          <p className="text-[11px] leading-relaxed">{resume.summary.trim()}</p>
        </>
      )}

      {resume.experience.some((e) => e.company || e.role) && (
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
                        <li key={i} className="flex gap-1.5 text-[11px] leading-snug">
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
      )}

      {resume.projects.some((p) => p.name) && (
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
                  <p className="text-[11px] leading-snug">{p.description.trim()}</p>
                )}
              </div>
            )
          )}
        </>
      )}

      {resume.education.some((e) => e.school) && (
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
                  <p className="text-[11px] leading-snug">{e.details.trim()}</p>
                )}
              </div>
            )
          )}
        </>
      )}

      {resume.skills.trim() && (
        <>
          {heading('Skills')}
          <p className="text-[11px] leading-relaxed">{resume.skills.trim()}</p>
        </>
      )}

      {resume.certifications.trim() && (
        <>
          {heading('Certifications')}
          <p className="text-[11px] leading-relaxed">{resume.certifications.trim()}</p>
        </>
      )}
    </div>
  )
}
