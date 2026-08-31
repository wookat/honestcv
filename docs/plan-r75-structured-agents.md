# R75 — Structured Agents section

## Evidence (firsthand)

`~/audit-r1/shots-r71/rezi-agents.png` — Rezi's Agents editor (route under the resume, enabled
from the ··· menu › Other › Agents, PRO-gated at $29/mo; ours ships free):

- WHAT WAS THE **NAME** OF THE AGENT? * (placeholder "My First Agent")
- WHEN DID YOU BUILD THE AGENT? (placeholder "2026")
- WHAT **SKILLS** DID YOU USE? (placeholder "Research & Analysis, Task Automation, Workflow Management")
- HOW WAS BUILDING THE AGENT **RELEVANT**? (bullet-style description)
- Sidebar entry list with +, Sort by date toggle, "SAVE TO AGENTS LIST".

This is the last structured section from Rezi's section menu we have evidence for and don't
support. AI-agent portfolio entries are a real 2026 resume primitive; today users can only
fake it via a custom section (flat bullets, no dates/skills structure).

## Model

```ts
export interface AgentItem {
  id: string
  name: string        // agent name, e.g. "Support Triage Agent"
  date: string        // when built, e.g. "2026"
  skills: string      // skills used, e.g. "Task Automation, Workflow Management"
  description: string // relevance; one bullet per line
}
agents?: AgentItem[]  // optional — schema evolution, stays in honestcv.resume
```

`'agents'` appended to `SECTION_KEYS` after `'military'`; label `Agents`. R74's default-position
splice places it after Military service for legacy resumes.

## Canonical semantics (mirrors Coursework)

- `agentEntries(r)`: entries with nonblank `name`.
- Heading line: name (bold in preview/PDF/DOCX); date right-aligned italic.
- Bullets: `Skills used: <skills>` as the first bullet when skills nonblank (mirrors
  Coursework's `Skill: X`), then nonblank description lines.
- Outputs: preview / PDF (`titleLine` + `bullet`) / DOCX (bold name, right-tabbed italic date,
  bullets) / TXT (`AGENTS`) / Markdown (`## Agents`, `###` heading, italic date) — all from the
  same helpers; empty section renders nothing anywhere.

## Builder

Card after Military service: Agent name / When built / Skills used / relevance textarea (one
bullet per line), Add/Delete with ≥40px mobile touch targets, existing `setResume` +
debounced save path.

## Non-goals

Sort by date toggle, cross-resume "save to agents list" library, import-mapping changes, AI
writer per-field integration (assistant already covers drafting).
