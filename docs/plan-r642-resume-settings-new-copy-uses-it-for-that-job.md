# R642 — dashboard Resume settings：J 链接副本改指已有副本的职位 K 时「Save as new copy」也链接 K（2026-09-06）

## 生产实证（index-BjgGSr5Z.js，qa/r638-evidence.cjs linked）

Seed：职位 J（qa-j1）链接副本 v1；K（qa-j2）链接 vA；在 Resume settings 把 v1 的目标改成 K。

弹窗文案：

> The new target matches tracked job "Platform Engineer" at Initech, which already uses another copy — this one stays unlinked.

按钮 `["Cancel","Save as new copy","Save","Close"]`。「Save as new copy」不带 linkTo（R620 只在 K 无副本时传 K），新副本落为孤儿、与 vA 并列，用户需再到副本行点 R640 的「use this one instead」。builder 同分支 R641 已改为一键「Save as new copy and use it for that job instead」，两侧不对称。

## 方案（Dashboard.tsx，Resume settings footer）

`saveEditingAsNewCopy(editingMatchesTrackedJob?.job.id)` —— 只要新目标匹配某跟踪职位就链接它（既有 `setPipelineVersion`，R619 盖 forJob）。文案三态：

- 无匹配职位：`Save as new copy`；
- K 无副本：`Save as new copy for that job`（不变）；
- K 有副本：`Save as new copy and use it for that job instead`，提示改为「save these changes as a new copy and use it for that job instead」。

不变量：v1 仍是 J 的链接副本、字段不动（新副本承载改动）；vA 不删、保留 forJob=K，成为 K 的 Earlier 行 / 副本行「uses another copy — use this one instead」可换回。未链接副本分支（R638「Save and use this copy for that job instead」）不变。

## 生产 QA（index-C7F0W7hU.js，1280 + 375）

- linked：按钮 `Save as new copy and use it for that job instead`；点击后 `qa-j1→qa-v1, qa-j2→<new>`，new.forJob=qa-j2，vA 保留 forJob=qa-j2，v1 行回到「for Site Reliability Engineer at Globex」（未被改写），新行「for Platform Engineer at Initech」。
- unlinked 对照：按钮仍 `Save and use this copy for that job instead`，行为不变（qa-j2→qa-v1）。
- 375 弹窗 343px 宽可滚动、无溢出（360/375）；零 console 错误；API 仅 quota/billing，零 AI 调用；存储回基线。
- 部署：Worker/assets 上传成功；Routes API code 10000 依旧。
