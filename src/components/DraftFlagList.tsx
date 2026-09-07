/**
 * Advisory notes under an AI draft: the word-level checks it failed against the
 * resume (figures, names, job-ad wording, remit verbs). Shared by the builder's
 * draft dialogs and the assistant panel's proposal cards.
 */

import type {
  DraftClaims,
  RemeasuredFigure,
  SkillListChanges,
} from "@/lib/grounding";

export interface DraftFlagGroup {
  label: string;
  items: string[];
}

export const REMEASURED_LABEL = "Your figure now measures something else";

/** `35%: rendering performance → load times` */
export const remeasuredItems = (r: RemeasuredFigure[]): string[] =>
  r.map((x) => `${x.figure}: ${x.was} → ${x.now}`);

/** Word-level checks an AI draft failed against the resume — advisory, never proof */
export function draftFlagGroups(c: DraftClaims): DraftFlagGroup[] {
  return [
    { label: "Figures your resume never states", items: c.figures },
    { label: REMEASURED_LABEL, items: remeasuredItems(c.remeasured) },
    { label: "Names / tools your resume never mentions", items: c.terms },
    {
      label: "Wording from the job ad that your resume never uses",
      items: c.mirrored,
    },
    { label: "Claims a remit your resume never states", items: c.scope },
  ].filter((g) => g.items.length > 0);
}

/** Item-level checks a skills cleanup failed against the original list — a cleanup renames and reorders, never adds or drops */
export function skillFlagGroups(c: SkillListChanges): DraftFlagGroup[] {
  return [
    { label: "Not in your skills list", items: c.added },
    { label: "Dropped from your skills list", items: c.dropped },
    {
      label: "Category lines flattened",
      items: c.categoriesLost ? ["your labelled lines become one plain list"] : [],
    },
  ].filter((g) => g.items.length > 0);
}

export function DraftFlagList({
  id,
  groups,
}: {
  id?: string;
  groups: DraftFlagGroup[];
}) {
  return (
    <ul
      id={id}
      className="space-y-0.5 rounded-md border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs text-amber-900"
      aria-label="Check before accepting"
    >
      {groups.map((g) => (
        <li key={g.label}>
          <span className="font-medium">{g.label}:</span>{" "}
          {g.items.map((it, i) => (
            <span key={it}>
              {i > 0 && ", "}
              <mark className="rounded bg-amber-200/70 px-0.5 text-inherit">
                {it}
              </mark>
            </span>
          ))}
        </li>
      ))}
    </ul>
  );
}
