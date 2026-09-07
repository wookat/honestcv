/**
 * Deterministic post-check for AI text that is supposed to be grounded in the
 * user's resume (interview brief, cover letter): names, tools and figures the
 * output states that appear in none of the source texts.
 *
 * Complements the prompt-level rules in worker/prompts.ts (R705) — the prompt
 * asks the model not to invent, this proves whether it did. It cannot judge
 * paraphrases or duties, only concrete tokens, so it never claims the rest is
 * verified.
 */

import { stemmer } from "stemmer";
import {
  indexResumeText,
  keywordHit,
  looksLikeSkill,
  type ResumeIndex,
} from "./ats";

/** Sentence-initial or structural words that are capitalised without naming anything */
const GENERIC_CAPS = new Set([
  "a",
  "an",
  "the",
  "i",
  "my",
  "me",
  "we",
  "you",
  "your",
  "they",
  "their",
  "it",
  "its",
  "this",
  "that",
  "these",
  "those",
  "and",
  "or",
  "but",
  "so",
  "if",
  "as",
  "at",
  "by",
  "for",
  "from",
  "in",
  "of",
  "on",
  "to",
  "with",
  "be",
  "is",
  "are",
  "was",
  "were",
  "has",
  "have",
  "had",
  "do",
  "does",
  "did",
  "can",
  "could",
  "will",
  "would",
  "should",
  "may",
  "might",
  "no",
  "not",
  "yes",
  "how",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "then",
  "there",
  "here",
  "after",
  "before",
  "while",
  "during",
  "since",
  "until",
  "once",
  "because",
  "although",
  "though",
  "however",
  "also",
  "both",
  "each",
  "every",
  "any",
  "all",
  "some",
  "most",
  "many",
  "much",
  "more",
  "less",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "first",
  "second",
  "third",
  "next",
  "last",
  "new",
  "own",
  "same",
  "other",
  "such",
  "very",
  "just",
  "only",
  "even",
  "still",
  "yet",
  "never",
  "always",
  "often",
  "usually",
  "ask",
  "tell",
  "describe",
  "explain",
  "walk",
  "give",
  "share",
  "talk",
  "discuss",
  "show",
  "lead",
  "led",
  "built",
  "build",
  "added",
  "add",
  "use",
  "used",
  "using",
  "gap",
  "gaps",
  "angle",
  "situation",
  "task",
  "action",
  "result",
  "results",
  "story",
  "stories",
  "question",
  "questions",
  "answer",
  "answers",
  "position",
  "summary",
  "experience",
  "skills",
  "education",
  "projects",
  "dear",
  "sincerely",
  "regards",
  "hiring",
  "manager",
  "present",
  "ongoing",
  "today",
  "currently",
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "sept",
  "oct",
  "nov",
  "dec",
  "january",
  "february",
  "march",
  "april",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
  "star",
  "jd",
  "s",
  "t",
  "r",
  "q",
]);

/** Words that start a capitalised run but are ordinary English when the rest of the run is too */
const TITLE_WORDS = new Set([
  "senior",
  "junior",
  "lead",
  "principal",
  "staff",
  "head",
  "chief",
  "engineer",
  "developer",
  "manager",
  "director",
  "analyst",
  "designer",
  "consultant",
  "specialist",
  "coordinator",
  "associate",
  "intern",
  "officer",
  "nurse",
  "teacher",
  "assistant",
  "architect",
  "scientist",
  "administrator",
  "technician",
  "representative",
  "executive",
  "partner",
  "founder",
  "owner",
  "president",
  "vice",
]);

const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ");

/** Alphanumeric key for loose containment: "GitHub Actions" ~ "github actions", "Node.js" ~ "nodejs" */
const key = (s: string) => normalise(s).replace(/[^a-z0-9]+/g, "");

