import { describe, expect, it } from 'vitest'
import { looksLikeLinkedInExport, parseResumeText } from '../../src/lib/importText'

/**
 * One case per import behaviour fixed since R763, each traced to the real
 * file that exposed it (docs/plan-r7xx-*.md). Goldens catch *changes*; these
 * name what must stay true.
 */
const cv = (body: string) => parseResumeText(`Jane Doe\njane@example.com\n${body}`)

describe('experience headers', () => {
  it('R763: "Project Manager · Acme Corp" is a role, not a Projects heading', () => {
    const r = cv(`EXPERIENCE
Project Manager · Acme Corp
Jan 2020 – Present
• Delivered the platform
`)
    expect(r.projects).toEqual([])
    expect(r.experience).toMatchObject([
      { role: 'Project Manager', company: 'Acme Corp', startDate: 'Jan 2020', endDate: 'Present' },
    ])
  })

  it('R768: "Employer, Role; Dec 2023" is oriented by the role noun and single-dated', () => {
    const r = cv(`EXPERIENCE
Skin Bliss, Marketing Assistant; Dec 2023
• Ran the launch campaign
`)
    expect(r.experience).toMatchObject([
      { role: 'Marketing Assistant', company: 'Skin Bliss', startDate: 'Dec 2023', endDate: 'Dec 2023' },
    ])
  })

  it('R779: bare month line, long "Role · Company" header and "Co." employer are headers, not bullets', () => {
    const r = cv(`EXPERIENCE
Dec 2023
Publicity Officer · Oxford University Personalised Medicine Society
• Ran the society's social channels
Giggling Platypus Co.
July 2020 - Jan 2022
Barista
• Educated customers
Led migration for Contoso Ltd.
`)
    expect(r.experience.map((e) => [e.role, e.company, e.startDate, e.endDate, e.bullets])).toEqual([
      [
        'Publicity Officer',
        'Oxford University Personalised Medicine Society',
        'Dec 2023',
        'Dec 2023',
        ["Ran the society's social channels"],
      ],
      [
        'Barista',
        'Giggling Platypus Co.',
        'July 2020',
        'Jan 2022',
        ['Educated customers', 'Led migration for Contoso Ltd.'],
      ],
    ])
  })
})

describe('education', () => {
  it('R770: one-field-per-line layout fills one entry (school | City, ST / degree / Expected / GPA)', () => {
    const r = cv(`EDUCATION
University of Florida | Gainesville, FL
Bachelor of Science in Computer Science
Expected May 2026
GPA: 3.8
`)
    expect(r.education).toMatchObject([
      {
        degree: 'Bachelor of Science in Computer Science',
        school: 'University of Florida',
        location: 'Gainesville, FL',
        endDate: 'May 2026',
        details: 'GPA: 3.8',
      },
    ])
  })

  it('R775: a wrapped detail stays on its school instead of opening a bare row', () => {
    const r = cv(`EDUCATION
MBiochem Molecular and Cellular Biochemistry · University of Oxford
2021 – 2025
Crankstart Scholar (awarded to students from a low socio-economic
background)
`)
    expect(r.education).toHaveLength(1)
    expect(r.education[0].details).toBe(
      'Crankstart Scholar (awarded to students from a low socio-economic background)'
    )
  })

  it('R767: "Languages: …" under Skills and "Honors: …" under Education stay content', () => {
    const r = cv(`SKILLS
Frontend: React, TypeScript
Languages: English, Spanish
EDUCATION
BSc Computer Science · University of Leeds
2018 – 2021
Honors: Dean's List
`)
    expect(r.skills).toBe('Frontend: React, TypeScript\nLanguages: English, Spanish')
    expect(r.education).toMatchObject([{ school: 'University of Leeds', details: "Honors: Dean's List" }])
    expect(r.customSections ?? []).toEqual([])
  })
})

describe('projects', () => {
  it('R778: stack row is the first line, wrapped tails rejoin, hyphen wraps keep no space', () => {
    const r = cv(`PROJECTS
AlgoLens
Next.js · TypeScript · Vanilla CSS · React · Vercel
• Built a multi-tenant visualiser used by 200 students and shared with the whole cohort as static
files
• Shipped an end-
to-end grading pipeline
Cloud Cost Tracker
• Built alerts to
control API costs
`)
    expect(r.projects.map((p) => [p.name, p.link, p.description])).toEqual([
      [
        'AlgoLens',
        '',
        'Next.js · TypeScript · Vanilla CSS · React · Vercel\nBuilt a multi-tenant visualiser used by 200 students and shared with the whole cohort as static files\nShipped an end-to-end grading pipeline',
      ],
      ['Cloud Cost Tracker', '', 'Built alerts to control API costs'],
    ])
  })
})

describe('section headings', () => {
  it('R780: a credential name is content, not a Projects / Certifications heading', () => {
    const r = cv(`EDUCATION
Bachelor of Business Administration · Ginyard University
2018 – 2021
ACTIVITIES
Community Volunteer
Graduate Project Management Certification
Certificate in Project Management
Project Management Certification
Google UX Design Certificate
`)
    expect(r.projects).toEqual([])
    expect(r.certifications).toBe('')
    expect(r.customSections).toMatchObject([
      {
        title: 'ACTIVITIES',
        bullets: [
          'Community Volunteer',
          'Graduate Project Management Certification',
          'Certificate in Project Management',
          'Project Management Certification',
          'Google UX Design Certificate',
        ],
      },
    ])
  })

  it('keeps compound headings that name one section', () => {
    const r = cv(`RESEARCH EXPERIENCE
Research Assistant · Leeds Lab
2020 – 2021
• Ran experiments
RELATED PROJECTS
Thesis Visualiser
• Built charts
Research Skills
Python, R
Professional Certifications
AWS Solutions Architect
`)
    expect(r.experience).toMatchObject([{ role: 'Research Assistant', company: 'Leeds Lab' }])
    expect(r.projects).toMatchObject([{ name: 'Thesis Visualiser' }])
    expect(r.skills).toBe('Python, R')
    expect(r.certifications).toBe('AWS Solutions Architect')
  })
})

describe('LinkedIn export detector (R776)', () => {
  it('needs two markers — a "<user> (LinkedIn)" contact line alone is a generic resume', () => {
    expect(looksLikeLinkedInExport('Jane Doe\njane (LinkedIn)\nEXPERIENCE\nEngineer · Acme\n')).toBe(false)
    expect(
      looksLikeLinkedInExport(
        'Contact\nwww.linkedin.com/in/jane\nTop Skills\nPython\nJane Doe\nExperience\nAcme\nEngineer\nJanuary 2020 - Present\n'
      )
    ).toBe(true)
  })
})
