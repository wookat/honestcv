# R641 — builder Target job：J 链接副本改指 K、K 已用另一副本时补「Save as new copy and use it for that job instead」（2026-09-06）

## 生产实证（index-DlbgP9dn.js，qa/r622-evidence.cjs other）

Seed：职位 J（qa-j1）链接副本 A（qa-copyA，编辑器打开）；A 的目标字段改指跟踪职位 K（qa-j2）；K 已链接副本 B（qa-copyB）。

Target job 区文案：

> That target is tracked job "Platform Engineer" at Initech, which already uses another copy. View it on the jobs board →

区内按钮仅 `["Target job (powers AI + ATS score)","Tailor to this job"]` —— R622 的「Save as new copy for it」只在 K 无副本时出现。K 有副本时用户在 builder 内无任何收口动作，只能去 jobs 板。

对照：dashboard Resume settings 对同一情形（R620/R638）在 J 链接副本上仍提供「Save as new copy」；jobs 卡（R636）/builder Target job 未链接副本（R637）/Resume settings 未链接副本（R638）/documents（R639）/dashboard-builder 副本行（R640）均已能原地换。这是 builder 侧最后一个「有事实无动作」的分支。

## 方案（Builder.tsx，`retargetedTrackedJob` 段）

按钮常驻，文案随状态：

- K 无副本：`Save as new copy for it`（不变）；
- K 用另一副本：`Save as new copy and use it for that job instead`。

动作同一 `saveDraftAsCopyFor(K)`：`createResumeVersion` → `setPipelineVersion(K, new)`（R619 盖 forJob）→ 编辑器切到新副本。不变量：A 仍是 J 的链接副本、字段如实保留（dashboard/builder 的「now aimed at」标签标出错位）；K 原副本 B 不删、保留 forJob=K，在 K 卡片成为 Earlier 行（R636）或副本行「uses another copy — use this one instead」（R640）可换回。

不做：不静默移动 A 的链接（仍需用户显式的新副本动作）；dashboard 同分支目前为「Save as new copy」（不链接 K），保持既有语义，列入候选轮评估是否对齐。

## 生产 QA（index-BjgGSr5Z.js，1280 + 375 × other/nocopy）

- other：按钮 `Save as new copy and use it for that job instead`；点击后 `qa-j1→qa-copyA, qa-j2→<new>`，三副本俱在（new.forJob=qa-j2，B 保留 forJob=qa-j2），active=new，文案变为「This copy is tailored to "Platform Engineer" at Initech」。
- nocopy 对照：按钮仍 `Save as new copy for it`，行为不变。
- 无横向溢出（375：360/375）；零 console 错误；API 仅 quota/billing，零 AI 调用；存储回基线。
- 部署：Worker/assets 上传成功；Routes API code 10000 依旧。
