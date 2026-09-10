import { describe, expect, it } from 'vitest'
import {
  DATE_WORDS,
  ONGOING_RE,
  dateSortValue,
  experienceDateRange,
  monthIndexOf,
  resumeToMarkdown,
  resumeToPlainText,
  sampleResume,
} from '../src/lib/resume'

describe('dates in the product languages (R791)', () => {
  it('every month word the picker offers, and the full month names, map to their month — with or without the dot / accent', () => {
    for (const lang of ['en', 'es', 'fr', 'de', 'pt'] as const)
      DATE_WORDS[lang].months.forEach((m, i) => expect(monthIndexOf(m), `${lang} ${m}`).toBe(i + 1))
    expect(monthIndexOf('septiembre')).toBe(9)
    expect(monthIndexOf('setiembre')).toBe(9)
    expect(monthIndexOf('Marz')).toBe(3)
    expect(monthIndexOf('fevrier')).toBe(2)
    expect(monthIndexOf('Sept')).toBe(9)
    expect(monthIndexOf('Acme')).toBeNull()
  })

  it('dateSortValue orders localized month-year dates like English ones', () => {
    const aug2023 = dateSortValue('Aug 2023')
    for (const d of ['ago. 2023', 'août 2023', 'Aug. 2023', 'agosto 2023', 'August 2023']) expect(dateSortValue(d), d).toBe(aug2023)
    expect(dateSortValue('set. 2023')).toBe(dateSortValue('Sep 2023'))
    expect(dateSortValue('März 2021')).toBe(dateSortValue('Mar 2021'))
  })

  it('the ongoing word of every language is ongoing; a role that merely contains one is not', () => {
    for (const w of ['Present', 'Actualidad', 'actual', 'presente', "Aujourd'hui", 'aujourd’hui', 'Heute', 'aktuell', 'Atual', 'atualmente', 'à ce jour – actuel'])
      expect(ONGOING_RE.test(w), w).toBe(true)
    for (const w of ['Oct 2022', 'Presenter', 'Actualización', 'Heuteland', 'Atualizado', ''])
      expect(ONGOING_RE.test(w), w).toBe(false)
  })

  it('an ongoing role prints the ongoing word of the resume language in TXT and Markdown, English stays "Present"', () => {
    expect(experienceDateRange('Jun 2023', '')).toBe('Jun 2023 – Present')
    expect(experienceDateRange('jun. 2023', '', 'es')).toBe('jun. 2023 – Actualidad')
    expect(experienceDateRange('juin 2023', '', 'fr')).toBe("juin 2023 – Aujourd'hui")
    expect(experienceDateRange('Juni 2023', 'Heute', 'de')).toBe('Juni 2023 – Heute')
    for (const lang of ['es', 'fr', 'de', 'pt'] as const) {
      const r = { ...sampleResume(), language: lang }
      r.experience[0].endDate = ''
      const want = `${r.experience[0].startDate} – ${DATE_WORDS[lang].present}`
      expect(resumeToPlainText(r, { keepLinkUrls: true })).toContain(want)
      expect(resumeToMarkdown(r)).toContain(want)
      expect(resumeToPlainText(r, { keepLinkUrls: true })).not.toContain('Present')
    }
  })
})
