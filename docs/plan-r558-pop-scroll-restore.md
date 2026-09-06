# R558 — SPA Back/Forward 恢复滚动位置

## 一手生产证据（2026-08-31，CDP）
- 1280×900 /dashboard 滚到 1432 → 点「Career documents」SPA 链接 → 浏览器 Back：落在 330（2/2 复现），不是 1432。
- 375×812 同流程恢复正确（1500→1500）——因为移动端 /dashboard 首帧就有 5868px 高。
- 根因：懒加载路由块 + 异步内容让 POP 时刻文档还很矮，浏览器原生恢复被 clamp 到当时的最大可滚动值（2332-900≈1432 本应可行，但恢复发生在内容长高之前，只到 330）。R548 只修了 reload 场景，POP 仍交给原生恢复。
- 对照 Rezi 8 月 Week4：「navigate to messages or refresh the page without losing your place」——刷新与站内导航都不丢位置。

## 缺口
桌面端任何内容异步长高的路由（/dashboard 最明显），浏览器 Back/Forward 都会把用户丢在半路。

## 最小方案
仅 src/App.tsx：ScrollReset 改为完整的滚动管理——`history.scrollRestoration='manual'`；用 sessionStorage 按 location.key 存每个历史条目的 scrollY（离开该条目时保存）；POP 且无 hash 时用 R548 同款 rAF 重试（≤3s，等高度足够，用户先滚动即放弃）恢复该 key 的保存值；push/replace 保持回顶。ReloadScrollRestore（R548）与 R531/R532 /jobs 哨兵（raw pushState，不经 router）零改动。

## 非目标
不动 /jobs 哨兵逻辑；不动 Builder pane 滚动（R533/R535/R540）；不做跨会话持久化（sessionStorage 即可）。

## QA 中发现的第二根因（2026-08-31 补充）
- 首版上线后移动端 forward → /documents 落在页底（814）而非 0。CDP 逐层实证（scroll 事件日志 + scrollTo/sessionStorage.setItem 打点 + history.state 检查）：forward 后 history.state 为 null——Dashboard/Builder/Jobs 的 URL 同步用 `history.replaceState(null, …)` 把 React Router 写入的 entry state（含 location.key）整个抹掉，该历史条目的 key 塌缩回 "default"，与初始条目同 key → key 不变、effect 不触发，且恢复目标错读成 dashboard 的 1500（文档页高度不够 → rAF 等 3 秒放弃 → 停在 clamp 底部）。
- 补充修复：八处 `replaceState(null, …)` 全部改为 `replaceState(window.history.state, …)`，保留 router entry state；/jobs 哨兵与 useHistoryGuard 的 pushState（有意新建条目、popstate 前拦截）零改动。
