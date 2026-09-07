# R618 — SOP-10 四维审计节点（距 R608 十轮）+ 被改指别处的副本不再凭过期 forJob 被错误重连（2026-09-06）

## 审计（生产 index-Db0SDsvd.js，零 AI 配额，零分享/支付/leads）

### 1. 响应式复扫（qa/r588-sweep.cjs，CDP 实测）
7 路由 × 1280/375：`scrollWidth === clientWidth === visualViewport.width` 全部成立；仅两个已知有意内滚容器越界
（首页 `table.min-w-[560px]`；/builder 节导航 `w-max` chip 条）。console 错误 0。**无页面级溢出。**

### 2. 竞品公开页（rezi.ai/features、/tools/job-search、/rezi-docs/job-search，web fetch 取证）
Rezi 新增「Job Search」产品面：1.3M 职位（公司官网直采）、Saved/Applied/Interviewing/Rejected 四阶段、
「Target Resume」从已有简历派生针对性副本、搜索结果可排除已 Saved/Applied/Rejected、Apply 跳公司官网（不代投）；
另有 Chrome Extension「auto-fill and apply」。RezUp 对应能力：跟踪阶段更细（含 offer/rejected + 时间线/备注/提醒）、
「Hide: jobs you are already tracking」过滤已有、Target my resume 已有；**新增差距候选**：Rezi 职位详情分节
（Responsibilities / Requirements / Skills / Salary / Benefits）——RezUp 目前整段 description，列入后续轮候选（需数据源支持，非本轮）。
Rezi 公开页仍**未见**副本↔职位↔文档关系的真伪披露，本专题继续是差异化。

### 3. 数据一致性
备份/恢复覆盖全部 honestcv.* 键；R617 后 dashboard/builder 对 active 副本的双写已收口。

### 4. 操作对等性 —— 本轮可即修缺口（生产实证 qa/r618-evidence.cjs）
`duplicateResumeVersion` 用 `{ ...source }` 派生，副本 **继承 forJob**；用户随后在 Resume settings 把副本 B 改指
职位 K（Platform Engineer @ Initech，未链接故 R616 不弹警告）。B 的 `forJob` 仍是 J（SRE @ Globex），而
CopyTargetNote / Jobs.orphanTargetedCopy / Builder.targetedTrackedEntry 三处都是 `forJob.id 优先 → 再按字段匹配`（R614）：

| 场景 | 生产实际 | 应当 |
|---|---|---|
| labels：J 链接 A；B 改指 K；K 已跟踪无副本 | dashboard B 行「targeted at Platform Engineer at Initech · **tracked job uses another copy**」→ 链到 **J（Globex）** | 「… · tracked job has no copy linked — reconnect it」→ 链到 **K** |
| reconnect：J 的链接悬空；仅有 B | J 卡片「Reconnect targeted copy」，弹窗「You already saved a copy … targeted at this job」→ 确认即把 **指向 Initech 的 B 链回 Globex 的 J** | J 应回落「Target my resume」（无为它准备的副本）；K 卡片继续 Reconnect B |

即 R614 引入的「forJob 优先」在「副本被明确改指别处」时反而制造 R613 想消灭的错误重连；且 K、J 两张卡片同时争抢同一副本。

## 根因
`forJob` 是不可变来源快照，但匹配逻辑把它当作**当前目标**；三处各自内联同一条优先级，没有共享的「来源是否仍有效」判定。

## 方案
`src/lib/jobs.ts` 新增两个共享 helper：
```ts
/** forJob 仍描述副本当前所指：目标字段仍匹配该职位；或虽有改动但同公司且没有别的已跟踪职位与之匹配。改指别的公司或别的已跟踪职位即失效。 */
export function copyKeepsProvenance(copy: { data: CopyTarget; forJob?: VersionJobRef }, pipeline): boolean
/** 副本所指的已跟踪职位：来源仍有效则取来源职位，否则取目标字段匹配的职位。 */
export function trackedJobOfCopy(copy, pipeline): PipelineEntry | undefined
```
替换三处内联优先级：
- `CopyTargetNote`：`tracked = trackedJobOfCopy(v, pipeline)`；「job no longer tracked — open it to save it again」只在来源仍有效时显示，否则「no tracked job — find it on the jobs board」（按当前 role 搜索）。
- `Jobs.orphanTargetedCopy(job)`：`orphans.find(v => v.forJob?.id === job.id && copyKeepsProvenance(v, pipeline)) ?? orphans.find(copyTargetsJob)`。
- `Builder.targetedTrackedEntry`：`trackedJobOfCopy({ data: { targetRole, targetCompany, jobDescription }, forJob: activeCopyJob }, pipeline)`；
  「that job is no longer tracked」回链同样以来源有效为前提。
- `duplicateResumeVersion` 保持继承 forJob（同目标的副本确为该职位而作，R594/R604 依赖）。
- 不改 `forJob` 本身（仍不可变），不静默重连。

## 验收
- labels：B 行链到 K 且文案「tracked job has no copy linked — reconnect it」；A 行不变；K 卡「Reconnect targeted copy」；J 卡「Open targeted resume」。
- reconnect：J 卡回落「Target my resume」；K 卡「Reconnect targeted copy」；B 行同上。
- control（未改指的重复副本 B'：forJob=J、字段=J）：行为与 R594 一致——「tracked job uses another copy」→ J；J 悬空时 J 卡 Reconnect B'。
- 1280+375 无页面溢出；存储回基线；零 console 错误；零 AI 调用。
