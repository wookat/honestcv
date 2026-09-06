# R590 — 孤儿目标副本在 Cover letter / Interview prep / 其他状态入口与确认弹窗中的一致处理（2026-09-06）

## 一手证据（生产 index-BY6J6j0c.js 含 R589，真实职位 2091088，零 AI）
1. 种入：孤儿副本 qa-v1「Sales Jedi — Creative Force」（targetRole/targetCompany 与职位一致，未被任何 pipeline 条目链接）+ 有内容的通用草稿 + 空 pipeline。
2. 详情面板点「Cover letter」→ 弹窗文案：「This sets the job title and description on your **current draft** … It replaces the draft's current target job … The job is saved to your tracked applications so the letter stays linked to it.」
   即：求职信将基于通用草稿而非用户已定制的副本；确认后（代码 `targetResume(job,'cover')` else 分支）草稿被改写目标、职位入库 saved 但 `resumeVersionId` 为空，qa-v1 继续孤儿。截图 qa/shots/r590/01-after-cover-1280.png。
3. 代码复核（R589 遗漏）：`confirmTarget` 弹窗 target/keywords 分支在无 linkedVersion 时仍显示「This saves a copy of your resume … / Create copy and open editor」或「Your resume is still empty … nothing to copy yet」，而 R589 后实际行为是重连 qa-v1——文案与行为不一致（如实披露原则）。
4. `setStatus(job,'applied'|'interviewing'|…)` 对未跟踪职位直接入库时不重连孤儿副本（R589 仅在 saved 分支调用 prepareTargetedCopy）。
5. `openInterviewPrep` 同 cover：无 linkedVersion 时改写草稿。

## 方案（仅 src/pages/Jobs.tsx）
```ts
/** The job's linked copy, or an orphan copy already targeted at it. */
const targetedCopyOf = (job) => linkedVersion(job.id) ?? orphanTargetedCopy(job)

setStatus(non-none):
-  if (status==='saved' && !linkedVersion && (orphan || hasContent)) prepareTargetedCopy(job)
+  if (!linkedVersion && (orphan || (status==='saved' && hasContent))) prepareTargetedCopy(job)   // 任何状态都重连孤儿；仅 saved 才新建

targetResume(cover) / openInterviewPrep:
-  const version = linkedVersion(job.id)
+  const version = targetedCopyOf(job)
   if (version) { saveResume(version.data); setActiveVersionId(version.id) } else { …aim draft… }
   …upsert saved（cover）…
+  if (version && !linkedVersion(job.id) && tracked) applyPipeline(setPipelineVersion(job.id, version.id))

confirmTarget 弹窗：linkedVersion→ 现文案；否则 orphan→
  cover: 'This opens the resume copy you already targeted at this job in the editor and links it to this job again, then opens the cover letter tool pre-filled for this company. Your other resumes keep their own target jobs.'
  target/keywords: 'You already saved a copy of your resume targeted at this job — the editor opens that copy and links it to this job again. Your other resumes keep their own target jobs.'  按钮 'Reconnect targeted copy'
```
- 不新建、不删除任何副本；匹配规则沿用 R589（精确职位名+公司名、未被链接）。

## 验证
- tsc/eslint(Jobs.tsx)/build/verify-dist。
- 生产 1280+375：孤儿副本 + Cover letter → 弹窗新文案；确认后草稿 summary 变为副本内容、activeVersionId=qa-v1、pipeline saved→qa-v1、URL /builder?doc=cover…；无「(2)」。Target my resume 弹窗显示 Reconnect 文案。Applied 直接入库 → pipeline applied→qa-v1。对照：无孤儿时文案/行为同现状。存储回基线、零 console 错误。
