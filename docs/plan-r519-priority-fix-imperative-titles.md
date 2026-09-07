# R519 — Priority fixes 用「通过态」检查名当标题，读起来自相矛盾

## 一手证据（生产 CDP，2026-08-31）
- 全新存储 /ats-checker 粘贴短简历+JD 检查，Priority fixes 列表出现：
  - 「Word count in recommended range — Your resume is 54 words — … expect at least ~400」——标题宣称字数在推荐范围内，正文却说太短。
  - 「Enough content to parse — Very short resumes give ATS systems too little to match on.」——同类矛盾。
- R518 QA 中同样观察到「Phone number found — Include a phone number recruiters can call」这类标题（检查名是通过态描述，出现在"待修"列表却让用户加电话）。
- 根因（src/lib/guidance.ts priorityFixes）：失败检查项直接用 `${check.label} — ${check.hint}` 拼标题，而 check.label 全部是通过态措辞（供 pass/fail 清单用），放进「What to fix first」列表语义相反。

## 修复（最小）
- guidance.ts 增加 FIX_TITLES 映射：每个检查 label → 祈使句修复标题（如 'Word count in recommended range' → 'Bring the word count into the recommended range'、'Phone number found' → 'Add a phone number'）。
- priorityFixes 中改用 `FIX_TITLES[check.label] ?? check.label`。未映射标签回退原文。
- 检查清单本身（pass/fail 列表）、fixedChecks 徽章键、health dimensions 标题零改动；Builder 侧 Priority fixes 与 improveScoreReply 自动受益（同一函数）。

## 非目标
- 不改评分、不改 hint 文案、不改检查判定。
