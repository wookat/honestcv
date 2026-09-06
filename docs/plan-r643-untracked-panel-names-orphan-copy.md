# R643 — 未跟踪职位面板「Written for this job earlier」补上孤儿目标副本（2026-09-06）

## 生产实证（index-C7F0W7hU.js，qa/r612-evidence.cjs copy）

Seed：真实职位 2091088 未跟踪；为它写过 cover letter + interview brief（forJob=2091088）；有一份孤儿副本「Sales Jedi — Creative Force」瞄准它。

面板：

> Reconnect targeted copy
> Written for this job earlier: Cover letter Creative Force — Cover letter Open, Interview prep Creative Force — Interview prep Open — saving this job links them again.

文档被点名并可 Open；副本只在按钮上以「Reconnect targeted copy」出现，名字不出现在任何地方——用户在保存职位前不知道会重连哪份副本（R589/R590：保存职位/任一状态芯片都会重连该副本）。文档侧与副本侧不对称。

## 方案（Jobs.tsx `writtenDocsNote`）

在同一句里先列副本：`targeted resume “<name>”`，再列文档；`items.length + (copy ? 1 : 0)` 决定 them/it；只有副本、没有文档时也显示。副本不给 Open 链接（打开副本会替换编辑器草稿，仍走主按钮 R595 确认弹窗）。`orphanTargetedCopy` 既有（forJob.id 优先、copyTargetsJob 兜底）。不改任何数据写入。

## 生产 QA（1280 + 375）

index-C-RldWYT.js。copy：「Written for this job earlier: targeted resume Sales Jedi — Creative Force, Cover letter … Open, Interview prep … Open — saving this job links them again.」；copyonly：「targeted resume Sales Jedi — Creative Force — saving this job links it again.」；docs（无副本）与 control 不变。1280/375 无溢出，零 console 错误，零 AI 调用，存储回基线。

## QA 基建修正

QA 浏览器此前只禁用了 HTTP cache；生产注册了 service worker（/sw.js），首访仍拿到旧 shell（curl 已是新 bundle）；SW 导航为 network-first，具体链路未定位，疑与 R607「需二次部署」同因（推断）。qa/lib.cjs 现加 `Network.setBypassServiceWorker`，QA 打印的 bundle 名以此为准。
