import { describe, expect, it } from 'vitest'
import { parseResumeText } from '../../src/lib/importText'
import { listFixtures, normalize, pdfText, readText } from './helpers'

/**
 * Golden replay of the import path over the template / synthetic corpus.
 * A failing case here is a *changed* parse, not necessarily a wrong one:
 * read the diff, then `npm test -- -u` once the new output is the one you want.
 */
describe('text fixtures → parseResumeText', () => {
  for (const name of listFixtures('text')) {
    it(name, async () => {
      const parsed = parseResumeText(readText(name))
      await expect(normalize(parsed)).toMatchFileSnapshot(`golden/text/${name}.json`)
    })
  }
})

describe('pdf fixtures → pdf.js text layer → parseResumeText', () => {
  for (const name of listFixtures('pdf')) {
    it(name, async () => {
      const { text, multiColumn } = await pdfText(name)
      await expect(text + '\n').toMatchFileSnapshot(`golden/pdf/${name}.txt`)
      await expect(normalize({ multiColumn, ...parseResumeText(text) })).toMatchFileSnapshot(
        `golden/pdf/${name}.json`
      )
    })
  }
})
