/**
 * The vocabulary a resume heading uses to name a section, shared by the text
 * importer and the ATS text scorer so a heading one of them reads, the other
 * reads too ("Work History", "Core Competencies", "Education & Training").
 */

export type CoreSectionName =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'

// A heading-shaped line (short, ALL CAPS or Title Case, no prose punctuation)
// that names a section anywhere in it: "Work/Internship/Relevant Experience",
// "Areas of Expertise", "Education & Training". Table order decides a heading
// that names two sections ("Summary of Skills" → skills). Tested on the plain
// text and on a letter-spaced heading collapsed to one word.
export const SECTION_WORDS: [RegExp, CoreSectionName][] = [
  [/experience|employment|work\s?history|career\s?history/i, 'experience'],
  [/education/i, 'education'],
  [/skills?|competenc(?:y|ies)|expertise/i, 'skills'],
  [/projects?/i, 'projects'],
  [/certifications?|certificates|licen[cs]es/i, 'certifications'],
  [/summary|profile|objective|about\s?me/i, 'summary'],
]

// Common resume sections without a dedicated field — imported as custom sections
export const CUSTOM_HEADING_RE =
  /^(awards?|honors?|achievements?|publications?|volunteer(ing|\s+experience)?|languages?|interests?|hobbies|activities|leadership|references)\b/i

export const HEADING_WORD_RE = /^(?:[A-Z][A-Za-z&/'’-]*|&|\/|and|of|or|in|the)$/
// "Project Manager" / "Customer Experience Lead" are entry headers, not sections.
export const JOB_TITLE_NOUN_RE =
  /\b(manager|engineer|developer|analyst|director|lead|specialist|coordinator|assistant|consultant|intern|officer|head|designer|architect|administrator|trainer|teacher|nurse|technician|associate|representative|executive|founder|owner|president|vp|supervisor|advisor|adviser|counsel|accountant|scientist|researcher|writer|editor|recruiter|planner|strategist|agent|clerk|operator|driver|chef|cook|server|barista|cashier|volunteer|partner|fellow|professor|lecturer|instructor|tutor|mentor|ambassador|apprentice|trainee|waiter|waitress|receptionist|paralegal|secretary|treasurer|leader)\b/i
// One credential's name — "Graduate Project Management Certification",
// "Certificate in Project Management" — not the section that lists them.
export const CREDENTIAL_TITLE_RE =
  /^(?:\S+\s+){2,}(?:certification|certificate|licen[cs]e|diploma|course)$|^(?:certification|certificate|licen[cs]e|diploma|course)\s+(?:in|of)\s/i

export const looksLikeHeadingShape = (t: string) => {
  if (t.length > 48 || /[.,;:!?()\d]/.test(t)) return false
  const words = t.split(/\s+/)
  return words.length <= 6 && (t === t.toUpperCase() || words.every((w) => HEADING_WORD_RE.test(w)))
}

/** The core section a heading-shaped line names by one of its words, or null */
export function sectionNamedByHeading(t: string): CoreSectionName | null {
  if (JOB_TITLE_NOUN_RE.test(t) || CREDENTIAL_TITLE_RE.test(t)) return null
  if (CUSTOM_HEADING_RE.test(t) || !looksLikeHeadingShape(t)) return null
  for (const [re, name] of SECTION_WORDS) if (new RegExp(`\\b(?:${re.source})\\b`, 'i').test(t)) return name
  return null
}
