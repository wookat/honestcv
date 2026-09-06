# R548 — 刷新页面不再丢失滚动位置（reload scroll restore）

## 一手证据（生产 CDP，2026-08-31）
- 375×812 与 1280×900，/builder 滚到 1200 → Page.reload → scrollY=0（docH 5234/3660，`history.scrollRestoration === 'auto'`）。
- 375×812，/jobs、/documents、/dashboard、/ats-checker 滚到 800 → reload → 全部 scrollY=0。
- 即：全站任何路由刷新都回到顶部，用户在长表单/长列表中的位置全部丢失。

## 对照
Rezi changelog（2026-08 Week 4）：「Seamless Messaging Navigation: Navigate to messages or refresh the page without losing your place.」——刷新不丢位置是竞品明确交付的能力。

## 根因
SPA 首帧是预渲染骨架（高度小），路由 chunk lazy 加载后 React 整体替换 DOM。浏览器原生 scroll restoration（auto）在恢复时机找不到足够高度/锚点，随 DOM 替换放弃，最终停在 0。

## 方案（最小改动，仅 src/App.tsx）
新增 `ReloadScrollRestore`（与 ScrollReset 并列挂载）：
- `pagehide` 时把 `window.scrollY` 按 `honestcv.scroll:<pathname>` 写入 sessionStorage。
- 挂载时仅当 `performance.getEntriesByType('navigation')[0].type === 'reload'` 且无 hash：读取本 pathname 的存储值 y>0 → rAF 重试（上限 ~3s）等待 `scrollHeight >= y + innerHeight` 后 `scrollTo(0, y)`；期间监听一次 wheel/touchstart/keydown，用户先动则放弃恢复；用后删键。
- 普通 push/replace/back-forward 导航零改动（ScrollReset/浏览器原生语义不变）。

## 非目标
- 不持久化 Builder mobilePane 等组件状态（候选 R549）。
- 不改 ScrollReset、R531/R532/R533 滚动语义。

## 验证
tsc / 单查 eslint / build / verify-dist；生产 QA：375+1280 /builder 滚 1200 → reload → 恢复 ~1200；/jobs 滚 800 → reload → 恢复；hash 路由与普通导航回归；零溢出零 console 错误；QA 后存储清理（sessionStorage 键随会话消失）。
