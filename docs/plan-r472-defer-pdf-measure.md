# R472 — /builder 冷加载不再抢跑 407KB PDF 引擎（长度计量推迟到空闲）

## 一手证据（生产 Lighthouse，2026-08-31）

- 首页移动 perf 0.92 / 桌面 1.0，a11y/BP/SEO 全 1.0 —— 首页已接近饱和。
- **/builder 移动 perf 0.53**：LCP 4.4s、FCP 3.2s、TBT 1330ms、TTI 5.3s。
- unused-javascript 首项：`/assets/pdf-DemTFi6V.js` 总 402,933B 传输、其中 192,400B 未用；
  network-requests 证实 /builder 纯冷加载（零点击）即下载该 407KB 块。
- sourcemap（source-map-explorer）证实 pdf 块内容：pdfjs-dist 481KB、fontkit 227KB、
  @pdf-lib/standard-fonts 123KB、brotli 字典 69KB 等 —— 是全站最大的 JS 资产。

## 根因

`usePdfLength()`（Builder.tsx）在挂载后固定 800ms 就 `import('@/lib/pdf')` 做
长度计量（预览旁的页数/长度表）。移动端 4x CPU 下 800ms 仍处于启动关键窗口：
下载 + 解析 + 执行 400KB 级引擎与首屏渲染、水合、TTI 直接竞争。

R458 的 loadExporter 懒加载只覆盖用户点击下载的路径；这条是挂载自动触发的测量路径。

## 方案（最小改动）

仅改 Builder.tsx `usePdfLength`：首次测量前先等「window load 完成 + 主线程空闲」
（requestIdleCallback，兜底 setTimeout），之后的防抖测量不变（模块已缓存，
re-import 零开销）。不改 lib/pdf、不改任何下载路径、不改 UI。

预期：/builder 启动窗口内零 pdf 块请求，TBT/TTI 显著下降；长度表稍晚出现
（原本就是 800ms 后异步出现的占位场景，无布局跳动——meter 区域已有骨架/空态）。

## 验证

- npx tsc -b；npx eslint src/pages/Builder.tsx；npm run build；node scripts/verify-dist.mjs。
- 部署后 Lighthouse /builder 移动复测（perf/TBT/TTI/unused-js）。
- 独立生产 QA：冷加载启动窗口零 pdf 块请求、空闲后长度表照常出现且数值正确、
  下载 PDF/DOCX 照常、R468/R469 快捷键回归、375 光暗零溢出、存储字节级还原。
