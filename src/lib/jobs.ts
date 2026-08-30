/**
 * Job search API helper plus the local application pipeline. Pipeline state
 * (saved / applied / interviewing / rejected, including the job's JD text)
 * lives in localStorage only, like resumes and career documents.
 */

export interface JobListing {
  id: string
  title: string
  company: string
  /** Company logo URL (may be missing on entries saved before it existed) */
  logo?: string
  category: string
  type: string
  location: string
  postedAt: string
  salary: string
  url: string
  description: string
}

export type JobStatus = 'saved' | 'applied' | 'interviewing' | 'rejected'

export const JOB_STATUSES: JobStatus[] = ['saved', 'applied', 'interviewing', 'rejected']

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interviewing: 'Interviewing',
  rejected: 'Rejected',
}

export interface PipelineEntry {
  job: JobListing
  status: JobStatus
  updatedAt: number
}

const PIPELINE_KEY = 'honestcv.jobPipeline'

/** Category slugs accepted by the jobs API (Remotive's fixed list). */
export const JOB_CATEGORIES: [slug: string, label: string][] = [
  ['software-dev', 'Software Development'],
  ['customer-support', 'Customer Service'],
  ['design', 'Design'],
  ['marketing', 'Marketing'],
  ['sales-business', 'Sales / Business'],
  ['product', 'Product'],
  ['project-management', 'Project Management'],
  ['data', 'Data Analysis'],
  ['devops', 'DevOps / Sysadmin'],
  ['finance-legal', 'Finance / Legal'],
  ['hr', 'Human Resources'],
  ['qa', 'QA'],
  ['writing', 'Writing'],
  ['all-others', 'All others'],
]

export async function searchJobs(q: string, category = ''): Promise<JobListing[]> {
  const params = new URLSearchParams({ q })
  if (category) params.set('category', category)
  const res = await fetch(`/api/jobs/search?${params}`)
  const data = (await res.json().catch(() => ({}))) as {
    jobs?: JobListing[]
    error?: string
  }
  if (!res.ok) throw new Error(data.error || `Job search failed (${res.status})`)
  return data.jobs ?? []
}

export function listPipeline(): PipelineEntry[] {
  try {
    const raw = localStorage.getItem(PIPELINE_KEY)
    return raw ? (JSON.parse(raw) as PipelineEntry[]) : []
  } catch {
    return []
  }
}

function savePipeline(entries: PipelineEntry[]): PipelineEntry[] {
  localStorage.setItem(PIPELINE_KEY, JSON.stringify(entries))
  return entries
}

export function upsertPipeline(job: JobListing, status: JobStatus): PipelineEntry[] {
  const rest = listPipeline().filter((e) => e.job.id !== job.id)
  return savePipeline([{ job, status, updatedAt: Date.now() }, ...rest])
}

export function removeFromPipeline(id: string): PipelineEntry[] {
  return savePipeline(listPipeline().filter((e) => e.job.id !== id))
}
