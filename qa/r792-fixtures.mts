// R792: write the R787 LinkedIn-shaped fixture as a Sidebar PDF (+ Modern control) and
// its extracted text for production QA; print the expected fields.
import { writeFileSync } from 'node:fs'
import { pdfTextOf } from '../tests/import/helpers'
import { buildResumePdf } from '../src/lib/pdf'
import { sampleResume, resumeToPlainText } from '../src/lib/resume'

const src = sampleResume()
src.contact = {
  ...src.contact,
  fullName: 'Kenneth Adams',
  title: 'Engineering Manager; Agile Leader - Agile Coach, Scrum Master, CSP, CSM, SAFe Expert; Program Manager at Apple, IBM & more...',
  phone: '',
  location: 'Las Vegas Metropolitan Area',
}
src.experience = [
  { ...src.experience[0], role: 'Engineering Team Leader, Senior Scrum Master, Agile Transformation & Coaching', company: 'AT&T', location: '', startDate: '2023', endDate: '2023' },
  { ...src.experience[1], role: 'About Recommendations', company: 'Recommendations', location: '', startDate: '2020', endDate: '2021', bullets: ['Recommendations from clients and colleagues.'] },
  { ...src.experience[0], id: 'x3', role: 'Cloud Engineering, Global Program Manager, Agile Transformation & Coaching', company: 'Ivanti', location: 'San Francisco Bay Area', startDate: '2016', endDate: '2018' },
]
for (const id of ['sidebar', 'modern']) {
  const bytes = await buildResumePdf({ ...src, templateId: id })
  writeFileSync(`/home/ubuntu/qa/r792/kenneth-${id}.pdf`, bytes)
  const { text } = await pdfTextOf(bytes)
  writeFileSync(`/home/ubuntu/qa/r792/kenneth-${id}.txt`, text)
}
writeFileSync('/home/ubuntu/qa/r792/kenneth-export.txt', resumeToPlainText(src))
writeFileSync('/home/ubuntu/qa/r792/expected.json', JSON.stringify({ contact: src.contact, summary: src.summary, experience: src.experience }, null, 1))
console.log('ok')
