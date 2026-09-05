# R477 — 移动端不再渲染隐藏的 Preview & score 面板

## 审计证据（一手）

- R472/R476 银行项：/builder 启动主导成本是入口块脚本执行（Lighthouse bootup `index-*.js` ~3.16s，大头是 react-dom 渲染整棵 Builder 树）。
- 生产 CDP 实证（2026-08-31，`~/audit-r1/r477_mobilepane.py`）：
  - 375×812 移动视口冷加载 /builder：`#preview` 面板 **883 个 DOM 节点 / 108,375 字节 innerHTML**，`getComputedStyle(#preview).display === 'none'`；`#main` 共 1,546 节点 —— **57% 的主区节点被 React 完整渲染后用 CSS 藏起来**（`hidden lg:block`，Builder.tsx:6958）。
  - 1440 桌面视口同一面板 883 节点、display:block（桌面两栏并排，渲染是必要的）。
- 该隐藏面板包含全站最重的子树：模板选取器（缩略 ResumePreview 网格）、设计控件、ATS Score 卡、完整分页 ResumePreview（R474 的测量 effect 在隐藏态下对 display:none 元素测量，clientWidth=0）。
- 移动端默认 `mobilePane === 'edit'`（Builder.tsx:1267），首屏用户根本看不到这个面板；Lighthouse 移动跑分（perf 0.52 / TBT 1350–1450ms）承担了它的全部渲染成本。
- Rezi 对照：其移动端 builder 编辑视图不渲染完整分页预览（预览是独立视图）。
- 当日复测 R476 遗留观察项：/builder FCP 2.8s / LCP 4.8s / TBT 1450ms（基线 3.1/4.7/1350）——R476 后 FCP/LCP 未劣化，当日方差主导，观察项闭合。本轮 LCP 样本曾捕获到打开的 first-run 向导对话框为 LCP 元素，属状态污染，不作为干净基线。

## 选定缺口

移动端（<lg）冷加载渲染 883 个不可见节点：纯浪费的启动脚本执行 + 内存，直接对应 TBT/可交互延迟。

## 最小实现（仅 src/pages/Builder.tsx）

1. `useIsLgViewport()`：`matchMedia('(min-width: 64rem)')`（Tailwind v4 lg 断点），带 change 监听。
2. 门控右栏内容：`renderPreviewPane = isLg || mobilePane === 'preview' || printArmed || previewSeen`；外层 `div#preview` 保留（锚点/布局语义不变），仅门控其 children。
3. 打印安全（打印 CSS 只显示 `[data-resume-preview]` 子树，index.css:288）：`beforeprint` 监听器里 `flushSync(() => setPrintArmed(true))`，同步挂载后再出打印快照——覆盖 Ctrl+P 与站内两个 `window.print()` 按钮。
4. 首次显示后闩住（`previewSeen`）：切回 Edit 不卸载，保持与旧语义（常驻挂载）最接近，避免来回切换的重复挂载测量。
5. R231 关键词高亮 effect（Builder.tsx:1508 已 null-guard `previewWrapRef`）：deps 追加挂载门控，防「已开高亮但面板后挂载」漏画。

## 非目标

- 不动 usePdfLength / PDF 引擎下载策略（score 的页数检查仍需它）。
- 不动桌面行为（lg+ 恒渲染）。
- 不动模板对比对话框里的第二个 ResumePreview。
- 不做 Builder 树的其他组件级拆分。

## 验证

- 本地：`npx tsc -b`、`npx eslint src/pages/Builder.tsx`、`npm run build`、`node scripts/verify-dist.mjs`。
- 部署：`npm run deploy`（完整链）。
- 生产 QA：
  - 375：冷加载 `#preview` 零子节点；切 Preview & score → 面板完整、分页测量正确、ATS 分数与切换徽章一致；切回 Edit 不卸载。
  - 375 Edit 态直接 window.print()/Ctrl+P → 打印快照含简历（beforeprint 挂载生效）。
  - 桌面 1440：两栏并排照旧、关键词高亮、R474 分页、R468/R469 快捷键回归。
  - 视口跨断点 resize（375→1440）后面板出现。
  - Lighthouse /builder 移动复测（如实记录，方差声明不变）。

## 预期收益边界（诚实）

移动端启动少渲染 ~57% 主区节点，方向上降 TBT/脚本执行；量化以部署后 Lighthouse 为准，网络/CDN 方差无法消除，不预先承诺数值。桌面无变化。
