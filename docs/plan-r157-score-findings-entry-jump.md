# R157 — Score breakdown findings cite the offending entry and jump straight to it

## 一手观察（2026-08-31，app.rezi.ai Rezi Score 弹窗）
- Rezi「Explore My Rezi score」弹窗的 Improvements 列表里，每条发现下方都有一个
  实体引用 chip（如「Senior Software Engineer」）——直接指认是哪条经历出的问题
  （weak bullet points / incorrect number of bullet points / no measured
  responsibilities 各条均带该 chip）。
- 我方 Score breakdown 弹窗的 findings 是纯文本（quantification/verbs 用
  `[role]` 前缀内嵌角色名，但不可点），Fix → 只跳到整个 Experience Section，
  用户还要自己找是哪张卡。
- 弹窗还有 How You Compare 直方图（percentile）——沿用刻意缓做（无真实数据）。

## 方案（guidance.ts + Builder.tsx，零 schema 零存储零依赖零评分改动）
1. guidance.ts：`HealthDimension` 增加可选 `richFindings?: HealthFinding[]`
   （`{ text; anchor?; entryId?; entryLabel? }`）。resumeHealth 的 bullets
   携带来源经历的 id 与身份标签（role — company），为 quantification /
   verbs / brevity / consistency 的逐条发现填充 entryId/entryLabel；
   分数与 findings 文案完全不变。
2. Builder.tsx：
   - Experience 条目卡加 `data-entry-id`，新增 `flashEntryId` state；
     `jumpToEntry(id)`：setMobilePane('edit') + 从折叠 Set 移除该 id +
     rAF 后 scrollIntoView({smooth}) + 1600ms ring flash（同 Section 机制）。
   - HealthDialog 的 finding 行：有 entryLabel 时渲染可点 chip
     「→ {entryLabel}」（min-h-10 sm:min-h-0），onClick 关弹窗并 jumpToEntry；
     无 entryId 的 finding 保持现状（Fix → 到 section 仍在）。

## 不做
- How You Compare 百分位直方图（无真实数据，刻意缓做项）。
- Education/Projects 条目级引用（health findings 目前只引用 experience）。

## 验收
- 1600px：弹窗内带角色名的 finding 显示「→ role, company」chip，点击关弹窗、
  展开并平滑滚到那张经历卡带 ring（折叠态也能展开）。
- 375px：从粘性分数 chip 开弹窗点 chip → 切回 Edit tab 并落到该卡；触点 ≥40px。
- 纯文本 findings（buzzwords/completeness 等）与 Fix →/Guide 链接回归不变。
- R152 分数 chip、R148–150 审计 chip 回归不受影响。
