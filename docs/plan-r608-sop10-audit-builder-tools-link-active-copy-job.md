# R608 — SOP-10 四维审计节点（距 R598 十轮）+ Builder 内打开的 Cover letter / Interview prep 不再丢失所属职位（2026-09-06）

## 审计（生产 index-DN5ikuFR.js，零 AI 配额，零分享/支付/leads）

### 1. 响应式复扫（qa/r588-sweep.cjs，CDP 实测）
7 路由 × 1280/375：`scrollWidth === clientWidth === visualViewport.width` 全部成立；仅两个已知有意内滚容器越界
（首页 `table.min-w-[560px]`；/builder 节导航 `w-max` chip 条）。console 错误 0。**无页面级溢出。**

### 2. 竞品公开页（rezi.ai ai-cover-letter-builder / features / ai-resume-builder，web fetch 取证）
无新增能力：仍为 Build/Score/Target + AI Keyword Targeting + MCP + 真人审阅；Free 计划「1 份简历、3 次 PDF、cover/resignation 不限」。
Rezi 公开页**没有**职位跟踪/申请管道产品面——RezUp 的 jobs↔builder↔documents 闭环是差异化能力，本专题继续深挖有价值。
R598 已列的 MCP / 真人审阅 / 教学视频三项战略候选维持不变（需账号体系，待老板决策）。

### 3. 数据一致性
- 备份/恢复（lib/workspace.ts）覆盖全部 honestcv.* 工作区键（pipeline、docs、versions、activeVersionId），恢复后关系图不丢失。
- R596 前的悬空 `resumeVersionId` 在 R604 后于 /jobs 回落为「Target my resume」，无死链。

### 4. 操作对等性 —— 本轮唯一可即修缺口（生产实证 qa/r608-evidence.cjs）
seed：副本 qa-v1（目标 SRE @ Globex）为当前编辑副本，且被跟踪职位 qa-j1 链接（`resumeVersionId=qa-v1`）。
在 **/builder 内**点底部「Cover letter」→ Start from a template → Save to My resumes：

| 打开入口 | 保存结果 |
|---|---|
| /jobs 职位卡 → Cover letter（带 `?job=`） | doc.forJob = 职位，pipeline.coverDocId = doc（R590/R601/R602） |
| /builder 底部 Cover letter（同一副本、同一职位） | **doc.forJob = null，pipeline.coverDocId = null** |

信件正文即「apply for the Site Reliability Engineer position at Globex」，公司栏由副本 targetCompany 预填，却存成一份普通文档：
/jobs 职位卡仍显示未写 cover letter，/documents 无法把它与职位关联（R602/R607 标签全部不适用）。
同一动作两个入口结果不一致，且用户无任何提示。

## 根因
`Builder.tsx` `BundleToolDialog` 的 `jobId` 只取 URL `?job=`（`toolJobId`），不看当前编辑副本的实际 pipeline 链接（`linkedJob`）。

## 方案（仅 src/pages/Builder.tsx）
```tsx
- jobId={toolOpen !== null ? toolJobId : ''}
+ jobId={toolOpen === 'cover' || toolOpen === 'interview' ? toolJobId || linkedJob?.id || '' : toolOpen ? toolJobId : ''}
```
- 仅 cover / interview 采用当前副本的链接职位；resignation letter 面向现雇主，不与目标职位绑定（保持只认 `?job=`）。
- 只认 **live 链接**（`linkedJob`），不用 R605 的 `targetedTrackedJob`（该职位用的是另一副本，不能替它决定）。
- 显式披露：结果区 Save 按钮下，当 `jobId` 对应已跟踪职位且尚未保存时显示
  「Saving links this cover letter to “<title>” at <company> on your jobs board.」；已存在同类文档时保留 R601 的替换披露（优先）。

## 验收
- linked：Save 后 doc.forJob=qa-j1、pipeline.coverDocId=doc.id；/jobs 职位卡显示已链 cover letter；保存前可见链接披露。
- standalone（副本未被任何职位链接）：行为不变（forJob null、无披露）。
- existing（职位已有 letter）：R601 替换披露仍显示，Save 后 coverDocId 指向新 doc、旧 doc 保留。
- 1280+375 无页面溢出；存储回基线；零 console 错误；零 AI 调用。
