import { describe, expect, it } from 'vitest'
import { humanNameCase, looksLikeLinkedInExport, parseResumeText } from '../../src/lib/importText'
import { emptyEducation, resumeToMarkdown, resumeToPlainText, sampleResume, type Resume } from '../../src/lib/resume'

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

  it('R781: a gutter label at the start of a line opens the section and keeps the line', () => {
    // Chrome's PDF copy of the Sidebar template: label + one space + content
    const r = cv(`SUMMARY Software engineer with six years of experience building web applications.
Focused on React and TypeScript.
EXPERIENCE Senior Software Engineer · Northstar Digital, London, UK Jan 2022 – Present
• Led a checkout redesign
Software Engineer · Harbor Analytics, London, UK Jul 2020 – Dec 2021
• Built dashboards
EDUCATION BSc Computer Science · University of Bristol, Bristol, UK Sep 2017 – Jun 2020
SKILLS Languages: TypeScript, JavaScript
Frontend: React, Redux
LANGUAGES English (native), Spanish (B2)
`)
    expect(r.summary).toBe(
      'Software engineer with six years of experience building web applications. Focused on React and TypeScript.'
    )
    expect(r.experience).toMatchObject([
      { role: 'Senior Software Engineer', company: 'Northstar Digital', location: 'London, UK', startDate: 'Jan 2022', endDate: 'Present', bullets: ['Led a checkout redesign'] },
      { role: 'Software Engineer', company: 'Harbor Analytics', startDate: 'Jul 2020', endDate: 'Dec 2021', bullets: ['Built dashboards'] },
    ])
    expect(r.education).toMatchObject([
      { degree: 'BSc Computer Science', school: 'University of Bristol', location: 'Bristol, UK', startDate: 'Sep 2017', endDate: 'Jun 2020' },
    ])
    expect(r.skills).toBe('Languages: TypeScript, JavaScript\nFrontend: React, Redux')
    expect(r.customSections).toMatchObject([{ title: 'LANGUAGES', bullets: ['English (native), Spanish (B2)'] }])
    // pdftotext -layout: wide gaps instead of one space
    const layout = cv(`SUMMARY        Software engineer with six years of experience.
EXPERIENCE     Senior Software Engineer · Northstar Digital, London, UK        Jan 2022 – Present
               • Led a checkout redesign
`)
    expect(layout.summary).toBe('Software engineer with six years of experience.')
    expect(layout.experience).toMatchObject([
      { role: 'Senior Software Engineer', company: 'Northstar Digital', startDate: 'Jan 2022', endDate: 'Present', bullets: ['Led a checkout redesign'] },
    ])
  })

  it('R781: a caps heading with an aside, an alternative or a role after it is not a gutter label', () => {
    const r = cv(`WORK EXPERIENCE (Your most impressive items – school and work – need to be first.)
Co-Founder · SheetsResume.com
Aug 2023 – Present
OBJECTIVE or PROFESSIONAL SUMMARY
Write two lines here.
`)
    expect(r.experience).toMatchObject([{ role: 'Co-Founder', company: 'SheetsResume.com', startDate: 'Aug 2023' }])
    expect(r.summary).toBe('Write two lines here.')
    const exp = cv(`EXPERIENCE
PROJECT MANAGER Acme Corp
Jan 2020 – Present
• CISSP certified since 2019
`)
    expect(exp.projects).toEqual([])
    expect(exp.experience).toHaveLength(1)
    expect(exp.experience[0].bullets).toEqual(['CISSP certified since 2019'])
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

describe('contact name', () => {
  it('R782: a name a template printed in capitals is stored in name case; the header line is still skipped', () => {
    const r = parseResumeText(`ALEX MORGAN
Software Engineer
alex@example.com · London, UK
SUMMARY
Builds web apps.
EXPERIENCE
Engineer · Acme
2020 – 2021
• Shipped things
`)
    expect(r.contact.fullName).toBe('Alex Morgan')
    expect(r.contact.title).toBe('Software Engineer')
    expect(r.summary).toBe('Builds web apps.')
    expect(r.experience).toMatchObject([{ role: 'Engineer', company: 'Acme' }])
    expect(parseResumeText('Alex Morgan\nalex@example.com\n').contact.fullName).toBe('Alex Morgan')
    expect(parseResumeText('alex morgan\nalex@example.com\n').contact.fullName).toBe('alex morgan')
  })

  it('R782: humanNameCase keeps hyphens, apostrophes, particles, numerals, initials and Mc-', () => {
    expect(humanNameCase("MARY-JANE O'NEIL")).toBe("Mary-Jane O'Neil")
    expect(humanNameCase('LUDWIG VAN BEETHOVEN')).toBe('Ludwig van Beethoven')
    expect(humanNameCase('JOHN SMITH III')).toBe('John Smith III')
    expect(humanNameCase('J.R.R. TOLKIEN')).toBe('J.R.R. Tolkien')
    expect(humanNameCase('RONALD MCDONALD')).toBe('Ronald McDonald')
    expect(humanNameCase('ÉMILE ZOLA')).toBe('Émile Zola')
    expect(humanNameCase('LI')).toBe('LI')
    expect(humanNameCase('MacKenzie Scott')).toBe('MacKenzie Scott')
    expect(humanNameCase('')).toBe('')
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

describe('our own TXT / Markdown exports re-imported (R783)', () => {
  const fields = (r: Resume) => ({
    name: r.contact.fullName,
    summary: r.summary,
    skills: r.skills,
    experience: r.experience.map(({ role, company, location, startDate, endDate, bullets }) => ({
      role,
      company,
      location,
      startDate,
      endDate,
      bullets,
    })),
    education: r.education.map(({ degree, school, location, startDate, endDate, details }) => ({
      degree,
      school,
      location,
      startDate,
      endDate,
      details,
    })),
  })

  it('the sample resume survives resumeToPlainText → parseResumeText field for field', () => {
    const src = sampleResume()
    const txt = resumeToPlainText(src, { keepLinkUrls: true })
    expect(txt).toContain('Software Engineer at Brightlane, Austin, TX (Jun 2023 – Present)')
    expect(txt).toContain('B.S. Computer Science, University of Texas at Austin, Austin, TX (2017 – 2021)')
    expect(fields(parseResumeText(txt))).toEqual(fields(src))
  })

  it('the sample resume survives resumeToMarkdown → parseResumeText field for field', () => {
    const src = sampleResume()
    const md = resumeToMarkdown(src)
    expect(md).toContain('### Junior Developer — Nova Retail, Remote *(Jul 2021 – May 2023)*')
    expect(fields(parseResumeText(md))).toEqual(fields(src))
  })

  it('"Role at Company (dates)" leaves no empty brackets; "at" inside a school name is not a separator', () => {
    const r = cv(`EXPERIENCE
Advanced Data Scientist at Honeywell (Jan 2020 – Present)
- Built models
Teaching Assistant, University at Buffalo (2018 – 2019)
- Ran labs
Engineer at Acme, Berlin, Germany (2016 – 2018)
- Shipped things
EDUCATION
B.S. Computer Science, University of Texas at Austin, Austin, TX (2017 – 2021)
BSc Physics at University of Bristol, Bristol, UK (2010 – 2013)
`)
    expect(r.experience).toMatchObject([
      { role: 'Advanced Data Scientist', company: 'Honeywell', location: '' },
      { role: 'Teaching Assistant', company: 'University at Buffalo', location: '' },
      { role: 'Engineer', company: 'Acme', location: 'Berlin, Germany' },
    ])
    expect(r.education).toMatchObject([
      { degree: 'B.S. Computer Science', school: 'University of Texas at Austin', location: 'Austin, TX' },
      { degree: 'BSc Physics', school: 'University of Bristol', location: 'Bristol, UK' },
    ])
  })

  it('Markdown structure is unwrapped; inline marks inside bullets and "A*" grades stay', () => {
    const r = parseResumeText(`# Jane Doe — Engineer

jane@example.com · London, UK

## Experience

### Engineer — Acme *(2020 – 2021)*

- Shipped **three** releases, graded A* by the client

## Projects

### [AlgoLens](https://algolens.example) *(Mar 2021 – Jun 2021)*

- Visualises sorting algorithms
- Built with React

## Education

### BSc Physics, University of Bristol, Bristol, UK *(2016 – 2019)*

First Class Honours. Final project: an A* route planner.
`)
    expect(r.contact.fullName).toBe('Jane Doe')
    expect(r.experience).toMatchObject([
      { role: 'Engineer', company: 'Acme', startDate: '2020', endDate: '2021', bullets: ['Shipped **three** releases, graded A* by the client'] },
    ])
    expect(r.projects).toMatchObject([
      { name: 'AlgoLens', link: 'https://algolens.example', startDate: 'Mar 2021', endDate: 'Jun 2021', description: 'Visualises sorting algorithms\nBuilt with React' },
    ])
    expect(r.education).toMatchObject([
      {
        degree: 'BSc Physics',
        school: 'University of Bristol',
        location: 'Bristol, UK',
        details: 'First Class Honours. Final project: an A* route planner.',
      },
    ])
    // one "#" line is a plain-text resume, not Markdown
    expect(parseResumeText('# Jane Doe\njane@example.com\n').contact.fullName).toBe('# Jane Doe')
  })
})

describe('project header round trip (R783)', () => {
  it('"Name · Org (link) (dates)" from our TXT / MD export keeps every field', () => {
    const src = sampleResume()
    src.projects = [
      {
        id: 'p1',
        name: 'AlgoLens',
        org: 'Hack Club',
        link: 'https://algolens.example',
        startDate: 'Mar 2021',
        endDate: 'Jun 2021',
        description: 'Visualises sorting algorithms\nBuilt with React',
      },
    ]
    for (const text of [resumeToPlainText(src, { keepLinkUrls: true }), resumeToMarkdown(src)]) {
      expect(parseResumeText(text).projects).toMatchObject([
        {
          name: 'AlgoLens',
          org: 'Hack Club',
          link: 'https://algolens.example',
          startDate: 'Mar 2021',
          endDate: 'Jun 2021',
          description: 'Visualises sorting algorithms\nBuilt with React',
        },
      ])
    }
  })
})

describe('education grade list round trip (R783)', () => {
  it('"Chemistry A*, Mathematics A*" under our exported school line stays its details', () => {
    const src = sampleResume()
    src.education = [
      {
        ...emptyEducation(),
        id: 'e1',
        degree: 'A Levels',
        school: 'Durham Sixth Form',
        location: 'Durham, UK',
        startDate: '2016',
        endDate: '2018',
        details: 'Chemistry A*, Mathematics A*',
      },
      {
        ...emptyEducation(),
        id: 'e2',
        degree: 'BSc Physics',
        school: 'University of Bristol',
        location: 'Bristol, UK',
        startDate: '2018',
        endDate: '2021',
        details: 'Modules: Quantum Mechanics, Thermodynamics',
      },
    ]
    for (const text of [resumeToPlainText(src, { keepLinkUrls: true }), resumeToMarkdown(src)]) {
      expect(parseResumeText(text).education).toMatchObject([
        { degree: 'A Levels', school: 'Durham Sixth Form', location: 'Durham, UK', details: 'Chemistry A*, Mathematics A*' },
        { degree: 'BSc Physics', school: 'University of Bristol', location: 'Bristol, UK', details: 'Modules: Quantum Mechanics, Thermodynamics' },
      ])
    }
    // a "Degree, School" header is still a new entry
    const r = parseResumeText('Jane Doe\n\nEducation\nA Levels, Durham Sixth Form (2016 – 2018)\nBSc Physics, University of Bristol (2018 – 2021)')
    expect(r.education.map((e) => e.school)).toEqual(['Durham Sixth Form', 'University of Bristol'])
  })

  it('R784: a contact row with no separators (icon-led, or our pre-R784 PDFs) still yields the location', () => {
    const body = '\n\nExperience\nEngineer at Acme (2020 – 2021)\n- Shipped'
    const rows = [
      'jordan.reyes@email.com (555) 210-4432 Austin, TX linkedin.com/in/jordanreyes',
      'jordan.reyes@email.com   (555) 210-4432   Austin, TX   linkedin.com/in/jordanreyes',
      'alex@example.com +44 7700 900123 London, UK github.com/alex linkedin.com/in/alex',
      'Austin, TX (555) 210-4432 jordan.reyes@email.com',
    ]
    expect(rows.map((row) => parseResumeText(`Jordan Reyes\nSoftware Engineer\n${row}${body}`).contact.location)).toEqual([
      'Austin, TX',
      'Austin, TX',
      'London, UK',
      'Austin, TX',
    ])
    // the rest of the row still reads as before
    const c = parseResumeText(`Jordan Reyes\n${rows[0]}${body}`).contact
    expect(c).toMatchObject({ email: 'jordan.reyes@email.com', phone: '(555) 210-4432', linkedin: 'linkedin.com/in/jordanreyes' })
    // no place on the row → no invented location
    expect(parseResumeText(`Jordan Reyes\njordan.reyes@email.com (555) 210-4432 linkedin.com/in/jordanreyes${body}`).contact.location).toBe('')
    expect(parseResumeText(`Jordan Reyes\nSenior Engineer, IBM\njordan.reyes@email.com${body}`).contact.location).toBe('')
  })
})
