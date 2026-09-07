# R621 — Builder「Target job」区知道该副本瞄准的跟踪职位没有副本，却只给「去 jobs 板重连」的链接

## 生产实证（index-BLgPPDev.js，qa/r621-evidence.cjs 1280）
编辖中的副本 A（未被任何职位链接）目标字段与跟踪职位 K（无目标副本）一致：

> This copy is targeted at "Platform Engineer" at Initech, but that tracked job has no copy linked. **Reconnect it on the jobs board →**

点链接 → /jobs?job=K → 职位卡「Reconnect targeted copy」→ 确认弹窗 → 回到 builder。R620 已让 dashboard Resume settings
在同一判定下一步完成链接；builder 是唯一还在把用户送去别处的入口（R605/R609 的文案已如实，但动作缺位）。

对照：K 已使用另一副本时（「uses another copy · View it on the jobs board →」）不应给链接动作——抢链接必须在 /jobs 上
带披露地完成（R594 语义）。

## 方案（Builder.tsx）
- `linkedJob` 目前只依赖 `activeVersionId`，页面内改链接不会刷新；加 `pipelineTick` 状态进入依赖。
- 「has no copy linked」分支：链接文案改为按钮 **Link this copy to it**（`setPipelineVersion(K.id, activeVersionId)` →
  R619 顺带 forJob=K；失败走 `setCopyStorageError`），成功后 `setVersions(listResumeVersions())` + tick，段落切换为
  既有的「This copy is tailored to "K" at Initech. View it on the jobs board →」。保留「View it on the jobs board →」链接。
- 「uses another copy」分支不变。

## 验收（生产 1280 + 375）
- nocopy：按钮存在；点击后 K→A、A.forJob=K、文案变为 tailored to；无弹窗、零 AI 调用、零 console 错误。
- other：无按钮，文案不变。
- 无页面级溢出、存储回基线。
