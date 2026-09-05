# R503 — /jobs URL 不再把自动选中的职位写进 ?job=

## 一手证据（生产 2026-08-31）
- CDP 全新加载 `https://cv.zalize.com/jobs`（零交互）：加载完成后 URL 被 replaceState 改写为 `/jobs?job=1749306`——用户从未点击任何职位，第一条职位的 id 已进 URL。
- 仅改排序（Sort→newest，仍零职位点击）后 URL 为 `/jobs?sort=newest&job=1749306`。
- 源码根因：Jobs.tsx fetch 回调在无有效选中时回落 `setSelectedId(list[0]?.id)`（自动选中喂桌面详情栏），而 URL 同步 effect 对 `selectedId` 无差别写 `job` 参数。
- 后果链（均为既有已上线行为）：
  - 分享/收藏"职位列表"URL 永远携带一个用户没选过的瞬态职位 id；
  - R407 起 `?job=` 深链在移动端打开详情浮层——桌面复制的列表链接在手机上强行盖一个发送者从没点过的职位；
  - 上游职位过期后，R441 的"dead ?job= deep link"警示会对一个用户从未主动构造的 URL 触发。

## 方案（仅 Jobs.tsx）
- 新增 `explicitSelection` ref：seed 自 `?job=` 深链为 true；行点击置 true；fetch 回落自动选中 list[0] 时置 false。
- URL 同步 effect 改为 `selectedId && explicitSelection.current` 才写 `job` 参数（ref 变化总是伴随 selectedId 变化，effect 必然重跑）。
- 详情栏行为零改动：自动选中仍然发生，只是不再进 URL。

## 非目标
- 不改移动端 `?job=` 深链语义（R407）；不改 dead-link 警示（R441）；不改搜索/筛选/排序参数持久化（R312）；不动 worker。

## 验证
- tsc、eslint（单查 Jobs.tsx）、全仓 lint、build、verify-dist。
- 生产 QA：零交互冷载 URL 保持 `/jobs`；改排序/筛选 URL 无 `job`；点击行后 URL 带 `job=<id>`；`?job=` 深链回归（桌面选中 + 移动浮层）；375px 零溢出零 console 错误。
