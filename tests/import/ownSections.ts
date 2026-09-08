import type { Resume } from '../../src/lib/resume'

/**
 * A resume carrying one entry in every structured optional section the Builder
 * offers, in the shapes our exports print (R797). Shared by the TXT / MD, PDF
 * and DOCX round-trip tests.
 */
export function withOwnSections(r: Resume): Resume {
  return {
    ...r,
    certifications: '',
    certItems: [
      {
        id: 'c1',
        name: 'AWS Solutions Architect – Associate',
        issuer: 'Amazon Web Services',
        date: '2023',
        description: 'Designed the multi-region failover for Northstar.',
      },
    ],
    involvement: [
      {
        id: 'i1',
        role: 'Mentor',
        organization: 'Women Who Code Austin',
        location: 'Austin, TX',
        startDate: 'Jan 2022',
        endDate: 'Present',
        description: 'Mentored 12 early-career engineers.\nRan a monthly systems-design study group.',
      },
    ],
    coursework: [
      {
        id: 'k1',
        name: 'Distributed Systems',
        institution: 'University of Texas at Austin',
        date: '2020',
        skill: 'Go, Raft',
        description: 'Built a replicated key-value store.',
      },
    ],
    awards: [
      {
        id: 'a1',
        name: "Dean's List",
        organization: 'University of Texas at Austin',
        date: '2019',
        description: 'Top 5% of the class.',
      },
    ],
    publications: [
      {
        id: 'p1',
        title: 'Streaming resume parsing at the edge',
        venue: 'JSConf',
        kind: 'Talk',
        date: '2024',
        description: 'Recorded talk, 40 min.',
      },
    ],
    references: [
      {
        id: 'r1',
        name: 'Dana Whitfield',
        title: 'VP Engineering',
        employer: 'Northstar Digital',
        email: 'dana@northstar.example',
        phone: '+1 512 555 0100',
        kind: 'professional',
      },
    ],
    military: [
      {
        id: 'm1',
        rank: 'Sergeant',
        branch: 'US Army',
        location: 'Fort Hood, TX',
        startDate: '2010',
        endDate: '2014',
        description: 'Led a 12-person logistics team.',
      },
    ],
    sectionOrder: [
      'summary',
      'experience',
      'projects',
      'involvement',
      'education',
      'coursework',
      'skills',
      'certifications',
      'awards',
      'publications',
      'references',
      'military',
    ],
  }
}

export const OWN_SECTION_KEYS = [
  'certItems',
  'involvement',
  'coursework',
  'awards',
  'publications',
  'references',
  'military',
] as const

const sortKeys = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(sortKeys)
    : v && typeof v === 'object'
      ? Object.fromEntries(
          Object.keys(v as object)
            .sort()
            .map((k) => [k, sortKeys((v as Record<string, unknown>)[k])])
        )
      : v

/** The structured optional sections without ids, keys sorted, for equality checks. */
export const ownSections = (r: Resume) =>
  sortKeys(
    JSON.parse(
      JSON.stringify(
        Object.fromEntries(OWN_SECTION_KEYS.map((k) => [k, r[k] ?? []])),
        (k, x) => (k === 'id' ? undefined : x)
      )
    )
  )
