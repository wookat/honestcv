import { buildCoverLetterMessages, buildResignationLetterMessages } from '../worker/prompts'

let fail = 0
const check = (name: string, ok: boolean) => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`)
  if (!ok) fail++
}

const baseCover = JSON.stringify(buildCoverLetterMessages('resume', 'jd', 'Acme', 'Engineer', 'Maya', 'led x'))
const noToneCover = JSON.stringify(
  buildCoverLetterMessages('resume', 'jd', 'Acme', 'Engineer', 'Maya', 'led x', undefined)
)
check('cover: undefined tone is byte-identical', baseCover === noToneCover)
const formalCover = buildCoverLetterMessages('resume', 'jd', 'Acme', 'Engineer', '', '', 'formal')
check('cover: formal adds register sentence', formalCover[0].content.includes('strictly formal and businesslike'))
const friendlyCover = buildCoverLetterMessages('resume', 'jd', 'Acme', 'Engineer', '', '', 'friendly')
check('cover: friendly adds register sentence', friendlyCover[0].content.includes('warm and personable'))
check(
  'cover: user message unchanged by tone',
  formalCover[1].content === buildCoverLetterMessages('resume', 'jd', 'Acme', 'Engineer')[1].content
)

const baseRes = JSON.stringify(buildResignationLetterMessages('Acme', 'Analyst', 'March 14', 'moving', 'Ed'))
const noToneRes = JSON.stringify(
  buildResignationLetterMessages('Acme', 'Analyst', 'March 14', 'moving', 'Ed', undefined)
)
check('resignation: undefined tone is byte-identical', baseRes === noToneRes)
const formalRes = buildResignationLetterMessages('Acme', 'Analyst', '', '', 'Ed', 'formal')
check('resignation: formal adds register sentence', formalRes[0].content.includes('strictly formal and businesslike'))
const friendlyRes = buildResignationLetterMessages('Acme', 'Analyst', '', '', 'Ed', 'friendly')
check('resignation: friendly adds register sentence', friendlyRes[0].content.includes('warm and personable'))
check(
  'resignation: user message unchanged by tone',
  formalRes[1].content === buildResignationLetterMessages('Acme', 'Analyst', '', '', 'Ed')[1].content
)

console.log(fail === 0 ? 'ALL PASS' : `${fail} FAILURES`)
process.exit(fail === 0 ? 0 : 1)
