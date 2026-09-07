# R598 — SOP-10 四维审计节点（距 R588 十轮）+ Builder 删除副本补齐 Undo（2026-09-06）

## 审计（生产 index-CUHZrqF-.js，零 AI 配额，零分享/支付/leads）

### 1. 响应式复扫（qa/r588-sweep.cjs，CDP 实测）
7 路由（/ /builder /dashboard /jobs /documents /ats-checker /pricing）× 1280/375：
`scrollWidth === clientWidth === visualViewport.width` 全部成立；仅两个已知有意内滚容器越界
（首页 `table.min-w-[560px]` 在 overflow-x-auto 内；/builder 节导航 `w-max` chip 条）。console 错误 0。
**无页面级溢出。**

### 2. 数据一致性（qa/r598-dangling.cjs）
R596 修复前的历史遗留状态——pipeline 条目 `resumeVersionId` 指向已被删除的副本——在 /jobs 与 /dashboard 的呈现：
/jobs 详情回落为「Target my resume」+ Next step「Create a resume targeted at this job」，无死链、无报错；
/dashboard 正常渲染。**悬空引用已被优雅处理，无需数据迁移。**

### 3. 竞品公开页（rezi.ai 首页 / ai-resume-builder / pricing，仅公开内容，web fetch 取证）
自 2026-08-29 R1 审计后 Rezi 公开页新增/强调：
- **MCP 服务器**（`api.rezi.ai/mcp`）：Claude Code / Codex / Gemini / Cursor / Grok / Lovable 一条命令接入，用自然语言管理与定向简历。
- 「Get an expert human review」（真人审阅）、Education Videos、AI Interview（$8 起）。
- 其余（Build/Score/Target 三支柱、23 项评分、AI 关键词、Summary writer、暗色模式、PDF+DOCX、Auto-Adjust 一页）RezUp 均已具备（代码核对：theme.ts 暗色、lib/docx.ts、autoFit、「Is this missing keyword relevant」）。

**结论**：MCP / 真人审阅 / 教学视频三项均以账号 + 云端数据为前提；RezUp 当前是「免注册、数据仅在浏览器」的差异化定位，
不能在单轮内实现。按 CHARTER 第 6 条列为**战略候选**，需老板决策是否引入账号体系（连带 Jobs pipeline 云同步）；不阻塞当前迭代。

### 4. 操作对等性（本轮唯一可即修的产品缺口）
| 销毁路径 | 确认 | 披露 | Undo |
|---|---|---|---|
| /dashboard 删除副本（单/批） | ✓ | ✓ | ✓ 10s |
| /dashboard 删除文档 | ✓ | ✓ | ✓ 10s |
| /builder Copies → Delete（R596 后） | ✓ | ✓ | **✗** |

同一操作在两处的可恢复性不一致；R596 弹窗写「permanently」与 dashboard 同文案，但 dashboard 实际有 10s Undo。

## 方案（仅 src/pages/Builder.tsx）
- `undoDeleteCopy: { version, index, wasActive } | null`，10s 自动消失（同 dashboard）。
- 确认删除后记录原位置与「是否正在编辑」；Undo = `restoreResumeVersion(version, index)`（lib 已有，原 id 原位）+
  若删除时正在编辑该副本且此后未打开别的副本，则 `linkVersion(version.id)` 恢复同步。share link 不恢复（弹窗已说会关闭）。
- Undo 条：copies 弹窗打开时渲染在弹窗内（Radix modal 会屏蔽外部点击），弹窗关闭后落到底部状态栏栈。

## 验收
- 删除已链接副本 → 弹窗内出现 `Deleted "…"` + Undo；点 Undo → 副本原 id 回到原位置，pipeline 链接自动恢复有效。
- 关闭弹窗后 Undo 条转为底部 toast，仍可 Undo。
- 375 无页面溢出；存储回基线；零 console 错误；零 AI。
