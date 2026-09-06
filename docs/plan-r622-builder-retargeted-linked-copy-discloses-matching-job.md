# R622 — Builder 里被跟踪职位 J 链接的副本改指跟踪职位 K 时，不披露 K、不给动作

## 生产实证（index-DsrxsPYE.js，qa/r622-evidence.cjs 1280，三组对照）
副本 A 由职位 J 链接，目标字段已改为 K（Platform Engineer @ Initech）。builder「Target job」区三种情形文案完全相同：

> This copy is tailored to "Site Reliability Engineer" at Globex, but its target fields now point at Platform Engineer at Initech. View it on the jobs board →

- K 是跟踪职位且无副本（nocopy）→ 应可一键为 K 存新副本（dashboard R620 已做「Save as new copy for that job」）
- K 是跟踪职位且用另一副本（other）→ 应如实说明，不给自动动作
- K 不是跟踪职位（untracked）→ 现状即可

即 R616 文案止步于「指向别处」，用户不知道「别处」就是自己正在跟踪的职位，也没有把 K 收口的路径；builder 与 dashboard 不对称。

另：R621 的「Link this copy to it」失败时用 `setCopyStorageError`（只在 Copies 弹窗渲染）→ Target job 区看不到，改为 `setStorageAlert`。

## 方案（Builder.tsx）
- `retargetedTrackedEntry`：`linkedJob` 存在且 target 不匹配 linkedJob 时，`listPipeline().find(e => e.job.id !== linkedJob.id && copyTargetsJob(target, e.job))`；依赖 pipelineTick / versions。
- 在 R616 句后追加：
  - hasCopy=false：「That target is tracked job "K" at Initech, which has no copy yet. **Save as new copy for it** · View it →」
    动作：`createResumeVersion(name=K.title — K.company, resume, folder=activeVersion.folder)` → `setPipelineVersion(K.id, new.id)`（forJob=K）→ `linkVersion(new.id)`（编辖继续在新副本上，A 保留在 J 名下、字段不动）→ tick。失败 `setStorageAlert`。
  - hasCopy=true：「That target is tracked job "K" at Initech, which already uses another copy. View it →」
- 不移动 J 的链接；普通继续编辑不受影响。

## 验收（生产 1280 + 375）
- nocopy：出现按钮；点击后 pipeline J→A、K→new；new.forJob=K；active=new；文案变为「This copy is tailored to "K" at Initech.」
- other：无按钮，追加「already uses another copy」；untracked：文案与现状一致、无追加。
- 无溢出、零 console 错误、零 AI 调用、存储回基线。
