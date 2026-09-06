# R640 — dashboard / builder copy note「reconnect it」原地重连（2026-09-06）

## 生产实证（index-Bn3Gx10U.js，qa/r640-evidence.cjs）

Seed：跟踪职位 qa-j1（Site Reliability Engineer @ Globex）；副本 B（qa-vB，forJob=qa-j1，目标字段匹配）未链接；`other` 模式另有副本 A（qa-vA）为 qa-j1 当前链接副本。

| 面 | 状态 | 行文案 | 可点控件 | 点击后 |
| --- | --- | --- | --- | --- |
| /dashboard Resume settings 行 | 职位无副本 | `… · tracked job has no copy linked — reconnect it` | 整句一个 Link | 跳 /jobs?job=qa-j1；pipeline 不变（qa-j1→-） |
| /dashboard | 职位用另一副本 | `… · tracked job uses another copy` | 仅 Link | 跳 /jobs?job=qa-j1；不变（qa-j1→qa-vA） |
| /builder Copies 弹窗 | 同上两态 | 同一 `CopyTargetNote` | 同上 | 同上 |

结论：「reconnect it」承诺了动作但只导航；「uses another copy」有事实无动作。与 R639 修前的 /documents 文档行完全同构。R636（jobs 卡）/R637（builder Target job）/R638（Resume settings 弹窗）/R639（documents）之后，这是副本关系图上最后一个只导航、不操作的面。

## 方案

共享 `CopyTargetNote` 增加必填 `onLinkToJob(jobId)`：

- 状态短语保留为职位 Link（`tracked job has no copy linked` / `tracked job uses another copy`）；
- 后接独立 button：`reconnect it` / `use this one instead` → `onLinkToJob(tracked.job.id)`。

宿主：

- Dashboard：`linkCopyToJob(versionId, jobId)` = `setPipelineVersion` + `applyVersions(listResumeVersions())`（pipeline memo 依赖 versions，随即重读）；失败置 storageError。
- Builder：同名 helper = `setPipelineVersion` + `setVersions(listResumeVersions())` + `setPipelineTick`（copiesPipeline / linkedJob 重读）；失败 `setStorageAlert(COPY_STORAGE_FULL_MSG)`。

不变量：只用既有 `setPipelineVersion`（R619 盖 forJob）；职位原链接副本不删、保留 forJob，其行翻转为「uses another copy — use this one instead」，可从任一行换回；不离开当前页。

## 生产 QA（index-DlbgP9dn.js，1280 + 375，dashboard + builder × unset/other）

- 控件：`["tracked job has no copy linked","reconnect it"]` / `["tracked job uses another copy","use this one instead"]`。
- 点击后 URL 仍为 /dashboard 或 /builder；stored `qa-j1→qa-vB`；`other` 模式 forJob 保持 `qa-vB:qa-j1, qa-vA:qa-j1`，A 行翻转为「uses another copy — use this one instead」。
- 无横向溢出（dashboard 375：360/375；builder 375：375/375）；零 console 错误；API 仅 quota/billing，零 AI 调用；存储回基线。
- 部署：Worker/assets 上传成功；Routes API code 10000 依旧（token 权限，不影响上线）。
