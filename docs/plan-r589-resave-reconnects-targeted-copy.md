# R589 — 重新保存职位时重连已有的目标副本，而非再造一份（2026-09-06）

## 一手证据（生产 index-CjPZ6zOd.js，CDP，真实 Remotive 职位 2091088「Sales Jedi — Creative Force」，零 AI）
1. 种入：草稿（有内容）+ 目标副本 qa-v1「Sales Jedi — Creative Force」（data.targetRole/targetCompany 与职位一致，summary=「Tailored for this job」）+ pipeline saved → qa-v1。
2. 详情面板点 Saved → R587 弹窗如实披露副本断链，确认后 pipeline 为空、qa-v1 留在 dashboard。
3. 再打开同一职位点 Saved → 结果：
   ```
   versions: [ ["smej9hvx","Sales Jedi — Creative Force (2)","Draft resume with content for QA"],
               ["qa-v1",   "Sales Jedi — Creative Force",    "Tailored for this job"] ]
   pipeline: [ ["2091088","saved","smej9hvx"] ]
   ```
   新副本「(2)」由**通用草稿**生成并链到职位；用户已为该职位定制的 qa-v1 变成孤儿，「Target my resume」此后打开的是未定制的 (2)。
4. R587 弹窗文案「saving it again starts a new targeted copy」描述的正是这个行为——如实，但行为本身让定制成果失联并制造重复。

## 根因
`prepareTargetedCopy(job)` 无条件 `createResumeVersion(...)`；`setStatus('saved')` / `targetResume('target'|'keywords')` 仅检查 `linkedVersion(job.id)`（pipeline 上的链接），
不检查 dashboard 上是否已有一份**未被任何职位链接、且 targetRole/targetCompany 与该职位一致**的副本。

## 方案（最小改动，仅 src/pages/Jobs.tsx）
```ts
/** An unlinked saved copy already targeted at this job (e.g. left behind by untracking). */
const orphanTargetedCopy = (job) => {
  const linked = new Set(listPipeline().map((e) => e.resumeVersionId).filter(Boolean))
  return listResumeVersions().find(
    (v) => !linked.has(v.id) && v.data.targetRole.trim() === job.title.trim()
      && (v.data.targetCompany ?? '').trim() === job.company.trim())
}
prepareTargetedCopy(job):
  const version = orphanTargetedCopy(job) ?? createResumeVersion(`${title} — ${company}`, {...draft, target…}, 'Job applications')
  … 其余（upsert saved、setPipelineVersion）不变
```
- 覆盖所有调用方：Saved 状态、Target my resume、Add keywords。重连后「Target my resume」照旧 `saveResume(version.data)` 载入定制副本。
- 匹配条件严格（职位名+公司名精确相等且未被其他职位链接），不匹配时行为与现状完全一致（新建副本）。
- R587/R583 弹窗尾句同步改为如实描述新行为：
  - 单个：「The copy stays on your dashboard and reconnects if you save this job again.」（含文档变体：「…lose their link to this job; saving it again reconnects the copy.」）
  - 批量：「…; saving a job again reconnects its copy.」
- 不改删除/取消跟踪语义、不删数据、不动存储结构。

## 验证
- 本地 tsc/eslint(Jobs.tsx)/build/verify-dist。
- 生产 1280+375：同上脚本——取消跟踪后再 Saved：versions 仍 1 份、pipeline 重新指向 qa-v1、无「(2)」；弹窗文案更新；对照组：副本 targetCompany 不同（另一公司）时仍新建「(2)」；存储回基线；零 console 错误；零 AI。
