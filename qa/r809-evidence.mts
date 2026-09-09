// R809 evidence: editable preview separators whose right side is an empty span (no placeholder).
// Run: npx vite-node qa/r809-evidence.mts
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ResumePreview } from '@/components/ResumePreview'
import {
  emptyAward,
  emptyCertification,
  emptyCoursework,
  emptyExperience,
  emptyInvolvement,
  emptyMilitaryService,
  emptyPublication,
  emptyResume,
} from '@/lib/resume'

const r = emptyResume()
r.contact.fullName = 'Jane Doe'
r.experience = [{ ...emptyExperience(), role: 'Engineer' }]
r.involvement = [{ ...emptyInvolvement(), role: 'Volunteer' }]
r.coursework = [{ ...emptyCoursework(), name: 'Algorithms' }]
r.certItems = [{ ...emptyCertification(), name: 'AWS SAA' }]
r.awards = [{ ...emptyAward(), name: "Dean's List" }]
r.publications = [{ ...emptyPublication(), title: 'A paper' }]
r.military = [{ ...emptyMilitaryService(), rank: 'Sergeant' }]

for (const editable of [false, true]) {
  const html = renderToStaticMarkup(
    createElement(ResumePreview, { resume: r, onEdit: editable ? () => {} : undefined }),
  )
  const dangling = html.match(/(·|—)\s*<span[^>]*><\/span>/g) ?? []
  const text = html.replace(/<[^>]+>/g, '¦').replace(/¦+/g, '¦')
  console.log(editable ? 'EDITABLE' : 'READONLY', 'separator → empty span:', dangling.length)
  for (const w of ['Engineer', 'Volunteer', 'Algorithms', 'AWS SAA', "Dean's List", 'A paper', 'Sergeant']) {
    const i = text.indexOf(w)
    console.log('  ', JSON.stringify(text.slice(i, i + 36)))
  }
}
