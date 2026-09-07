# R591 — Cover letter / Interview prep 不再就地改写草稿（避免把正在编辑的目标副本 A 静默改指向职位 B）（2026-09-06）

## 一手证据（生产 index-CRU121oZ.js 含 R590，真实职位 A=2091088 Sales Jedi@Creative Force，B=1185979 Freelance Writer@IAPWE，零 AI）
种入：副本 qa-vA（targetCompany=Creative Force）链到职位 A；草稿=qa-vA 内容且 activeVersionId=qa-vA（即用户正在编辑器里编辑 A 的目标副本）。
- 在职位 B 点「Cover letter」→ 弹窗：「This sets the job title and description on your current draft … It replaces the draft's current target job, if any.」确认后：
  ```
  versions: [["qa-vA","Sales Jedi — Creative Force","Tailored for job A","IAPWE"]]   ← 副本 A 的 targetCompany 被改成 B 公司
  pipeline: [["1185979","saved",null],["2091088","saved","qa-vA"]]                  ← 职位 A 仍链到已被改指向 B 的副本
  active: qa-vA
  ```
  `targetResume(job,'cover')` else 分支 `saveResume(next); syncActiveVersion(next)` 把改写后的草稿回写进活动副本 A：A 的 ATS 分/关键词匹配/AI 定制此后都对着 B 的 JD，而 dashboard 与 tracked 列表仍显示它是 A 的目标副本。用户无感知。
- 对照：同状态下点「Target my resume」走 `prepareTargetedCopy` 新建副本 B 并激活，A 完好（targetCompany 仍 Creative Force）。

## 根因
cover / interview 入口在「该职位无副本」时沿用早期「就地改写草稿」语义，未考虑草稿可能就是某个已链接副本（activeVersionId）。

## 方案（仅 src/pages/Jobs.tsx）
```ts
targetResume(job,'cover') / openInterviewPrep(job):
-  const version = targetedCopyOf(job)
+  const version = targetedCopyOf(job) ?? (resumeHasContent(draft) ? prepareTargetedCopy(job) : null)
   if (version) { saveResume(version.data); setActiveVersionId(version.id) } else { …aim empty draft（无内容时无可复制，行为不变）… }
```
- 有内容 → 与 Target my resume 一致：新建副本 B（Job applications 文件夹）、链到 B、激活 B、进入编辑器；副本 A 及其链接原样保留。
- 草稿为空 → 保持现状（就地设目标，不新建）；此时 syncActiveVersion 仅在草稿为空副本时回写，不构成定制成果丢失。
- 弹窗 cover 分支新增「有内容且无副本」文案：「This saves a copy of your resume targeted at this posting (filed under “Job applications” on your dashboard), opens it in the editor, then opens the cover letter tool pre-filled for this company. Your other resumes keep their own target jobs.」空草稿文案不变。

## 验证
- tsc/eslint(Jobs.tsx)/build/verify-dist。
- 生产 1280+375：同上场景 → versions 含新副本「Freelance Writer — IAPWE」（targetCompany=IAPWE）且 qa-vA.targetCompany 仍 Creative Force；pipeline B→新副本、A→qa-vA；active=新副本；弹窗新文案；空草稿对照（无副本、草稿空）行为同现状；存储回基线、零 console 错误。
