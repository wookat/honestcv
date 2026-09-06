# R530 — 从 Tracked/状态标签返回 All jobs 后桌面详情栏空置

## 一手证据（生产 CDP，2026-08-31，R529 上线后）
- 冷载 `/jobs?job=1749306`：详情栏正确显示 Freelance Copywriter。
- 点 Tracked 标签（选中职位未跟踪→selectedId 清空，R? 既有语义）再点回 All jobs：列表 5 行在，但详情栏只剩「Select a job to see the details.」空置占位，`main h2` 为空——与其他所有路径（首载、搜索、换类目）fetch 后自动选中 list[0] 的行为不一致。用户视角：来回切个标签，右栏内容凭空消失。
- 对照：Rezi 及同类职位板的 master-detail 布局在列表非空时始终保有选中项。

## 根因（src/pages/Jobs.tsx）
自动选中只发生在 fetchJobs 的 `setSelectedId(cur => … ?? list[0]?.id)`；标签切换（739-741 行）在选中职位不属于目标标签时 `setSelectedId(null)`，而返回 All 不触发重新 fetch，selectedId 保持 null，详情栏落入空占位。

## 方案（最小改动，仅 Jobs.tsx）
`selected` 派生处加渲染期回退：`selectedId === null` 且列表非空时回退 `shown[0]`（不写状态、不入 URL——explicitSelection 语义不变）。与 fetch 后自动选中 list[0] 的既有行为一致；搜索进行中的瞬时 null 也只是短暂显示旧 list[0]，与现状等价或更好。不动 fetch/URL/R528/R529 逻辑。

## QA（生产，1280/375，错误监听，合成存储清理）
- 桌面：冷载 /jobs → Tracked → All jobs：详情栏显示 list[0]（原空置）。
- 深链 ?job= 冷载详情正确（R528/R529 回归）；新搜索后信息条消失（R529 回归）。
- 375px：无 mobileDetail 时列表照常、无浮层误开；零溢出零 console 错误。
