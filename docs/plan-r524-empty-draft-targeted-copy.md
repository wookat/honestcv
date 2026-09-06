# R524 — 空白草稿不再生成空的“targeted resume”副本

## 一手生产证据（cv.zalize.com，CDP 实测 2026-08-31）

全新存储（无 `honestcv.resume`，从未建过简历）：

1. /jobs 选中 "Senior React Full-stack Developer — Lemon.io"，点「Target my resume」。
2. 确认弹窗文案：“This saves a copy of your resume targeted at this posting…”——但用户根本没有简历。
3. 点「Create copy and open editor」→ `honestcv.resumeVersions` 出现名为
   "Senior React Full-stack Developer — Lemon.io"、folder "Job applications" 的副本，
   内容是完全空白的 emptyResume；/builder 打开的是空编辑器（首跑空态）。
4. 同根因：详情面板点「Saved」跟踪职位时 `setStatus('saved')` 也会静默
   `prepareTargetedCopy` —— 同样产出一份空白“targeted copy”，用户无任何感知。

后果：用户 dashboard 的 Job applications 文件夹里出现一份以职位命名、
号称 targeted 实为空白的简历副本；弹窗宣称“copy of your resume”不诚实。
对照 Rezi：Automated Targeted Resumes 明确要求先有已上传简历才生成 targeted 版本。

## 方案（最小修复）

新增 `resumeHasContent(r)`（src/lib/resume.ts）：基于既有
`resumeToPlainText(r).trim() !== ''` —— 该函数只汇聚用户内容
（联系人、各 section），不含 targetRole/JD/模板设置，空草稿输出为空串。

Jobs.tsx 三处：

1. `setStatus('saved')` 的自动 `prepareTargetedCopy` 增加内容前置条件：
   草稿无内容时只跟踪职位、不再静默生成空白副本
   （既有 nextStep 空缺提示 “Create a resume targeted at this job.” 自动接管后续）。
2. `targetResume(job,'target')`：无既有 linked copy 且草稿为空时，
   不建副本——复用 cover 分支的做法把草稿对准该职位
   （targetRole/targetCompany/jobDescription + syncActiveVersion）并打开 /builder。
3. 确认弹窗（intent=target、无 linked copy、草稿为空）改为诚实文案：
   说明简历还是空的、没有可复制的内容；主按钮改为 “Start my resume for this job”。
   之后简历有内容再点 Target my resume 走原路径生成副本。

## 非目标

- 不做自动生成简历内容、不动 AI。
- 不改 prepareTargetedCopy 本身、不动已有 linked copy 的打开路径。
- 不清理历史上已产生的空白副本（用户数据不做迁移删除）。
- 不改 cover letter / interview prep 分支（它们只对准草稿，不复制副本）。

## 验证

- npx tsc -b；npx eslint src/pages/Jobs.tsx src/lib/resume.ts；npm run build；npm run verify-dist。
- 生产 QA：空草稿点 Target my resume → 新文案+Start 按钮 → /builder，
  versions 零新增；空草稿点 Saved → 跟踪成功且 versions 零新增；
  有内容草稿（加姓名/summary）→ 原文案原路径、副本内容非空；
  已有 linked copy 回归 “Open targeted copy”；375px 零溢出零 console 错误；QA 后清理存储。