const CAP_RUN_RE =
  /(?:^|[^A-Za-z0-9.+#@/])((?:[A-Z][A-Za-z0-9+#]*(?:\.[A-Za-z][A-Za-z0-9]*)*)(?:[ -][A-Z][A-Za-z0-9+#]*(?:\.[A-Za-z][A-Za-z0-9]*)*)*)/g;

/** Capitalised runs ("GitHub Actions", "Node.js", "AWS") minus the sentence-initial ordinary words */
function properRuns(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split("\n")) {
    if (/^[A-Z0-9 &'’/—–-]{4,}$/.test(line.trim())) continue; // heading in caps
    for (const m of line.matchAll(CAP_RUN_RE)) {
      const before = line.slice(0, m.index! + (m[0].length - m[1].length));
      const sentenceStart =
        /(^|[.!?:;"“”\u2014\u2013([]\s*|^\s*(?:\d+[.)]|[-•*]|[STAR]:)\s*)$/.test(
          before,
        ) || /^\s*$/.test(before);
      let words = m[1].split(/[ -]/);
      // Drop leading ordinary words when the run opens a sentence ("Six years", "Tell us", "Median page")
      if (sentenceStart) {
        while (
          words.length &&
          !/[0-9.+#]/.test(words[0]) &&
          words[0] !== words[0].toUpperCase() &&
          (GENERIC_CAPS.has(words[0].toLowerCase()) ||
            words.length === 1 ||
            TITLE_WORDS.has(words[0].toLowerCase()))
        ) {
          words = words.slice(1);
        }
      }
      // Drop generic capitalised words anywhere ("I", "Present", month names, STAR letters)
      words = words.filter((w) => !GENERIC_CAPS.has(w.toLowerCase()));
      if (!words.length) continue;
      const run = words.join(" ");
      if (run.length < 2) continue;
      if (words.every((w) => TITLE_WORDS.has(w.toLowerCase()))) continue;
      out.push(run);
    }
  }
  return out;
}

const NUMBER_RE =
  /(?<![A-Za-z0-9.])(\$?\d[\d,]*(?:\.\d+)?)(\s*(?:%|percent|k\b|m\b|x\b|ms\b|s\b|seconds?\b|minutes?\b|hours?\b|days?\b|weeks?\b|months?\b|years?\b)?)/gi;

/** Figures that read as evidence (percentages, money, decimals, 2+ digit counts) — not tenures, list numbers or durations */
function figures(text: string): string[] {
  const out: string[] = [];
  for (const rawLine of text.split("\n")) {
    const line = rawLine.replace(/^\s*\d+[.)]\s+/, ""); // list index
    for (const m of line.matchAll(NUMBER_RE)) {
      const num = m[1];
      const unit = m[2].trim().toLowerCase();
      if (/^(minutes?|hours?|days?|weeks?|months?|years?)$/.test(unit))
        continue;
      const bare = num.replace(/[$,]/g, "");
      const isDecimal = bare.includes(".");
      const val = Number(bare);
      if (
        !unit &&
        !isDecimal &&
        !num.startsWith("$") &&
        (Number.isNaN(val) || val < 10)
      )
        continue;
      if (/^(19|20)\d{2}$/.test(bare)) continue; // year
      out.push((num + (unit ? (unit === "%" ? "%" : " " + unit) : "")).trim());
    }
  }
  return out;
}

/**
 * Does any source contain the term — loose on case, punctuation and
 * "Node.js"/"NodeJS", and on the wording variants the ATS matcher accepts
 * (plural "UIs" for "UI", "E2E" for "end-to-end", "PMs" for "product managers")?
 */
function supported(
  term: string,
  sourceKeys: string[],
  sourceTexts: string[],
  sourceIndex: ResumeIndex,
): boolean {
  const k = key(term);
  if (!k) return true;
  if (sourceKeys.some((s) => s.includes(k))) return true;
  // Multi-word run: accept when every word is supported on its own (order/joiner may differ)
  const words = term.split(/[ -]/).filter(Boolean);
  if (
    words.length > 1 &&
    words.every((w) => sourceKeys.some((s) => s.includes(key(w))))
  )
    return true;
  const n = normalise(term);
  if (sourceTexts.some((s) => s.includes(n))) return true;
  // Acronym plurals ("UIs", "PMs", "APIs") are shorter than the ATS stemmer's floor
  const forms = (w: string) =>
    /^[a-z0-9]{2,4}s$/.test(w) ? [w, w.slice(0, -1)] : [w];
  return words.every(
    (w) =>
      sourceKeys.some((s) => s.includes(key(w))) ||
      forms(normalise(w)).some((f) => keywordHit(f, sourceIndex).hit),
  );
}

/** A percentage must appear as one in the source; "+44 7700…" (phone) never supports "44%" */
function figureSupported(fig: string, sourceTexts: string[]): boolean {
  const num = fig.match(/\$?\d[\d,]*(?:\.\d+)?/)![0].replace(/[$,]/g, "");
  const pct = fig.endsWith("%") ? "\\s*(?:%|percent)" : "";
  const re = new RegExp(
    `(?<![0-9.+])${num.replace(".", "\\.")}(?![0-9])${pct}`,
    "i",
  );
  return sourceTexts.some((s) => re.test(s));
}

const wordSet = (s: string) =>
  new Set(
    normalise(s)
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(" ")
      .filter((w) => w.length > 2),
  );

/** Share of `quote`'s words that some single resume line also contains (best line wins) */
function bestLineOverlap(quote: string, lines: Set<string>[]): number {
  const q = wordSet(quote);
  if (q.size < 4) return 0;
  let best = 0;
  for (const l of lines) {
    let hit = 0;
    for (const w of q) if (l.has(w)) hit++;
    best = Math.max(best, hit / q.size);
  }
  return best;
}

/** Numbered items of one heading's section: `[{ n, text }]`; `null` when the heading is absent */
function section(
  text: string,
  heading: RegExp,
): { n: number; text: string }[] | null {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => heading.test(l.trim()));
  if (start < 0) return null;
  const items: { n: number; text: string }[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^[A-Z][A-Z0-9 &'’/—–-]{5,}$/.test(l.trim()) && !/^\d/.test(l.trim()))
      break; // next heading
    const m = /^\s*(\d+)[.)]\s*(.*)$/.exec(l);
    if (m) items.push({ n: Number(m[1]), text: m[2] });
    else if (items.length && l.trim())
      items[items.length - 1].text += "\n" + l.trim();
  }
  return items;
}

const QUOTE_RE = /["“]([^"“”\n]{20,})["”]/g;

export interface BriefGrounding {
  /** LIKELY QUESTIONS whose answer angle neither names an employer / school / resume line nor calls the topic a gap */
  uncitedQuestions: number[];
  questionCount: number;
  /** YOUR STORIES with no quoted resume bullet, or whose quote is not in the resume */
  unquotedStories: number[];
  storyCount: number;
}

/**
 * Checks the contract the interview-brief prompt sets (R705): every LIKELY
 * QUESTION angle cites the employer or bullet it comes from or says the topic
 * is "not on your resume" (R736; older briefs: "no direct evidence — position
 * it as a gap"); every STORY is built from one quoted
 * resume bullet. `anchors` are the resume's employer and school names.
 * Returns `null` when the text is not in the brief's shape (template,
 * user-written, older output).
 */
export function briefGrounding(
  text: string,
  resumeText: string,
  anchors: string[],
): BriefGrounding | null {
  const questions = section(text, /^LIKELY QUESTIONS\b/);
  const stories = section(text, /^YOUR STORIES\b/);
  if (!questions || !stories || (!questions.length && !stories.length))
    return null;
  const resumeLines = resumeText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 20)
    .map(wordSet);
  const resumeKey = key(resumeText);
  // Full name plus its distinctive first word ("Northstar" for "Northstar Digital")
  const anchorKeys = anchors
    .flatMap((a) => {
      const first = a.trim().split(/\s+/)[0] ?? "";
      return [
        key(a),
        first.length >= 5 && !TITLE_WORDS.has(first.toLowerCase())
          ? key(first)
          : "",
      ];
    })
    .filter((k) => k.length >= 4);

  const uncitedQuestions: number[] = [];
  for (const q of questions) {
    const body = q.text.replace(/\n/g, " ");
    // The angle follows the question: after its "?", else after the first line break / " — "
    const qEnd = body.indexOf("?");
    const nl = q.text.indexOf("\n");
    const dash = body.search(/\s[—–-]\s/);
    const cut = qEnd >= 0 ? qEnd + 1 : nl >= 0 ? nl : dash >= 0 ? dash : 0;
    const angle = body.slice(cut);
    const k = key(angle);
    const citesEmployer = anchorKeys.some((e) => k.includes(e));
    const namesGap =
      /no direct evidence|\bgaps?\b|\bhonest|not (?:stated|mentioned|listed|shown|covered|on (?:your|the|my) resume|in (?:the )?(?:commercial|listed|resume))|does not (?:mention|state|list|show)|doesn't (?:mention|state|list|show)|resume (?:has nothing|does not|doesn't|lacks|shows no)|no (?:commercial|production|direct|stated|listed) (?:experience|evidence|work)|\b(?:have|has|had) not\b|haven't|hasn't|i'd need to|would need to/i.test(
        angle,
      );
    const quotesResume = [...angle.matchAll(QUOTE_RE)].some(
      (m) =>
        resumeKey.includes(key(m[1])) ||
        bestLineOverlap(m[1], resumeLines) >= 0.7,
    );
    if (!citesEmployer && !namesGap && !quotesResume)
      uncitedQuestions.push(q.n);
  }

  const unquotedStories: number[] = [];
  for (const s of stories) {
    // Quoted spans, plus each STAR segment ("A: Led a customer-facing …") — models
    // reproduce the bullet verbatim without quotation marks as often as with them
    const quotes = [
      ...[...s.text.matchAll(QUOTE_RE)].map((m) => m[1]),
      ...s.text
        .split(/(?:^|\n|\s)(?:[STAR]|Situation|Task|Action|Result)\s*[:\u2014-]\s*/i)
        .map((seg) => seg.replace(/\s+/g, " ").trim())
        .filter((seg) => seg.length >= 20),
    ];
    const grounded = quotes.some(
      (qt) =>
        resumeKey.includes(key(qt)) || bestLineOverlap(qt, resumeLines) >= 0.7,
    );
    if (!grounded) unquotedStories.push(s.n);
  }
  return {
    uncitedQuestions,
    questionCount: questions.length,
    unquotedStories,
    storyCount: stories.length,
  };
}

