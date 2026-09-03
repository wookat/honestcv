import { educationDetailLine, educationDetailSuffix } from '@/lib/resume'
import type { EducationItem } from '@/lib/resume'

const base: EducationItem = {
  id: 'e1',
  school: 'MIT',
  degree: 'BSc',
  location: '',
  startDate: '',
  endDate: '',
  details: '',
  minor: '',
  gpa: '',
}

const cases: Array<Partial<EducationItem>> = [
  { details: 'Dean’s list', minor: 'Math', gpa: '3.9' },
  { details: 'Dean’s list', minor: '', gpa: '3.9' },
  { details: 'Dean’s list', minor: 'Math', gpa: '' },
  { details: 'Dean’s list' },
  { details: '', minor: 'Math', gpa: '3.9' },
  { details: '  padded  ', minor: ' Math ', gpa: ' 3.9 ' },
  {},
]

let pass = 0
for (const c of cases) {
  const e = { ...base, ...c }
  const composed = e.details.trim()
    ? e.details.trim() + educationDetailSuffix(e)
    : educationDetailLine(e)
  const ok = composed === educationDetailLine(e)
  console.log(ok ? 'PASS' : 'FAIL', JSON.stringify(c), '->', JSON.stringify(composed))
  if (ok) pass++
}
console.log(`${pass}/${cases.length}`)
if (pass !== cases.length) process.exit(1)
