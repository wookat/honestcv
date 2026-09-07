# R529 — linkedJob 信息条在选中移走后仍谎称「Showing <该职位>」

## 一手证据（生产 CDP，2026-08-31，R528 上线后）
- 冷载 `?job=1749306`（过滤外在售）：信息条「Showing Freelance Copywriter at Coalition Technologies from your link — it doesn't match your current search.」+ 详情栏正确 —— R528 预期行为。
- 随后提交新搜索 `python`：URL 变 `?q=python`、详情栏自动回落到 list[0]（Senior React Full-stack Developer），但信息条原文原样保留，仍宣称「Showing Freelance Copywriter …」——用户看到的详情与状态条自相矛盾。点击其他行同理（selectedId 变更不清 notice）。
- 详情栏对 linkedJob 的操作（Target my resume / Cover letter / Apply / 状态按钮）经查全部在位，非缺口。

## 根因（src/pages/Jobs.tsx）
R528 的 `linkedJobNotice` 只在 Dismiss 时置 false；渲染条件 `linkedJobNotice && linkedJob` 与当前选中态无关，选中移走后状态条继续渲染旧文案。

## 方案（最小改动，仅 Jobs.tsx）
渲染条件加选中判定：`linkedJobNotice && linkedJob && selectedId === linkedJob.id`。选中移走即消失、点回该职位（如从 Tracked 或 URL）恢复显示，Dismiss 语义不变。不新增状态、不动 fetch/URL/R441/R528 回查逻辑。

## QA（生产，1280/375，错误监听，合成存储清理）
- 冷载过滤外在售深链：信息条在（R528 回归）。
- 新搜索提交后：信息条消失、无残留矛盾文案。
- 点击列表其他行：信息条消失；（若可）重选 linkedJob：恢复。
- Dismiss 后不再出现。死链 R441 警示回归。零溢出零 console 错误。