export interface UnsupportedClaims {
  /** Names / tools / places the text states that no source mentions */
  terms: string[];
  /** Figures (%, money, decimals, counts ≥ 10) that no source contains */
  figures: string[];
}

/**
 * Concrete claims in `text` (an AI-written brief or letter) that appear in none
 * of `sources` (resume text, job description, the user's own notes).
 */
export function unsupportedClaims(
  text: string,
  sources: string[],
): UnsupportedClaims {
  const src = sources.filter((s) => s && s.trim());
  const sourceTexts = src.map(normalise);
  const sourceKeys = src.map(key);
  const sourceIndex = indexResumeText(src.join("\n"));
  const terms: string[] = [];
  const seenT = new Set<string>();
  for (const run of properRuns(text)) {
    const k = key(run);
    if (seenT.has(k)) continue;
    seenT.add(k);
    if (!supported(run, sourceKeys, sourceTexts, sourceIndex)) terms.push(run);
  }
  const figs: string[] = [];
  const seenF = new Set<string>();
  for (const f of figures(text)) {
    if (seenF.has(f)) continue;
    seenF.add(f);
    if (!figureSupported(f, sourceTexts)) figs.push(f);
  }
  return { terms, figures: figs };
}

const PREFERENCE_RE =
  /\bI(?:'m| am) (?:comfortable|passionate|happy|at ease|used to|drawn to|energi[sz]ed by)\b[^.;!?\n]{0,60}|\bI (?:care deeply|thrive|enjoy|love|prefer|relish|value|genuinely (?:enjoy|care|love))\b[^.;!?\n]{0,60}|\bI(?:'ve| have) always\b[^.;!?\n]{0,60}/g;

