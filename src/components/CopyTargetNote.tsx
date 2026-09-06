import { Link } from 'react-router-dom'
import { copyTargetsJob, type PipelineEntry } from '@/lib/jobs'
import type { ResumeVersion } from '@/lib/resume'

/**
 * Trailing " · …" note for a saved copy's meta line: which tracked job it is the
 * targeted resume for, or — when it targets a job without being linked — whether
 * that job is tracked through another copy or no longer tracked at all.
 */
export function CopyTargetNote({
  version: v,
  pipeline,
}: {
  version: ResumeVersion
  pipeline: PipelineEntry[]
}) {
  const entry = pipeline.find((e) => e.resumeVersionId === v.id)
  if (entry)
    return (
      <>
        {' '}
        · for{' '}
        <Link
          to={`/jobs?job=${encodeURIComponent(entry.job.id)}`}
          className="underline underline-offset-2"
        >
          {entry.job.title} at {entry.job.company}
        </Link>
      </>
    )
  const role = v.data.targetRole.trim()
  if (!role) return null
  const company = (v.data.targetCompany ?? '').trim()
  const tracked = pipeline.find((e) => copyTargetsJob(v.data, e.job))
  return (
    <>
      {' '}
      · targeted at {role}
      {company ? ` at ${company}` : ''}
      {tracked ? (
        <>
          {' '}
          ·{' '}
          <Link
            to={`/jobs?job=${encodeURIComponent(tracked.job.id)}`}
            className="underline underline-offset-2"
          >
            tracked job uses another copy
          </Link>
        </>
      ) : (
        v.data.jobDescription.trim() !== '' && (
          <>
            {' '}
            · job no longer tracked —{' '}
            <Link to={`/jobs?q=${encodeURIComponent(role)}`} className="underline underline-offset-2">
              find it again
            </Link>
          </>
        )
      )}
    </>
  )
}
