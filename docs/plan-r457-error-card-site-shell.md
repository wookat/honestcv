# R457 — 路由错误卡带上站点导航壳

## 依据（R456 生产 QA 一手发现）
- RouteErrorBoundary 错误卡是 body 内唯一内容（~88 字符）：SiteHeader/SiteFooter 在各页面组件内部，boundary 替换掉整个路由元素时站点壳一并消失。
- 用户只剩 Reload 和浏览器 Back 两条出路，没有站内导航（Logo/Templates/ATS Checker/Jobs…）。

## 可行性
- `@/components/Layout` 是入口静态依赖（Layout-*.js 随 shell modulepreload，应用能启动它就已加载）——路由懒块失败不影响它可用。
- `SiteHeader`/`SiteFooter` props 全可选，空参即默认导航。

## 方案（仅 src/App.tsx）
- RouteErrorBoundary 错误分支渲染 `<SiteHeader />` + 现有错误卡 main + `<SiteFooter />`。
- 文案/按钮/role=alert/key={pathname} 行为全不变。

## 验证
- 本地 tsc/eslint/build；生产 QA：阻断路由块 → 卡上下有完整 header/footer，header 站内链接（如 Logo→/）可用且脱离错误态；R456 全回归（文案/Reload/back/直载/375 光暗/唯一 #main）；零逃逸、基线还原。
