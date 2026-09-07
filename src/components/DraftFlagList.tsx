/**
 * Advisory notes under an AI draft: the word-level checks it failed against the
 * resume (figures, names, job-ad wording, remit verbs). Shared by the builder's
 * draft dialogs and the assistant panel's proposal cards.
 */

import type { DraftClaims } from "@/lib/grounding";

export interface DraftFlagGroup {
  label: string;
  items: string[];
}

/** Word-level checks an AI draft failed against the resume — advisory, never proof */
export function draftFlagGroups(c: DraftClaims): DraftFlagGroup[] {
  return [
    { label: "Figures your resume never states", items: c.figures },
    { label: "Names / tools your resume never mentions", items: c.terms },
    {
      label: "Wording from the job ad that your resume never uses",
      items: c.mirrored,
    },
    { label: "Claims a remit your resume never states", items: c.scope },
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
