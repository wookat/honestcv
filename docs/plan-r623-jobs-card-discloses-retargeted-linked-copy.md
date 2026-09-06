# R623 — /jobs 职位卡对「已链接副本改指别的跟踪职位」两侧零披露

## 生产实证（index-CtWD6ZVq.js，qa/r623-evidence.cjs 1280）
副本 A 由职位 J 链接、`forJob=J`，但目标字段已改为跟踪职位 K（K 无副本）。

- J 卡 Next step：「Your targeted copy doesn't use any of this job's keywords yet — open it and add a few.」→ 用 J 的 JD 给一份
  已经不再瞄准 J 的副本算关键词匹配，结论失真；R616 在 dashboard/builder 已标出「now aimed at …」，/jobs 没有。
- K 卡 Next step：「Create a resume targeted at this job.」/「Target my resume」→ 不知道已有一份瞄准 K 的副本 A（只是它被 J 链接
  着，不算 R604 的 orphan）；用户会再造一份，或去 dashboard/builder 才发现。

## 方案（Jobs.tsx `nextStep`）
- 新 helper `copyAimedFromOtherJob(job)`：pipeline 中 `e.job.id !== job.id && e.resumeVersionId` 且该副本存在、
  `copyTargetsJob(copy.data, job)` → `{ copy, job: e.job }`。
- J 侧（有链接副本且 `targetRole` 非空且 `!copyTargetsJob(copy.data, J)`）：在关键词分支之前返回
  text「Your targeted copy “A” now points at Platform Engineer at Initech.」label「Open targeted resume」→ 既有 `targetResume(J,'keywords')`
  （builder Target job 区带 R616/R622 披露与动作）。
- K 侧（无链接副本、无 orphan、`copyAimedFromOtherJob(K)` 命中）：text「“A” is aimed at this job but is linked to “J” at Globex.」
  label「Open it to save a copy for this job」→ `targetResume(J,'keywords')`（打开 A，builder R622 一键「Save as new copy for it」）。
  卡片主按钮「Target my resume」（造新副本）不变。
- 不移动任何链接；对照：A 仍瞄准 J 时两卡文案不变。

## 验收（生产 1280 + 375）
- J 卡：文案 now points at；按钮 Open targeted resume → /builder 且 active=A。
- K 卡：文案 aimed at this job but linked；按钮 Open it… → /builder active=A、Target job 区出现「Save as new copy for it」。
- 对照（A 瞄准 J）：J 卡关键词文案、K 卡「Create a resume…」不变。无溢出、零 console 错误、零 AI 调用、存储回基线。