/**
 * First-person feelings a letter states about the candidate — "I'm comfortable
 * working with product managers to refine quarterly goals", "I care deeply
 * about accessibility" — that none of `sources` (resume, the user's own
 * highlights) say. A resume records what someone did; a model that needs a
 * bridge to a job-ad duty tends to invent how the candidate feels about it.
 */
export function preferenceClaims(text: string, sources: string[]): string[] {
  const own = normalise(sources.filter((s) => s && s.trim()).join("\n"));
  const out: string[] = [];
  for (const m of text.match(PREFERENCE_RE) ?? []) {
    const phrase = m
      .split(",")[0]
      .trim()
      .split(" ")
      .slice(0, 9)
      .join(" ");
    // The user's own words (highlights) or a resume summary that says it are fine
    const words = normalise(phrase)
      .replace(/[^a-z0-9' ]+/g, " ")
      .split(" ")
      .filter((w) => w.length > 3);
    const stated =
      words.length > 0 &&
      words.filter((w) => own.includes(w)).length / words.length >= 0.8;
    if (!stated) out.push(phrase);
  }
  return out;
}

export interface TailorClaims {
  /** Figures the rewrite states that the original line and resume do not */
  figures: string[];
  /** Names / tools the rewrite states that the resume and job ad do not */
  terms: string[];
  /** Job-ad words the rewrite adds that appear nowhere in the resume */
  mirrored: string[];
  /** Figures kept from the original line but attached to something else */
  remeasured: RemeasuredFigure[];
}

const FUNCTION_WORDS = new Set(
  `a an and as at be by for from in into is it of on or our that the their this
to with your you we who which while when where what how all any each more most
other some such than then there these those through under up out over via per
across within without between both but not no nor so if also well very
has have had can could would should will may might just about like why
because whether`.split(/\s+/),
);

const wordStems = (text: string): Set<string> => {
  const out = new Set<string>();
  for (const w of normalise(text).match(/[a-z][a-z'-]*[a-z]|[a-z]/g) ?? []) {
    const plain = w.replace(/'s$/, "");
    out.add(plain);
    out.add(stemmer(plain));
  }
  return out;
};

/**
 * What a "Tailor to this job" rewrite adds that the candidate's own text does
 * not support. The prompt allows JD wording only where the fact is already in
 * the line, so a job-ad word the whole resume never uses is the exact signal
 * for scope or skill inflation ("Owned", "conversion", "latency").
 */
export function tailorClaims(
  original: string,
  suggestion: string,
  resumeText: string,
  jobDescription: string,
): TailorClaims {
  const own = [original, resumeText];
  const { terms, figures } = unsupportedClaims(suggestion, own);
  const jdTerms = new Set(
    unsupportedClaims(suggestion, [jobDescription]).terms.map(key),
  );
  const have = wordStems(`${original}\n${resumeText}`);
  const jd = wordStems(jobDescription);
  const mirrored: string[] = [];
  const seen = new Set<string>();
  for (const w of suggestion.match(/[A-Za-z][A-Za-z'-]*[A-Za-z]/g) ?? []) {
    const plain = w.toLowerCase().replace(/'s$/, "");
    if (plain.length < 3 || FUNCTION_WORDS.has(plain)) continue;
    if (have.has(plain) || have.has(stemmer(plain))) continue;
    if (!jd.has(plain) && !jd.has(stemmer(plain))) continue;
    if (seen.has(stemmer(plain))) continue;
    seen.add(stemmer(plain));
    mirrored.push(w);
  }
  return {
    figures,
    terms: terms.filter((t) => !jdTerms.has(key(t))),
    mirrored,
    remeasured: remeasuredFigures(original, suggestion),
  };
}

/** Ad words that say nothing about the candidate on their own */
const GENERIC_AD_WORDS = new Set(
  `team teams technical platform product products engineering engineers design
support systems tools business process solutions performance development
workflows senior success technology data customers customer users user
experience experiences internal external stakeholders quality scalable robust
modern high fast complex end key core new impact real world class person
people role roles opportunity company
build building built develop developing developed deliver delivering delivered
drive driving driven work working worked help helping helped
create creating created make making made use using used improve improving
improved ensure ensuring collaborate collaborating collaborated partner
partnering partnered ship shipping shipped manage managing
managed support supporting supported align aligning aligned enable enabling
enabled apply applying applied span spanning spanned across`.split(/\s+/),
);

const CONTENT_RE = /[A-Za-z][A-Za-z'-]*[A-Za-z]/g;
const CLAUSE_RE = /[,;:.()[\]\n]|\s[-–—]\s/;

const contentStems = (text: string): string[] => {
  const out: string[] = [];
  for (const w of normalise(text).match(CONTENT_RE) ?? []) {
    const plain = w.replace(/'s$/, "");
    if (plain.length < 3 || FUNCTION_WORDS.has(plain)) continue;
    out.push(stemmer(plain));
  }
  return out;
};

/** Adjacent content-word pairs inside one clause (never across , ; : . ( ) or a line break) */
const bigrams = (text: string): Set<string> => {
  const out = new Set<string>();
  for (const clause of text.split(CLAUSE_RE)) {
    const stems = contentStems(clause);
    for (let i = 0; i + 1 < stems.length; i++)
      out.add(`${stems[i]} ${stems[i + 1]}`);
  }
  return out;
};

const stemCounts = (text: string): Map<string, number> => {
  const out = new Map<string, number>();
  for (const s of contentStems(text)) out.set(s, (out.get(s) ?? 0) + 1);
  return out;
};

/**
 * Verbs that widen the candidate's remit (owner / leader / architect) — stems,
 * with the irregular past forms the stemmer cannot map.
 */
const SCOPE_VERB_STEMS = new Set(
  `own lead spearhead architect direct head manag drive pioneer oversee
orchestr champion found establish`.split(/\s+/),
);
const IRREGULAR_STEMS: Record<string, string> = {
  led: "lead",
  drove: "drive",
  driven: "drive",
  oversaw: "oversee",
  overseen: "oversee",
};
const verbStem = (w: string) => IRREGULAR_STEMS[w] ?? stemmer(w);

export interface DraftClaims {
  /** Figures the draft states that the resume (and the line it completes) do not */
  figures: string[];
  /** Names / tools the draft states that neither the resume nor the job ad mention */
  terms: string[];
  /** Job-ad phrases and specific words the draft uses that the resume never does */
  mirrored: string[];
  /** Remit verbs (owned / led / architected …) the resume never uses in any form */
  scope: string[];
  /** Figures kept from the line being rewritten but attached to something else */
  remeasured: RemeasuredFigure[];
}

/**
 * What an AI-drafted bullet ("Suggest a bullet", "…with key numbers", "Complete
 * line", rewrite variants) says that the candidate's resume does not. Unlike
 * {@link tailorClaims} there may be no original line, so every word is new —
 * the signal is job-ad *phrases* (two content words the ad uses together and
 * the resume never does: "design documents", "multi-sided booking") plus
 * ad-specific single words (hyphenated, capitalised, known skills), not the
 * generic verbs and nouns any bullet shares with any ad ("using", "teams").
 */
export function draftClaims(
  draft: string,
  resumeText: string,
  jobDescription: string,
  own: string[] = [],
): DraftClaims {
  const ownText = [resumeText, ...own].filter((s) => s && s.trim()).join("\n");
  const { terms, figures } = unsupportedClaims(draft, [ownText]);
  const jdTerms = new Set(
    unsupportedClaims(draft, [jobDescription]).terms.map(key),
  );
  const have = wordStems(ownText);
  const haveBigrams = bigrams(ownText);
  const lineWords = wordStems(own.join("\n"));
  const jd = stemCounts(jobDescription);
  const jdBigrams = bigrams(jobDescription);
  const mirrored: string[] = [];
  const seen = new Set<string>();
  const words = draft.match(CONTENT_RE) ?? [];
  const haveVerbs = new Set(
    (normalise(ownText).match(CONTENT_RE) ?? []).map(verbStem),
  );
  const isOwn = (w: string) =>
    have.has(w) || have.has(stemmer(w)) || haveVerbs.has(verbStem(w));
  // "customer-facing" is the candidate's own "customer"; "multi-sided" is nobody's
  const ownWord = (w: string) =>
    isOwn(w) ||
    (w.includes("-") &&
      w.split("-").some((p) => p.length >= 3 && isOwn(p)));
  const lineWord = (w: string) =>
    lineWords.has(stemmer(w)) ||
    (w.includes("-") &&
      w.split("-").some((p) => p.length >= 3 && lineWords.has(stemmer(p))));
  // Word offsets that open a sentence: capitalised there says nothing
  const sentenceStarts = new Set<number>();
  let idx = 0;
  for (const m of draft.matchAll(CONTENT_RE)) {
    if (/(^|[.!?;:\n•*-])\s*$/.test(draft.slice(0, m.index))) sentenceStarts.add(idx);
    idx++;
  }
  const scope: string[] = [];
  for (const w of words) {
    const plain = w.toLowerCase();
    const st = verbStem(plain);
    if (!SCOPE_VERB_STEMS.has(st) || isOwn(plain) || seen.has(`scope:${st}`))
      continue;
    seen.add(`scope:${st}`);
    seen.add(stemmer(plain));
    scope.push(w);
  }
  // Phrases: two adjacent content words the ad uses together and the resume never does
  for (const clause of draft.split(CLAUSE_RE)) {
    const ws = clause.match(CONTENT_RE) ?? [];
    for (let i = 0; i + 1 < ws.length; i++) {
      const a = ws[i].toLowerCase().replace(/'s$/, "");
      const b = ws[i + 1].toLowerCase().replace(/'s$/, "");
      if (a.length < 3 || b.length < 3) continue;
      if (FUNCTION_WORDS.has(a) || FUNCTION_WORDS.has(b)) continue;
      const pair = `${stemmer(a)} ${stemmer(b)}`;
      if (!jdBigrams.has(pair) || haveBigrams.has(pair) || seen.has(pair))
        continue;
      // Rewording the line being rewritten ("reviewing code" → "code reviews",
      // "customer reporting" → "customer-facing analytics") is not borrowing
      if (
        (lineWord(a) || lineWord(b)) &&
        (lineWord(a) || ownWord(a)) &&
        (lineWord(b) || ownWord(b))
      )
        continue;
      seen.add(pair);
      seen.add(stemmer(a));
      seen.add(stemmer(b));
      mirrored.push(`${ws[i]} ${ws[i + 1]}`);
    }
  }
  // Single words the ad is specific about: hyphenated, capitalised mid-sentence,
  // a technology name, or a theme the ad repeats
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const plain = w.toLowerCase().replace(/'s$/, "");
    if (plain.length < 3 || FUNCTION_WORDS.has(plain)) continue;
    if (GENERIC_AD_WORDS.has(plain) || ownWord(plain)) continue;
    const inJd = jd.get(stemmer(plain)) ?? 0;
    if (inJd === 0 || seen.has(stemmer(plain))) continue;
    const specific =
      plain.includes("-") ||
      (!sentenceStarts.has(i) && /^[A-Z]/.test(w)) ||
      looksLikeSkill(plain) ||
      inJd >= 2;
    if (!specific) continue;
    seen.add(stemmer(plain));
    mirrored.push(w);
  }
  return {
    figures,
    terms: terms.filter((t) => !jdTerms.has(key(t))),
    mirrored,
    scope,
    remeasured: remeasuredFigures(own.join("\n"), draft),
  };
}

export interface BorrowedSentence {
  /** The letter sentence, as written */
  sentence: string;
  /** Job-ad phrases / words the candidate's own part of it uses that the resume never does */
  words: string[];
}

/** "I led / I have built / we shipped" — a sentence that states what the candidate did */
const PAST_CLAIM_RE =
  /\b(?:I|[Ww]e)(?:\s+(?:also|then|later|recently|personally|previously|first))?\s+(?:[a-z]{2,}ed|led|built|ran|wrote|grew|won|drove|oversaw|took|made|spent|set|cut|kept|held|brought|taught|began|became|sold|met|left|found|went|gave|got)\b|\b(?:I|[Ww]e)(?:'ve| have|'d| had)\s+(?:also\s+|since\s+)?[a-z]{2,}(?:ed|en|t)\b/;

/**
 * Where a letter sentence stops describing the candidate and starts relating
 * that to the job: "— work that speaks to …", ", which aligns with …",
 * "experience relevant to …", "the kind of …". Everything after is about the
 * employer and may use the ad's words freely.
 */
const BRIDGE_RE =
  /\s(?:—|–)\s|,\s*(?:work|experience|skills?|results?|habits?|a background|an experience|something|exactly|precisely|directly|all of which|which|an?\s+(?:\w+\s+){0,2}(?:experience|record|background|match))\s+(?:that|which|relevant|directly|closely|I\b|is\b|are\b|maps?|speaks?|aligns?|fits?|matches?|mirrors?|translates?)|\b(?:so\s+that|which|that|and)\s+(?:maps?|speaks?|aligns?|fits?|matches?|mirrors?|translates?|carries?|applies?|relates?|would|will|could|should)\b|\b(?:maps?|mapping|speaks?|speaking|aligns?|aligning|fits?|fitting|matches?|matching|mirrors?|mirroring|translates?|translating|transfers?|transferring)\s+(?:directly\s+|closely\s+|well\s+|naturally\s+)?(?:onto|to|with|into)\b|\b(?:relevant|similar|comparable|applicable|transferable)\s+to\b|\bthe\s+(?:same\s+)?kind\s+of\b|\b(?:as|just as|much as|exactly what|precisely what|what)\s+(?:your|the)\s+(?:team|role|ad|posting|position|job)\b|\byou(?:r|'re| are)?\b/;

const LETTER_SENTENCES = (text: string): string[] =>
  text
    .split(/\n+/)
    .flatMap((p) => p.match(/[^.!?]+(?:[.!?]+|$)/g) ?? [])
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

/**
 * Sentences of a cover letter that describe what the candidate did in the job
 * ad's words when the resume never uses them — "documenting keyboard
 * interactions so that planners, support specialists, suppliers and
 * participants could navigate" from a resume that says "our product design
 * system". Only the part before the bridge to the employer counts: a letter
 * must talk about the job, but the candidate's past must stay the resume's.
 * Lexical and advisory: a borrowed duty written in the resume's own words
 * passes, and a legitimate synonym the ad happens to use is listed too.
 */
export function letterBorrowing(
  letter: string,
  resumeText: string,
  jobDescription: string,
  own: string[] = [],
): BorrowedSentence[] {
  if (!jobDescription.trim()) return [];
  const out: BorrowedSentence[] = [];
  for (const sentence of LETTER_SENTENCES(letter)) {
    if (!PAST_CLAIM_RE.test(sentence)) continue;
    const bridge = BRIDGE_RE.exec(sentence);
    const claim = bridge ? sentence.slice(0, bridge.index) : sentence;
    if (!PAST_CLAIM_RE.test(claim)) continue;
    const { mirrored } = draftClaims(claim, resumeText, jobDescription, own);
    if (mirrored.length) out.push({ sentence, words: mirrored });
  }
  return out;
}

export interface SkillListChanges {
  /** Items in `after` that `before` never listed (renames excluded) */
  added: string[];
  /** Items in `before` that `after` no longer lists (renames excluded) */
  dropped: string[];
  /** before → after pairs that name the same skill in another form (REST APIs → REST API, TS → TypeScript) */
  renamed: [string, string][];
  /** `before` had labelled category lines and `after` has none */
  categoriesLost: boolean;
}

const SKILL_LABEL_RE = /^[^:]{1,40}:\s*(.+)$/;

const skillItems = (skills: string): string[] =>
  skills
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const m = line.match(SKILL_LABEL_RE);
      return (m ? m[1] : line)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    });

const skillKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#]+/g, "");

const skillWords = (s: string) =>
  s
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter(Boolean)
    .map((w) => w.replace(/s$/, ""));

/**
 * Same skill in another form: one's words all sit in the other's ("accessibility"
 * ≈ "Web accessibility", "REST APIs" ≈ "REST API"), or the ATS alias / stem
 * matcher pairs them (TS ≈ TypeScript, K8s ≈ Kubernetes).
 */
const sameSkill = (a: string, b: string) => {
  const wa = skillWords(a);
  const wb = skillWords(b);
  if (wa.length === 0 || wb.length === 0) return false;
  const [shorter, longer] = wa.length <= wb.length ? [wa, wb] : [wb, wa];
  if (shorter.every((w) => longer.includes(w))) return true;
  return (
    keywordHit(a.toLowerCase(), indexResumeText(b)).hit ||
    keywordHit(b.toLowerCase(), indexResumeText(a)).hit
  );
};

const labelledLines = (skills: string) =>
  skills.split("\n").filter((l) => SKILL_LABEL_RE.test(l.trim())).length;

/**
 * Item-level diff of a skills list before and after an AI cleanup. A cleanup may
 * reorder, dedupe and rename; anything it adds or drops is reported as such, and
 * so is flattening labelled category lines into one list. Lexical, advisory.
 */
export function skillListChanges(before: string, after: string): SkillListChanges {
  const b = skillItems(before);
  const a = skillItems(after);
  const bKeys = new Set(b.map(skillKey));
  const aKeys = new Set(a.map(skillKey));
  const onlyAfter = a.filter((s) => !bKeys.has(skillKey(s)));
  const onlyBefore = b.filter((s) => !aKeys.has(skillKey(s)));
  const renamed: [string, string][] = [];
  const added: string[] = [];
  const dropped = [...onlyBefore];
  for (const s of onlyAfter) {
    const i = dropped.findIndex((d) => sameSkill(d, s));
    if (i >= 0) {
      renamed.push([dropped[i], s]);
      dropped.splice(i, 1);
    } else added.push(s);
  }
  return {
    added,
    dropped,
    renamed,
    categoriesLost: labelledLines(before) >= 2 && labelledLines(after) === 0,
  };
}

export interface RemeasuredFigure {
  /** The figure as the rewrite states it ("35%", "3.2 seconds") */
  figure: string;
  /** What the original line measured with it ("dashboard rendering performance") */
  was: string;
  /** What the rewrite measures with it ("dashboard load times") */
  now: string;
}

/** Words that sit between a figure and the thing it measures without naming it */
const MEASURE_LINK_WORDS = new Set(
  `by from to of at over under within above below around nearly approximately
about roughly almost than up down per across with for in on through via the a an
its our their my more less least most only some every each`.split(/\s+/),
);
/** A new clause starts here: the words beyond do not belong to the figure */
const MEASURE_STOP_WORDS = new Set(
  "and or but that which while who whom whose where when".split(" "),
);
const UNIT_RE =
  /^(%|percent|k|m|x|ms|s|seconds?|minutes?|hours?|days?|weeks?|months?|years?|\+)$/i;
const MEASURE_CLAUSE_RE = /[,;:()[\]\n]|\s[-–—]\s|\.(?=\s|$)/;
const LINKING_PREP_RE =
  /^(by|from|to|of|at|over|under|within|above|below|around|nearly|approximately|about|roughly|almost|than)$/i;

interface MeasureToken {
  text: string;
  start: number;
}

const measureTokens = (clause: string): MeasureToken[] => {
  const out: MeasureToken[] = [];
  for (const m of clause.matchAll(
    /\$?\d[\d,]*(?:\.\d+)?%?|[A-Za-z][A-Za-z0-9'-]*[A-Za-z0-9]|[A-Za-z]/g,
  ))
    out.push({ text: m[0], start: m.index });
  return out;
};

const isFigureToken = (t: string) => /^\$?\d/.test(t);
const isFiller = (t: string) =>
  isFigureToken(t) ||
  UNIT_RE.test(t) ||
  MEASURE_LINK_WORDS.has(t.toLowerCase()) ||
  FUNCTION_WORDS.has(t.toLowerCase());

/** Up to three content words walking back from `from` (exclusive) inside the clause */
const wordsBefore = (tokens: MeasureToken[], from: number): string[] => {
  const out: string[] = [];
  for (let i = from - 1; i >= 0 && out.length < 3; i--) {
    const t = tokens[i].text;
    if (MEASURE_STOP_WORDS.has(t.toLowerCase())) break;
    if (isFiller(t)) continue;
    out.unshift(t);
  }
  return out;
};

/** Up to three content words right after `from` (exclusive), stopping at the first link word */
const wordsAfter = (tokens: MeasureToken[], from: number): string[] => {
  const out: string[] = [];
  for (let i = from + 1; i < tokens.length && out.length < 3; i++) {
    const t = tokens[i].text;
    if (isFigureToken(t) || UNIT_RE.test(t)) continue;
    if (MEASURE_STOP_WORDS.has(t.toLowerCase())) break;
    if (isFiller(t)) {
      if (out.length || LINKING_PREP_RE.test(t) || t.toLowerCase() === "through") break;
      continue;
    }
    out.push(t);
  }
  return out;
};

/**
 * The noun phrase a figure measures, as up to three content words: for
 * "improved dashboard rendering performance by 35% through profiling" →
 * "dashboard rendering performance"; for "for 120 business accounts" →
 * "business accounts". A bare count names what follows it; a figure after a
 * linking preposition (by / from / to / of …) names what precedes it.
 */
const measuredPhrase = (clause: string, figStart: number, bareCount: boolean): string[] => {
  const tokens = measureTokens(clause);
  const at = tokens.findIndex((t) => t.start === figStart);
  if (at < 0) return [];
  const linked = at > 0 && LINKING_PREP_RE.test(tokens[at - 1].text);
  const after = wordsAfter(tokens, at);
  if (bareCount && after.length) return after;
  if (linked) {
    const before = wordsBefore(tokens, at);
    if (before.length) return before;
  }
  if (after.length) return after;
  return wordsBefore(tokens, at);
};

const formatFigure = (num: string, unit: string) => {
  if (!unit) return num;
  if (unit === "%" || unit === "percent") return `${num}%`;
  return /^(k|m|x|ms|s)$/.test(unit) ? `${num}${unit}` : `${num} ${unit}`;
};

/** Every figure in `text` with the phrase it measures, keyed by the figure's normalised value */
const measuredFigures = (text: string): Map<string, { figure: string; phrase: string[] }[]> => {
  const out = new Map<string, { figure: string; phrase: string[] }[]>();
  for (const clause of text.split(MEASURE_CLAUSE_RE)) {
    for (const m of clause.matchAll(NUMBER_RE)) {
      const num = m[1].replace(/[$,]/g, "");
      const unit = m[2].trim().toLowerCase();
      if (/^(minutes?|hours?|days?|weeks?|months?|years?)$/.test(unit)) continue;
      const bareCount = !unit && !num.includes(".") && !m[1].startsWith("$");
      if (bareCount && Number(num) < 10) continue;
      if (/^(19|20)\d{2}$/.test(num)) continue;
      const pct = unit === "%" || unit === "percent";
      const k = `${num}${pct ? "%" : ""}`;
      const phrase = measuredPhrase(clause, m.index, bareCount);
      const list = out.get(k) ?? [];
      list.push({ figure: formatFigure(m[1], unit), phrase });
      out.set(k, list);
    }
  }
  return out;
};

/**
 * Figures a rewrite keeps from the original line but attaches to something
 * else — "improved dashboard rendering performance by 35%" rewritten as
 * "reduced dashboard load times by 35%". The number survives every figure
 * check; what it measures did not. A phrase is the same measurement when its
 * head word (the last one) is the original phrase's head, or appears anywhere
 * in the original line in some form (stem / alias), so "rendering performance"
 * → "rendering speed" is reported and "page load time" → "checkout load time"
 * is not. An original phrase of one word ("Saved $40k") is too little to
 * compare against. Lexical, advisory; one note per figure.
 */
export function remeasuredFigures(original: string, rewrite: string): RemeasuredFigure[] {
  const was = measuredFigures(original);
  if (was.size === 0) return [];
  const now = measuredFigures(rewrite);
  const originalStems = wordStems(original);
  const originalIndex = indexResumeText(original);
  const out: RemeasuredFigure[] = [];
  for (const [k, uses] of now) {
    const before = (was.get(k) ?? []).filter((b) => b.phrase.length >= 2);
    if (!before.length) continue;
    for (const use of uses) {
      const head = use.phrase[use.phrase.length - 1];
      if (!head) continue;
      const headPlain = head.toLowerCase().replace(/'s$/, "");
      const same = before.some(
        (b) =>
          stemmer(b.phrase[b.phrase.length - 1].toLowerCase()) === stemmer(headPlain) ||
          originalStems.has(headPlain) ||
          originalStems.has(stemmer(headPlain)) ||
          keywordHit(headPlain, originalIndex).hit,
      );
      if (same) continue;
      out.push({ figure: use.figure, was: before[0].phrase.join(" "), now: use.phrase.join(" ") });
      break;
    }
  }
  return out;
}
