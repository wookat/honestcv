# R456 — 路由懒块加载失败白屏 → 友好整页错误卡

## 生产实证（2026-08-31，CDP 一手证据）
- 阻断 `assets/Builder-*.js`（Fetch.failRequest）后从 `/` 客户端导航到 `/builder`：
  - 未捕获异常 `Uncaught TypeError: Failed to fetch dynamically imported module: …/Builder-SwDx_D4H.js`
  - React 卸载整棵树：`#root.innerHTML.length = 17`、`document.body.innerText = ""` —— **整页白屏**，零提示零恢复路径。
- 触发场景：弱网/断网中的站内导航；或旧标签页跨部署导航（入口 HTML 引用的旧 chunk 被新部署替换后 hash 变化）。
- App.tsx 只有 `<Suspense>` 无任何 error boundary；五个路由页全部 `lazy()`。

## 方案（仅 src/App.tsx）
- 新增 `RouteErrorBoundary`（class 组件，`getDerivedStateFromError`）包住 `<Routes>`（Suspense 之内）。
- 出错渲染整页友好卡：标题 + 文案 "This page failed to load — check your connection, then reload and try again."（R434 文案家族）+ `Reload page` 按钮（`location.reload()`；Chrome 对失败动态 import 做文档级缓存，刷新是可靠恢复，R434 同理据）。
- `key={pathname}`：路由变化即重挂 boundary，Back/前进等客户端导航可脱离错误态。
- 不改 worker、不改各页面、不加重试。

## 验证
- 本地：tsc、eslint、完整 build。
- 生产 QA（测试代理）：阻断 Builder/Jobs 路由块的客户端导航与直载 → 精确文案 + Reload 按钮、无白屏、无未捕获异常；解除阻断 Reload 恢复；正常导航/水合/375 光暗回归；基线字节还原。
