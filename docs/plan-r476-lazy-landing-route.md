# R476 计划：Landing 路由改为 lazy，首页专属代码离开入口块

## 证据（一手，2026-08-31）
- R475 部署后 Lighthouse /builder（移动模拟）：perf 0.52、FCP 3.1s、LCP 4.7s、TBT 1350ms、TTI 5.2s；bootup-time 显示入口 index-B05VyYW2.js 脚本执行 ~2.5s，是 TBT 主因。
- 本地同 commit sourcemap 逐段归因（/tmp/dist-r475b）：入口 371,132B 中
  - react-dom 178,376B（不可避免）
  - **src/pages/Landing.tsx 35,899B** —— 仅首页使用，却是 App.tsx 里唯一 eager 的大路由
  - react-router(prod) 35,297B、tailwind-merge 27,101B（全局依赖）
  - ResumePreview 24,662B、templates.ts 7,974B、extractFile.ts 5,934B、ScoreRing/TemplateThumb 等 —— 全部经由 Landing 的静态 import 被拖进入口（ResumePreview/templates 另被 Builder/Dashboard/SharedResume 使用，属共享）。
- App.tsx：Builder/AtsChecker/Dashboard/Jobs/SharedResume 全部 lazy()，唯 Landing 与 NotFound eager。每个非首页路由（含最重的 /builder）都在启动关键路径上解析执行首页营销代码。

## 根因
Landing eager 是历史初始结构，非性能决策；首页有完整预渲染 HTML（main.tsx 对 / 走 hydrateRoot），并不依赖 Landing 在入口内同步可用。React 18+/19 对 Suspense 内 lazy 组件的水合行为：服务端已渲染的 HTML 在 chunk 到达前原样保留（dehydrated boundary），不会闪回 fallback。

## 方案（最小改动）
src/App.tsx 一行：`import Landing from "@/pages/Landing"` → `const Landing = lazy(() => import("@/pages/Landing"))`。
- NotFound 保持 eager（1.6KB，404 shell 水合需要）。
- 既有 RouteErrorBoundary + RouteFallback 天然覆盖新 lazy 路由（R456/R457 错误卡族）。
- 预期：入口减 ~36KB（Landing）+ 首页专属 UI；ResumePreview/templates/extractFile 移入共享 chunk，仍被 Builder 等按需并行加载，不在入口关键路径。

## 实施中发现的必要配套（本地负例实证）
1. entry-server 用 renderToString 时，lazy(Landing) 在服务端 suspend → 预渲染出的 index.html 变成 RouteFallback 骨架而非 hero HTML（本地 grep 实证），首页 SEO/LCP 直接回退。配套改为 react-dom/static 的 prerenderToNodeStream（等待全部 lazy 解析后输出完整 HTML），prerender.mjs 增加 `aria-busy` 泄漏即构建失败的门禁。
2. 首页水合需要 Landing chunk——prerender.mjs 给 index.html 注入 `<link rel="modulepreload" href="/assets/Landing-*.js">`，与入口并行下载，避免串行瀑布。
3. 本地 CDP 负例：Fetch 拦截把 Landing chunk 扣住 3s——hero HTML 全程保留不闪骨架（dehydrated boundary 行为实证）；彻底阻断则落入 R456 错误卡（诚实失败）。

## 非目标
- 不拆 Builder.tsx（246KB，另一轮）。
- 不动 main.tsx 的水合判定逻辑、不动路由语义。

## 验证
1. 本地：tsc -b、eslint src/App.tsx、npm run build、verify-dist；对比新入口 sourcemap 归因（Landing 应消失）。
2. 必测风险点：首页预渲染 HTML 水合——chunk 到达前内容不得闪回骨架（对照 dehydrated boundary 行为），慢网下首页无 CLS/内容消失。
3. 部署 npm run deploy 后生产 QA：/ 水合零 console 错误、内容连续；/builder 冷加载不再请求 Landing 代码；SPA 全路由导航、R456 错误卡、R468/R469/R474/R475 回归、375 光暗、零逃逸、存储字节还原。

## 诚实边界
- /builder TBT 改善幅度以部署后 Lighthouse 实测为准；react-dom 仍占入口近半，收益有上限。
