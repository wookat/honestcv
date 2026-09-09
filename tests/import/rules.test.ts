import { describe, expect, it } from 'vitest'
import {
  headingCase,
  humanNameCase,
  keepDesignOnImport,
  keepTargetOnImport,
  looksLikeLinkedInExport,
  parseResumeText,
} from '../../src/lib/importText'
import {
  emptyEducation,
  emptyResume,
  orderedSectionKeys,
  resumeToMarkdown,
  resumeToPlainText,
  sampleResume,
  type Resume,
} from '../../src/lib/resume'
import { PRINTED_ORDER, ownSections, printedOrder, reorderedOwnSections, withOwnSections } from './ownSections'

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
        title: 'Activities',
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
    expect(r.customSections).toMatchObject([{ title: 'Languages', bullets: ['English (native), Spanish (B2)'] }])
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

  it('R802: a paste with no name leaves the name empty — a date line, an entry header or a summary sentence is not a name', () => {
    const headless = parseResumeText(`Senior Engineer · Acme Corp, Austin, TX
Jan 2020 – Present
- Shipped the platform to 2M users
- Cut p95 latency 40%
Staff Engineer · Beta Ltd
2017 – 2019
- Led a team of 6
EDUCATION
BS Computer Science · State University
2013 – 2017
SKILLS
React, TypeScript, Node.js
`)
    expect(headless.contact.fullName).toBe('')
    expect(headless.contact.title).toBe('')
    expect(headless.experience.map((e) => [e.role, e.company, e.location, e.startDate, e.endDate, e.bullets.length])).toEqual([
      ['Senior Engineer', 'Acme Corp', 'Austin, TX', 'Jan 2020', 'Present', 2],
      ['Staff Engineer', 'Beta Ltd', '', '2017', '2019', 1],
    ])
    expect(headless.education).toHaveLength(1)
    expect(headless.skills).toBe('React, TypeScript, Node.js')
    expect(headless.sectionOrder.indexOf('experience')).toBeLessThan(headless.sectionOrder.indexOf('education'))

    const headingFirst = parseResumeText(`EXPERIENCE
Senior Engineer · Acme Corp, Austin, TX
Jan 2020 – Present
- Shipped the platform
EDUCATION
BS Computer Science · State University
2013 – 2017
`)
    expect(headingFirst.contact.fullName).toBe('')
    expect(headingFirst.experience).toMatchObject([
      { role: 'Senior Engineer', company: 'Acme Corp', startDate: 'Jan 2020', endDate: 'Present', bullets: ['Shipped the platform'] },
    ])

    const summaryFirst = parseResumeText(`Product-minded engineer with 8 years building web platforms.
EXPERIENCE
Senior Engineer · Acme Corp
Jan 2020 – Present
- Shipped the platform
`)
    expect(summaryFirst.contact.fullName).toBe('')
    expect(summaryFirst.experience).toMatchObject([{ role: 'Senior Engineer', company: 'Acme Corp', bullets: ['Shipped the platform'] }])

    const contactOnly = parseResumeText(`jane@example.com · 555-111-2222
Senior Engineer | Acme Corp
Jan 2020 – Present
- Shipped the platform
`)
    expect(contactOnly.contact).toMatchObject({ fullName: '', title: '', email: 'jane@example.com', phone: '555-111-2222' })
    expect(contactOnly.experience).toMatchObject([{ role: 'Senior Engineer', company: 'Acme Corp', startDate: 'Jan 2020' }])
  })

  it('R802: a real name above the body is still the name — a place line before it is skipped, "Name — Headline" and "Name | Title" contact rows are untouched', () => {
    expect(parseResumeText('Austin, TX\nJane Doe\njane@example.com\n').contact.fullName).toBe('Jane Doe')
    const dash = parseResumeText('Jane Doe — Senior Engineer · Acme Corp\njane@example.com\nEXPERIENCE\nEngineer · Acme\n2020 – 2021\n')
    expect(dash.contact.fullName).toBe('Jane Doe')
    expect(dash.contact.title).toBe('Senior Engineer · Acme Corp')
    const row = parseResumeText('Jane Doe\njane@example.com | 555-111-2222 | Austin, TX\nEXPERIENCE\nEngineer · Acme\n2020 – 2021\n')
    expect(row.contact).toMatchObject({ fullName: 'Jane Doe', location: 'Austin, TX' })
    expect(row.experience).toMatchObject([{ role: 'Engineer', company: 'Acme' }])
    const bound = parseResumeText('Jane Doe | Senior Engineer\njane@example.com\nEXPERIENCE\nEngineer · Acme\n2020 – 2021\n')
    expect(bound.contact.fullName).toContain('Jane Doe')
    expect(bound.experience).toMatchObject([{ role: 'Engineer', company: 'Acme', startDate: '2020' }])
  })

  it('R803: a "City, ST" line of its own in the header is the location, not the title', () => {
    const underName = parseResumeText('Jane Doe\nAustin, TX\njane@example.com · 555-111-2222\nEXPERIENCE\nEngineer · Acme\n2020 – 2021\n')
    expect(underName.contact).toMatchObject({ fullName: 'Jane Doe', title: '', location: 'Austin, TX', email: 'jane@example.com' })
    expect(underName.experience).toMatchObject([{ role: 'Engineer', company: 'Acme', startDate: '2020' }])

    // Canva: contact row first, the city on the next line
    const afterContact = parseResumeText('Henrietta Mitchell\n+123-456-7890 · hello@example.com · @example.com\nAny City, ST\nSKILLS\nP&L Management\n')
    expect(afterContact.contact).toMatchObject({ fullName: 'Henrietta Mitchell', title: '', location: 'Any City, ST' })

    // the title before or after the place line is still the title; a paragraph under the place line is still the summary
    expect(parseResumeText('Jane Doe\nAustin, TX\nSenior Engineer\njane@example.com\n').contact).toMatchObject({ title: 'Senior Engineer', location: 'Austin, TX' })
    expect(parseResumeText('Jane Doe\nSenior Engineer\nAustin, TX\njane@example.com\n').contact).toMatchObject({ title: 'Senior Engineer', location: 'Austin, TX' })
    const prose = parseResumeText('Jane Doe\nAustin, TX\nSeasoned platform engineer with ten years building web systems for retail and fintech teams.\nEXPERIENCE\nEngineer · Acme\n2020 – 2021\n')
    expect(prose.contact).toMatchObject({ title: '', location: 'Austin, TX' })
    expect(prose.summary).toBe('Seasoned platform engineer with ten years building web systems for retail and fintech teams.')
    expect(prose.experience).toMatchObject([{ role: 'Engineer', company: 'Acme' }])

    // a comma in a title or an employer is not a place
    expect(parseResumeText('Jane Doe\nDirector, Engineering\njane@example.com\n').contact.title).toBe('Director, Engineering')
    expect(parseResumeText('Jane Doe\nAcme, Inc\njane@example.com\n').contact.title).toBe('Acme, Inc')
  })

  it('R804: a lone year under an education entry is its graduation year, not a second entry', () => {
    const edu = (text: string) =>
      parseResumeText(`Jane Doe\njane@example.com\nEDUCATION\n${text}`).education.map(
        ({ degree, school, startDate, endDate, details }) => ({ degree, school, startDate, endDate, details }),
      )
    // our own PDF / DOCX exports print an end-only education date on its own line
    expect(edu('BS Computer Science · State University\n2016\n')).toEqual([
      { degree: 'BS Computer Science', school: 'State University', startDate: '2016', endDate: '2016', details: '' },
    ])
    expect(edu('State University\nBS Computer Science\n2016\nGPA: 3.8\n')).toEqual([
      { degree: 'BS Computer Science', school: 'State University', startDate: '2016', endDate: '2016', details: 'GPA: 3.8' },
    ])
    expect(edu('MS Data Science · Tech Institute\n2018\nBS Computer Science · State University\n2016\n')).toEqual([
      { degree: 'MS Data Science', school: 'Tech Institute', startDate: '2018', endDate: '2018', details: '' },
      { degree: 'BS Computer Science', school: 'State University', startDate: '2016', endDate: '2016', details: '' },
    ])
    // a range, a month and an inline year keep their existing reading
    expect(edu('BS Computer Science · State University\n2012 – 2016\n')).toMatchObject([{ startDate: '2012', endDate: '2016' }])
    expect(edu('BS Computer Science · State University\nMay 2016\n')).toMatchObject([{ startDate: 'May 2016', endDate: 'May 2016' }])
    expect(edu('BS Computer Science · State University (2016)\n')).toMatchObject([{ startDate: '2016', endDate: '2016' }])
    // an entry that already has dates does not take a later year
    expect(edu('BS Computer Science · State University\n2012 – 2016\n2018\n')[0]).toMatchObject({ startDate: '2012', endDate: '2016' })
  })

  it('R805: a section heading ends the name scan — a fragment pasted from EDUCATION / SUMMARY down keeps its first line in the section', () => {
    const head = (text: string) => {
      const r = parseResumeText(text)
      return {
        name: r.contact.fullName,
        title: r.contact.title,
        summary: r.summary,
        edu: r.education.map(({ degree, school, startDate, endDate, details }) => [degree, school, startDate, endDate, details]),
      }
    }
    expect(head('EDUCATION\nState University\nBS Computer Science\n2016\nGPA: 3.8')).toEqual({
      name: '',
      title: '',
      summary: '',
      edu: [['BS Computer Science', 'State University', '2016', '2016', 'GPA: 3.8']],
    })
    expect(head('jane@example.com · 555-111-2222\nEDUCATION\nState University\nBS Computer Science\n2016')).toMatchObject({
      name: '',
      edu: [['BS Computer Science', 'State University', '2016', '2016', '']],
    })
    expect(head('SUMMARY\nSeasoned engineer.\nEXPERIENCE\nEngineer · Acme\n2020 – 2021\n- Built.')).toMatchObject({
      name: '',
      title: '',
      summary: 'Seasoned engineer.',
    })
    const gutter = parseResumeText('EXPERIENCE Senior Engineer · Acme Corp\nJan 2020 – Present\n- Built things.')
    expect(gutter.contact.fullName).toBe('')
    expect(gutter.experience.map((e) => [e.role, e.company])).toEqual([['Senior Engineer', 'Acme Corp']])
    // a real name above the heading is still the name
    expect(head('Jane Doe\nEDUCATION\nState University\nBS Computer Science\n2016\nGPA: 3.8')).toMatchObject({
      name: 'Jane Doe',
      edu: [['BS Computer Science', 'State University', '2016', '2016', 'GPA: 3.8']],
    })
    // a document title printed over the name is neither the name nor the title
    expect(head('CURRICULUM VITAE\nJane Doe\njane@example.com\nEDUCATION\nBS Computer Science · State University\n2016')).toMatchObject({
      name: 'Jane Doe',
      title: '',
    })
    expect(head('Personal Details\nJane Doe\nSenior Engineer\njane@example.com · 555-111-2222\nEXPERIENCE\nEngineer · Acme\n2020 – 2021')).toMatchObject({
      name: 'Jane Doe',
      title: 'Senior Engineer',
    })
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

describe('an entry header that opens with a section word (R787)', () => {
  // A LinkedIn profile re-exported by us: the second experience is titled
  // "About Recommendations · Recommendations". Read as a Summary heading, it
  // swallowed the remaining 20 experiences into a 17.5k-character summary.
  const heads = [
    'About Recommendations · Recommendations',
    'About Recommendations at Recommendations',
    'About Recommendations — Recommendations',
    'Profile Lead at Acme Corp',
  ]
  it.each(heads)('"%s" under Experience is an entry, not a summary heading', (head) => {
    const r = cv(`Summary
Engineering leader.

Experience
Engineering Team Leader · AT&T
2023
- Led the platform group.
${head}
2020 – 2021
- Recommendations from clients and colleagues.
Senior Scrum Master · Adobe
2019
- Coached four teams.`)
    expect(r.summary).toBe('Engineering leader.')
    expect(r.experience.map((e) => e.role)).toEqual(['Engineering Team Leader', head.split(/\s(?:·|at|—)\s/)[0], 'Senior Scrum Master'])
    expect(r.experience[1].company).toBe(head.split(/\s(?:·|at|—)\s/)[1])
    expect(r.experience[1].bullets).toEqual(['Recommendations from clients and colleagues.'])
    expect(r.experience[2]).toMatchObject({ company: 'Adobe', startDate: '2019', endDate: '2019' })
  })

  it('genuine summary headings still open the section', () => {
    for (const heading of ['About', 'About Me', 'SUMMARY', 'Professional Summary', 'OBJECTIVE or PROFESSIONAL SUMMARY', 'Profile']) {
      const r = cv(`${heading}\nBuilds reliable systems.\n\nExperience\nEngineer at Acme Corp (2020 – 2021)\n- Shipped`)
      expect(r.summary, heading).toBe('Builds reliable systems.')
      expect(r.experience.map((e) => e.role), heading).toEqual(['Engineer'])
    }
  })

  it('a year in parentheses closes a header; a sentence\'s year and an "Inc." period are told apart', () => {
    const r = cv(`Experience
Senior Scrum Master at Adobe, San Jose, CA (2019)
- Coached four teams.
Program Manager at Cox Automotive Inc. (2018)
- We shipped the platform. (2017)`)
    expect(r.experience).toMatchObject([
      { role: 'Senior Scrum Master', company: 'Adobe', location: 'San Jose, CA', startDate: '2019', endDate: '2019' },
      { role: 'Program Manager', company: 'Cox Automotive Inc.', startDate: '2018', endDate: '2018', bullets: ['We shipped the platform. (2017)'] },
    ])
  })

  it('a long "Name — Headline" first line and a region-only location are read as contact fields', () => {
    const headline =
      'Engineering Manager; Agile Leader - Agile Coach, Scrum Master, CSP, CSM, SAFe Expert; Program Manager at Apple, IBM & more...'
    for (const sep of [' | ', ' · ']) {
      const r = parseResumeText(
        `Kenneth Adams — ${headline}\n${['ken@example.com', 'Las Vegas Metropolitan Area', 'linkedin.com/in/kenadams'].join(sep)}\n\nExperience\nEngineer at Acme Corp (2020 – 2021)\n- Shipped`
      )
      expect(r.contact, sep).toMatchObject({
        fullName: 'Kenneth Adams',
        title: headline,
        email: 'ken@example.com',
        location: 'Las Vegas Metropolitan Area',
        linkedin: 'linkedin.com/in/kenadams',
      })
    }
    // the headline on its own line between the name and the contact row, or wrapped over two
    const own = parseResumeText(`Kenneth Adams\n${headline}\nken@example.com | Las Vegas Metropolitan Area\n\nExperience\nEngineer at Acme Corp (2020 – 2021)`)
    expect(own.contact.title).toBe(headline)
    const wrapped = parseResumeText(
      `Kenneth Adams\nEngineering Manager; Agile Leader - Agile Coach, Scrum Master, CSP, CSM, SAFe Expert; Program\nManager at Apple, IBM & more...\nken@example.com | Las Vegas Metropolitan Area\n\nExperience\nEngineer at Acme Corp (2020 – 2021)`
    )
    expect(wrapped.contact.title).toBe(headline)
    expect(wrapped.experience.map((e) => e.role)).toEqual(['Engineer'])
    // "Ivanti, San Francisco Bay Area" — the region is the location, the company stays whole
    const region = cv(`Experience\nProgram Manager · Ivanti, San Francisco Bay Area\n2016 – 2018\n- Scaled the program.`)
    expect(region.experience[0]).toMatchObject({ role: 'Program Manager', company: 'Ivanti', location: 'San Francisco Bay Area' })
  })

  it('a header our PDF export wrapped inside its location, then a lone year, rejoin', () => {
    const r = cv(`Experience
Cloud Engineering, Global Program Manager, Agile Transformation & Coaching · Ivanti, San Francisco Bay
Area
2016 – 2018
- Scaled the cloud program from 10 to 24 teams.
Agile Program Manager, Agile Coach, Senior Scrum Master · Pacific Gas and Electric Company, San Francisco
Bay Area
2014
- Coached three programs.`)
    expect(r.experience).toMatchObject([
      {
        role: 'Cloud Engineering, Global Program Manager, Agile Transformation & Coaching',
        company: 'Ivanti',
        location: 'San Francisco Bay Area',
        startDate: '2016',
        endDate: '2018',
        bullets: ['Scaled the cloud program from 10 to 24 teams.'],
      },
      {
        role: 'Agile Program Manager, Agile Coach, Senior Scrum Master',
        company: 'Pacific Gas and Electric Company',
        location: 'San Francisco Bay Area',
        startDate: '2014',
        endDate: '2014',
        bullets: ['Coached three programs.'],
      },
    ])
  })

  it('a LinkedIn-shaped resume survives our TXT / MD exports; a school-only entry comes back as its name', () => {
    const src = sampleResume()
    src.contact = {
      ...src.contact,
      fullName: 'Kenneth Adams',
      title: 'Engineering Manager; Agile Leader - Agile Coach, Scrum Master, CSP, CSM, SAFe Expert; Program Manager at Apple, IBM & more...',
      phone: '',
      location: 'Las Vegas Metropolitan Area',
    }
    src.experience = [
      { ...src.experience[0], role: 'Engineering Team Leader, Senior Scrum Master', company: 'AT&T', location: '', startDate: '2023', endDate: '2023' },
      { ...src.experience[1], role: 'About Recommendations', company: 'Recommendations', location: '', startDate: '2020', endDate: '2021', bullets: ['Recommendations from clients and colleagues.'] },
      { ...src.experience[0], id: 'x3', role: 'Cloud Engineering, Global Program Manager', company: 'Ivanti', location: 'San Francisco Bay Area', startDate: '2016', endDate: '2018' },
    ]
    src.education = [
      { ...emptyEducation(), id: 'e1', degree: '', school: 'Certified Scrum Professional (CSP)', startDate: '2014', endDate: '2014' },
      { ...emptyEducation(), id: 'e2', degree: 'Engineering', school: 'Software & Systems Engineering Certifications' },
    ]
    src.customSections = [{ id: 'c1', title: 'Publications', bullets: ['Agile at Scale (2019)'] }]
    const pick = (r: Resume) => ({
      contact: r.contact,
      summary: r.summary,
      skills: r.skills,
      experience: r.experience.map(({ role, company, location, startDate, endDate, bullets }) => ({ role, company, location, startDate, endDate, bullets })),
    })
    for (const [name, text] of [
      ['txt', resumeToPlainText(src, { keepLinkUrls: true })],
      ['md', resumeToMarkdown(src)],
    ] as const) {
      const back = parseResumeText(text)
      expect(pick(back), name).toEqual(pick(src))
      // a blank degree prints the school alone (R771); the lone name reads back as the degree
      expect(back.education.map((e) => [e.degree || e.school, e.startDate, e.endDate]), name).toEqual([
        ['Certified Scrum Professional (CSP)', '2014', '2014'],
        ['Engineering', '', ''],
      ])
      expect(back.education[1].school, name).toBe('Software & Systems Engineering Certifications')
      // TXT prints custom section titles in capitals; the bullets round-trip either way
      expect(back.customSections.map((c) => [c.title.toLowerCase(), c.bullets]), name).toEqual([['publications', ['Agile at Scale (2019)']]])
    }
  })
})

describe('every heading the product prints is a heading to the importer (R789)', () => {
  const withEverySection = (language?: Resume['language']): Resume => {
    const r = sampleResume()
    if (language) r.language = language
    r.involvement = [{ id: 'i1', role: 'Mentor', organization: 'Women Who Code Austin', location: 'Austin, TX', startDate: 'Jan 2022', endDate: 'Present', description: 'Mentored 12 early-career engineers.' }]
    r.coursework = [{ id: 'k1', name: 'Distributed Systems', institution: 'University of Texas at Austin', date: '2020', skill: '', description: '' }]
    r.awards = [{ id: 'a1', name: "Dean's List", organization: 'University of Texas at Austin', date: '2019', description: 'Top 5% of the class.' }]
    r.publications = [{ id: 'p1', title: 'Streaming resume parsing at the edge', venue: 'JSConf', kind: 'Talk', date: '2024', description: '' }]
    r.military = [{ id: 'm1', branch: 'US Army', rank: 'Sergeant', location: 'Fort Hood, TX', startDate: '2010', endDate: '2014', description: 'Led a 12-person logistics team.' }]
    return r
  }
  const shape = (r: Resume) => ({
    summary: r.summary,
    skills: r.skills,
    experience: r.experience.map((x) => [x.role, x.company]),
    education: r.education.map((e) => [e.degree, e.school]),
    customTitles: r.customSections.map((c) => c.title),
  })

  it('TXT (capitals) and Markdown (title case) exports of every section, in all five languages, read back as their sections', () => {
    for (const lang of ['en', 'es', 'fr', 'de', 'pt'] as const) {
      const src = withEverySection(lang === 'en' ? undefined : lang)
      // R797: the sections read back into their own fields, so no custom section is left
      const want = { ...shape(src), customTitles: [] }
      for (const [name, text] of [
        ['txt', resumeToPlainText(src, { keepLinkUrls: true })],
        ['md', resumeToMarkdown(src)],
      ] as const) {
        const back = parseResumeText(text)
        expect(shape(back), `${lang} ${name}`).toEqual(want)
        // the section content is kept in its fields, not read as a role or a school
        expect(ownSections(back), `${lang} ${name}`).toEqual(ownSections(src))
      }
    }
  })

  it('a title-case heading with no English section word ("Involvement", "Military service") opens its section instead of becoming a role or a school', () => {
    const r = cv(`
Experience
Software Engineer — Brightlane, Austin, TX (Jun 2023 – Present)
- Led the checkout migration.
Involvement
Mentor · Women Who Code Austin (Jan 2022 – Present)
- Mentored 12 engineers.
Education
B.S. Computer Science, University of Texas at Austin (2017 – 2021)
Coursework
Distributed Systems — University of Texas at Austin (2020)
Military service
Sergeant — US Army (2010 – 2014)
`)
    expect(r.experience.map((x) => x.role)).toEqual(['Software Engineer'])
    expect(r.education.map((e) => e.degree)).toEqual(['B.S. Computer Science'])
    expect(r.customSections).toEqual([])
    expect(r.involvement).toMatchObject([{ role: 'Mentor', organization: 'Women Who Code Austin', startDate: 'Jan 2022', endDate: 'Present', description: 'Mentored 12 engineers.' }])
    expect(r.coursework).toMatchObject([{ name: 'Distributed Systems', institution: 'University of Texas at Austin', date: '2020' }])
    expect(r.military).toMatchObject([{ rank: 'Sergeant', branch: 'US Army', startDate: '2010', endDate: '2014' }])
  })

  it('a localized core heading opens its section as a gutter label, an inline label and a letter-spaced heading', () => {
    const gutter = cv(`RESUMEN Ingeniera de software con ocho años de experiencia.
EXPERIENCIA Ingeniera Senior · Northstar Digital, Madrid (Jan 2022 – Present)
- Lideró la migración.
EDUCACIÓN Grado en Informática, Universidad de Madrid (2014 – 2018)
HABILIDADES TypeScript, React
`)
    expect(gutter.summary).toBe('Ingeniera de software con ocho años de experiencia.')
    expect(gutter.experience.map((x) => [x.role, x.company])).toEqual([['Ingeniera Senior', 'Northstar Digital']])
    expect(gutter.education.map((e) => [e.degree, e.school])).toEqual([['Grado en Informática', 'Universidad de Madrid']])
    expect(gutter.skills).toBe('TypeScript, React')

    const inline = cv(`Berufserfahrung\nEntwicklerin · Acme GmbH (2020 – Present)\nKenntnisse: TypeScript, React\n`)
    expect(inline.experience.map((x) => x.role)).toEqual(['Entwicklerin'])
    expect(inline.skills).toBe('TypeScript, React')

    const spaced = cv(`E X P E R I E N C I A\nIngeniera · Acme (2020 – Present)\nS E R V I C I O M I L I T A R\nSargento — Ejército (2010 – 2014)\n`)
    expect(spaced.experience.map((x) => x.role)).toEqual(['Ingeniera'])
    expect(spaced.customSections).toEqual([])
    expect(spaced.military).toMatchObject([{ rank: 'Sargento', branch: 'Ejército', startDate: '2010', endDate: '2014' }])
  })

  it('the label has to be the whole line — an entry header or a bullet that contains a label word is still content', () => {
    const r = cv(`Experience
Engagement Manager · Acme Corp (2020 – Present)
- Ran the engagement for the Cursos account.
- Publications review for the Kurse team.
`)
    expect(r.experience.map((x) => [x.role, x.company, x.bullets.length])).toEqual([['Engagement Manager', 'Acme Corp', 2]])
    expect(r.customSections).toEqual([])
  })
})

describe('dates written in the product languages (R791)', () => {
  it.each([
    ['es', 'ago. 2023', 'Actualidad', 'ene. 2021', 'abr. 2023'],
    ['fr', 'août 2023', "Aujourd'hui", 'févr. 2021', 'déc. 2022'],
    ['de', 'Aug. 2023', 'Heute', 'März 2021', 'Okt. 2022'],
    ['pt', 'set. 2023', 'Atual', 'fev. 2021', 'out. 2022'],
  ] as const)('%s: our own export with dates typed in the language re-imports both roles with their dates', (language, s1, e1, s2, e2) => {
    const src = { ...sampleResume(), language }
    Object.assign(src.experience[0], { startDate: s1, endDate: e1 })
    Object.assign(src.experience[1], { startDate: s2, endDate: e2 })
    for (const text of [resumeToPlainText(src, { keepLinkUrls: true }), resumeToMarkdown(src)]) {
      const r = parseResumeText(text)
      expect(r.experience.map((e) => [e.role, e.company, e.location, e.startDate, e.endDate])).toEqual(
        src.experience.map((e) => [e.role, e.company, e.location, e.startDate, e.endDate])
      )
    }
  })

  it('full month names, "to" ranges, a single dated one-off and a bare month line read in Spanish, French, German and Portuguese', () => {
    const r = cv(`EXPERIENCE
Ingeniera · Acme
enero 2020 – actualidad
• Shipped
Développeuse · Beta (juillet 2018 to décembre 2019)
• Shipped
Skin Bliss, Micro-Intern (1 week); Dez. 2023
• Ran the launch
Consultora · Gamma
setembro 2017
• Advised
`)
    expect(r.experience.map((e) => [e.startDate, e.endDate])).toEqual([
      ['enero 2020', 'actualidad'],
      ['juillet 2018', 'décembre 2019'],
      ['Dez. 2023', 'Dez. 2023'],
      ['setembro 2017', 'setembro 2017'],
    ])
  })

  it('a month word inside a bullet or a header is not a date', () => {
    const r = cv(`EXPERIENCE
Analista de Mercado · Acme (2019 – 2021)
• Presupuesto de agosto cerrado con 20% de ahorro
• Informe "Mai 2020" entregado a dirección
`)
    expect(r.experience).toMatchObject([{ role: 'Analista de Mercado', company: 'Acme', startDate: '2019', endDate: '2021' }])
    expect(r.experience[0].bullets).toHaveLength(2)
  })
})

describe('a "Role · Company, Location" header wrapped around its binder rejoins (R792)', () => {
  it('both wrap shapes our Sidebar export produces read as one header each; the year and the bullets stay with their entry', () => {
    const r = cv(`EXPERIENCE
Engineering Team Leader, Senior Scrum Master, Agile Transformation &
Coaching · AT&T
2023
• Led the agile transformation of three product lines.
Cloud Engineering, Global Program Manager, Agile Transformation & Coaching ·
Ivanti, San Francisco Bay Area
2016 – 2018
• Ran the cloud migration programme.
`)
    expect(r.experience.map(({ role, company, location, startDate, endDate, bullets }) => ({ role, company, location, startDate, endDate, bullets }))).toEqual([
      {
        role: 'Engineering Team Leader, Senior Scrum Master, Agile Transformation & Coaching',
        company: 'AT&T',
        location: '',
        startDate: '2023',
        endDate: '2023',
        bullets: ['Led the agile transformation of three product lines.'],
      },
      {
        role: 'Cloud Engineering, Global Program Manager, Agile Transformation & Coaching',
        company: 'Ivanti',
        location: 'San Francisco Bay Area',
        startDate: '2016',
        endDate: '2018',
        bullets: ['Ran the cloud migration programme.'],
      },
    ])
  })

  it('a bullet ending mid-phrase, a sentence, or a header followed by a bare date line are not rejoined', () => {
    const r = cv(`EXPERIENCE
Senior Engineer · Acme Corp
2019 – 2021
• Owned the payments platform, the checkout &
the ledger service
Shipped the redesign of the billing pages.
Staff Engineer · Beta Ltd
2021 – Present
• Built the platform team.
`)
    expect(r.experience.map(({ role, company, startDate, endDate, bullets }) => ({ role, company, startDate, endDate, bullets }))).toEqual([
      {
        role: 'Senior Engineer',
        company: 'Acme Corp',
        startDate: '2019',
        endDate: '2021',
        bullets: ['Owned the payments platform, the checkout & the ledger service', 'Shipped the redesign of the billing pages.'],
      },
      { role: 'Staff Engineer', company: 'Beta Ltd', startDate: '2021', endDate: 'Present', bullets: ['Built the platform team.'] },
    ])
  })
})

describe('the company-info line under an entry header is companyInfo, not a new entry (R794)', () => {
  const pick = (r: Resume) =>
    r.experience.map(({ role, company, location, startDate, endDate, companyInfo, bullets }) => ({
      role,
      company,
      location,
      startDate,
      endDate,
      companyInfo: companyInfo ?? '',
      bullets,
    }))

  it('our own TXT and Markdown exports re-import the line as companyInfo on every entry, bullets or not', () => {
    const src = sampleResume()
    src.experience = [
      { ...src.experience[0], companyInfo: 'Series B fintech, ~200 people, B2B payments' },
      { ...src.experience[1], companyInfo: 'Fortune 500 retailer with 12,000 employees' },
      { ...src.experience[0], id: 'x3', role: 'Intern', company: 'Verdant Labs', startDate: 'Jun 2020', endDate: 'Aug 2020', companyInfo: 'Early-stage climate startup (YC W21)', bullets: [] },
    ]
    for (const [name, text] of [
      ['txt', resumeToPlainText(src, { keepLinkUrls: true })],
      ['md', resumeToMarkdown(src)],
    ] as const) {
      expect(pick(parseResumeText(text)), name).toEqual(pick(src))
    }
  })

  it('a marker-less bullet list, an action-verb line and an undated next header stay what they are', () => {
    // Canva-shaped export: no bullet glyphs, no terminal punctuation
    const canva = cv(`EXPERIENCE
Operations Manager · Arowwai Industries
Oct 2020 – Present
Collaborate with top management to develop and implement strategic plans
Identify opportunities for process optimization and implement changes
Business Development Manager · Hanover and Tyke
Nov 2018 – Sept 2020
Conducted market research to identify potential business opportunities
`)
    expect(pick(canva).map((e) => [e.role, e.companyInfo, e.bullets.length])).toEqual([
      ['Operations Manager', '', 2],
      ['Business Development Manager', '', 1],
    ])
    // a single marker-less past-tense line followed by the next header
    const verb = cv(`EXPERIENCE
Barista · Giggling Platypus Co.
July 2020 – Jan 2022
Educated customers about different coffee beans, flavor profiles, and brewing methods
Software Engineer · Brightlane
Jun 2023 – Present
- Shipped the checkout redesign.
`)
    expect(pick(verb).map((e) => [e.role, e.companyInfo, e.bullets])).toEqual([
      ['Barista', '', ['Educated customers about different coffee beans, flavor profiles, and brewing methods']],
      ['Software Engineer', '', ['Shipped the checkout redesign.']],
    ])
    // an undated "Role at Company" header right after a bullet-less dated entry
    const header = cv(`EXPERIENCE
Software Engineer at Brightlane (Jun 2023 – Present)
Junior developer at Nova Retail
- Built the loyalty microsite.
`)
    expect(pick(header).map((e) => [e.role, e.company, e.companyInfo])).toEqual([
      ['Software Engineer', 'Brightlane', ''],
      ['Junior developer', 'Nova Retail', ''],
    ])
    // a location line under the header is still the location
    const place = cv(`EXPERIENCE
Software Engineer · Brightlane
Jun 2023 – Present
Austin, TX
- Built the loyalty microsite.
`)
    expect(pick(place)[0]).toMatchObject({ location: 'Austin, TX', companyInfo: '' })
  })
})

describe('content-replacing import keeps the editor design', () => {
  const styled = (): Resume => ({
    ...sampleResume(),
    templateId: 'modern',
    accentColor: '#0f766e',
    pageSize: 'a4',
    fontScale: 's',
    lineSpacing: 'compact',
    fontFamily: 'serif',
    sectionSpacing: 'tight',
    pageMargins: 'narrow',
    sectionDivider: 'on',
    bulletIndent: 'on',
    contactIcons: 'on',
    groupByCompany: 'on',
    textColor: 'navy',
    sectionHeadings: { experience: 'Work History' },
    autoSortByDate: ['experience'],
    targetRole: 'Staff Engineer',
    jobDescription: 'Ship things',
  })

  it('R795: the parsed text carries the replaced resume\'s template, colours, paper and typography', () => {
    const prev = styled()
    const parsed = parseResumeText(resumeToPlainText(prev))
    // the file itself cannot say which template it came from
    expect(parsed.templateId).toBe('classic')
    expect(parsed.pageSize).toBe('letter')
    const back = keepDesignOnImport(prev, keepTargetOnImport(prev, parsed))
    const design = ({
      templateId, accentColor, pageSize, fontScale, lineSpacing, fontFamily, sectionSpacing,
      pageMargins, sectionDivider, bulletIndent, contactIcons, groupByCompany, textColor,
      sectionHeadings, autoSortByDate,
    }: Resume) => ({
      templateId, accentColor, pageSize, fontScale, lineSpacing, fontFamily, sectionSpacing,
      pageMargins, sectionDivider, bulletIndent, contactIcons, groupByCompany, textColor,
      sectionHeadings, autoSortByDate,
    })
    expect(design(back)).toEqual(design(prev))
    expect(back.targetRole).toBe('Staff Engineer')
    expect(back.jobDescription).toBe('Ship things')
    // content still comes from the file, not from the replaced resume
    expect(back.experience.map((e) => e.role)).toEqual(prev.experience.map((e) => e.role))
    expect(back.sectionOrder).toEqual(parsed.sectionOrder)
    expect(back.hiddenContact).toEqual(parsed.hiddenContact)
    expect(back.contact).toEqual(parsed.contact)
  })

  it('R795: a resume with editor defaults hands the import editor defaults, not undefined', () => {
    const prev = sampleResume()
    const back = keepDesignOnImport(prev, parseResumeText('Jane Doe\njane@example.com\nSummary\nHello world'))
    expect(back.templateId).toBe(prev.templateId)
    expect(back.accentColor).toBe(prev.accentColor)
    expect(back.pageSize).toBe(prev.pageSize)
    expect(back.summary).toBe('Hello world')
  })
})

describe('re-import of an export whose headings the user renamed in the Builder (R796)', () => {
  const base = sampleResume()
  const renamed = {
    ...base,
    sectionHeadings: {
      ...base.sectionHeadings,
      experience: 'Where I have worked',
      education: 'Academic Background',
      skills: 'Tools & Technologies',
      projects: 'Things I built',
    },
  }
  const content = (r: Resume) => ({
    summary: r.summary,
    experience: r.experience.map((e) => [e.role, e.company, e.bullets]),
    education: r.education.map((e) => [e.school, e.degree]),
    skills: r.skills,
    projects: r.projects.map((p) => p.name),
    custom: r.customSections.map((s) => s.title),
  })
  const expected = content(parseResumeText(resumeToPlainText(base, { keepLinkUrls: true })))

  it.each([
    ['TXT', resumeToPlainText(renamed, { keepLinkUrls: true })],
    ['MD', resumeToMarkdown(renamed)],
  ])('%s: with the reader\'s headings the export reads back into the same sections', (_fmt, text) => {
    const blind = parseResumeText(text)
    // without the hint the arbitrary headings are not section headings and the roles are lost
    expect(blind.experience.length).toBeLessThan(base.experience.length)
    expect(content(blind)).not.toEqual(expected)
    const hinted = parseResumeText(text, { sectionHeadings: renamed.sectionHeadings })
    expect(content(hinted)).toEqual(expected)
  })

  it('the hint changes nothing for an export with default headings and does not leak into the next parse', () => {
    const txt = resumeToPlainText(base, { keepLinkUrls: true })
    expect(content(parseResumeText(txt, { sectionHeadings: renamed.sectionHeadings }))).toEqual(expected)
    const arbitrary = resumeToPlainText(renamed, { keepLinkUrls: true })
    parseResumeText(arbitrary, { sectionHeadings: renamed.sectionHeadings })
    expect(parseResumeText(arbitrary).experience.length).toBeLessThan(base.experience.length)
  })

  it('a renamed custom-key heading keeps the user\'s title; a label only matches a whole heading line', () => {
    const txt =
      'Jane Doe\njane@example.com\n\nWhere I have worked\nEngineer · Acme Corp\nJan 2020 – Dec 2021\n- Built the Toolbox pipeline for 3 teams\n\nMy Volunteering\n- Mentor at Code Club\n\nToolbox\nTypeScript, React'
    const r = parseResumeText(txt, {
      sectionHeadings: { experience: 'Where I have worked', skills: 'Toolbox', involvement: 'My Volunteering' },
    })
    expect(r.experience.map((e) => [e.role, e.company, e.bullets])).toEqual([
      ['Engineer', 'Acme Corp', ['Built the Toolbox pipeline for 3 teams']],
    ])
    expect(r.skills).toBe('TypeScript, React')
    expect(r.customSections.map((s) => [s.title, s.bullets])).toEqual([['My Volunteering', ['Mentor at Code Club']]])
  })
})

describe('our own structured sections read back into their fields (R797)', () => {
  it('TXT and Markdown exports re-import involvement, coursework, certifications, awards, publications, references and military service field for field', () => {
    const src = withOwnSections(sampleResume())
    for (const [name, text] of [
      ['txt', resumeToPlainText(src, { keepLinkUrls: true })],
      ['md', resumeToMarkdown(src)],
    ] as const) {
      const back = parseResumeText(text)
      expect(ownSections(back), name).toEqual(ownSections(src))
      expect(back.certifications, name).toBe('')
      expect(back.customSections, name).toEqual([])
    }
  })

  it('entries without a date or a binder are left as they were: a plain list under our heading stays a custom section, a flat certification line stays text', () => {
    const list = cv(`SUMMARY
Engineer.
PUBLICATIONS
- Smith, J. (2021). Edge parsing. Journal of Web Systems.
- Smith, J. (2019). Streaming imports. WebConf.
`)
    expect(list.publications ?? []).toEqual([])
    expect(list.customSections).toMatchObject([{ title: 'Publications', bullets: [expect.stringContaining('Edge parsing'), expect.stringContaining('Streaming imports')] }])

    const names = cv(`SUMMARY
Engineer.
INVOLVEMENT
Biology Club–Secretary
Coordinated weekly tutoring sessions for 30 students
`)
    expect(names.involvement ?? []).toEqual([])
    expect(names.customSections).toMatchObject([{ title: 'Involvement', bullets: ['Biology Club–Secretary', 'Coordinated weekly tutoring sessions for 30 students'] }])

    const flat = cv(`SUMMARY
Engineer.
CERTIFICATIONS
AWS Certified Developer, Google Cloud Professional Architect
`)
    expect(flat.certItems ?? []).toEqual([])
    expect(flat.certifications).toBe('AWS Certified Developer, Google Cloud Professional Architect')

    const bullets = cv(`SUMMARY
Engineer.
CERTIFICATIONS
- AWS Certified Developer (2020)
- PMP
`)
    expect(bullets.certItems ?? []).toEqual([])
    expect(bullets.certifications).toBe('- AWS Certified Developer (2020); - PMP')
  })

  it('a section whose entries mix our shape with a plain line is not half-lifted', () => {
    const r = cv(`SUMMARY
Engineer.
AWARDS & HONORS
Dean's List — University of Texas at Austin (2019)
- Top 5% of the class.
Employee of the month
`)
    expect(r.awards ?? []).toEqual([])
    expect(r.customSections).toMatchObject([{ title: 'Awards & Honors' }])
    expect(r.customSections[0].bullets).toHaveLength(3)
  })

  it('a PDF-shaped section (date on its own line, plain certification description, reference contact row) reads the same as the TXT shape', () => {
    const r = cv(`SUMMARY
Engineer.
CERTIFICATIONS
AWS Solutions Architect – Associate — Amazon Web Services
2023
Designed the multi-region failover for Northstar.
REFERENCES
Dana Whitfield — VP Engineering, Northstar Digital
dana@northstar.example · +1 512 555 0100 · Professional reference
MILITARY SERVICE
Sergeant · US Army, Fort Hood, TX
2010 – 2014
• Led a 12-person logistics team.
`)
    const src = withOwnSections(sampleResume())
    const want = ownSections(src) as Record<string, unknown>
    const got = ownSections(r) as Record<string, unknown>
    for (const k of ['certItems', 'references', 'military']) expect(got[k], k).toEqual(want[k])
    expect(r.customSections).toEqual([])
  })
})

describe('the section order an export prints survives re-import (R799)', () => {
  const byTitle = (r: Resume) =>
    orderedSectionKeys(r).map((k) =>
      k.startsWith('custom:') ? `custom:${(r.customSections.find((s) => `custom:${s.id}` === k)?.title ?? '?').toLowerCase()}` : k
    )
  const src = reorderedOwnSections(sampleResume())

  it.each([
    ['TXT', resumeToPlainText(src, { keepLinkUrls: true })],
    ['MD', resumeToMarkdown(src)],
  ])('%s: a skills-first export with a custom section before Involvement and a late Summary reads back in print order, lifted sections included', (_fmt, text) => {
    const back = parseResumeText(text)
    expect(printedOrder(back)).toEqual(PRINTED_ORDER)
    expect(ownSections(back)).toEqual(ownSections(src))
    expect(back.customSections.map((s) => s.title.toLowerCase())).toEqual(['volunteering'])
  })

  it('renamed headings (R796 hint) keep their document position too', () => {
    const renamed = { ...src, sectionHeadings: { ...src.sectionHeadings, skills: 'Tools & Technologies', experience: 'Where I have worked' } }
    const back = parseResumeText(resumeToPlainText(renamed, { keepLinkUrls: true }), { sectionHeadings: renamed.sectionHeadings })
    expect(printedOrder(back)).toEqual(PRINTED_ORDER)
  })

  it('an education-first resume with an inline skills label and a custom section keeps that order; absent sections follow their canonical neighbour', () => {
    const r = cv(`EDUCATION
BSc Computer Science · State University
2013 – 2017
Technical Skills: Java, SQL, Python
VOLUNTEER EXPERIENCE
- Coached a youth robotics team.
EXPERIENCE
Engineer · Acme Corp
Jan 2020 – Present
- Shipped things.
`)
    expect(byTitle(r)).toEqual([
      'summary',
      'education',
      'coursework',
      'skills',
      'certifications',
      'awards',
      'publications',
      'references',
      'military',
      'agents',
      'custom:volunteer experience',
      'experience',
      'projects',
      'involvement',
    ])
  })

  it('a resume with no recognised heading keeps the default order', () => {
    const r = cv(`Engineer · Acme Corp
Jan 2020 – Present
- Shipped things.
`)
    expect(r.sectionOrder).toEqual(emptyResume().sectionOrder)
    expect(cv('Just a paragraph about me.').sectionOrder).toEqual(emptyResume().sectionOrder)
  })
})

describe('a custom heading a template printed in capitals is stored in title case (R800)', () => {
  const src = sampleResume()
  src.customSections = [
    { id: 'cs1', title: 'Volunteering', bullets: ['Food bank shift lead, 2021–present'] },
    { id: 'cs2', title: 'UX Research Work', bullets: ['Diary study, 12 participants'] },
    { id: 'cs3', title: 'Speaking Engagements', bullets: ['ReactConf 2024 lightning talk'] },
  ]
  src.sectionOrder = [...src.sectionOrder.filter((k) => !k.startsWith('custom:')), 'custom:cs1', 'custom:cs2', 'custom:cs3']

  it.each([
    ['TXT', resumeToPlainText(src, { keepLinkUrls: true })],
    ['MD', resumeToMarkdown(src)],
  ])('%s: our own export reads its custom titles back as the user wrote them', (_fmt, text) => {
    const back = parseResumeText(text)
    expect(back.customSections.map((s) => s.title)).toEqual(['Volunteering', 'UX Research Work', 'Speaking Engagements'])
    expect(back.customSections.map((s) => s.bullets)).toEqual(src.customSections.map((s) => s.bullets))
    expect(back.sectionOrder.filter((k) => k.startsWith('custom:'))).toEqual(back.customSections.map((s) => `custom:${s.id}`))
  })

  it('a Markdown `##` heading is a heading whatever its case; `###` entry headers and bullets are not', () => {
    const r = cv(`## Experience
### Engineer — Acme Corp, Austin, TX *(Jan 2020 – Present)*
- Shipped the platform
## Pro Bono Work
- Legal aid clinic
`)
    expect(r.experience).toMatchObject([{ role: 'Engineer', company: 'Acme Corp', bullets: ['Shipped the platform'] }])
    expect(r.customSections).toMatchObject([{ title: 'Pro Bono Work', bullets: ['Legal aid clinic'] }])
  })

  it('headingCase: small words, acronyms, separators and mixed case', () => {
    expect(headingCase('VOLUNTEERING')).toBe('Volunteering')
    expect(headingCase('LEADERSHIP AND INVOLVEMENT')).toBe('Leadership and Involvement')
    expect(headingCase('AWARDS/HONORS')).toBe('Awards/Honors')
    expect(headingCase('IT CERTIFICATIONS AND TRAINING')).toBe('IT Certifications and Training')
    expect(headingCase('UX & PRODUCT WORK')).toBe('UX & Product Work')
    expect(headingCase('SQL TRAINING')).toBe('SQL Training')
    expect(headingCase('OF NOTE')).toBe('Of Note')
    expect(headingCase('Pro Bono Work')).toBe('Pro Bono Work')
    expect(headingCase('iOS Apps')).toBe('iOS Apps')
    expect(headingCase('AWS')).toBe('AWS')
  })

  it('an ALL-CAPS heading in someone else\'s document is title-cased too', () => {
    const r = cv(`EXPERIENCE
Engineer · Acme Corp
Jan 2020 – Present
- Shipped the platform
EXTRACURRICULAR ACTIVITIES
- Debate club captain
`)
    expect(r.customSections).toMatchObject([{ title: 'Extracurricular Activities', bullets: ['Debate club captain'] }])
  })

  it('an "&" in a short ALL-CAPS heading does not count as a word', () => {
    const r = cv(`EXPERIENCE
Engineer · Acme Corp
Jan 2020 – Present
- Shipped the platform
LEADERSHIP AND INVOLVEMENT
- Debate club captain
UX & PRODUCT WORK
- Diary study, 12 participants
`)
    expect(r.customSections).toMatchObject([
      { title: 'Leadership and Involvement', bullets: ['Debate club captain'] },
      { title: 'UX & Product Work', bullets: ['Diary study, 12 participants'] },
    ])
  })

  it('a heading whose spaces the extractor dropped recovers the space before a known last word', () => {
    const r = cv(`EXPERIENCE
Engineer · Acme Corp
Jan 2020 – Present
- Shipped the platform
TECHNICALWRITING
- API reference for the SDK
`)
    expect(r.customSections.map((s) => s.title)).toEqual(['Technical Writing'])
  })

  it('a letter-spaced heading recovers the space before a known last word', () => {
    const r = cv(`EXPERIENCE
Engineer · Acme Corp
Jan 2020 – Present
- Shipped the platform
T E C H N I C A L W R I T I N G
- API reference for the SDK
`)
    expect(r.customSections.map((s) => s.title)).toEqual(['Technical Writing'])
  })
})
