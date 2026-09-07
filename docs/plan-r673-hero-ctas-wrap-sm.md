# R673 — 首页 hero 双 CTA 行在 `sm`（640–767）加大文字间距后溢出整页：行允许换行

## 生产取证（2026-09-06，index-Bhsgxnfj.js，qa/r671-textspacing.cjs 640/1024、qa/r673-root.cjs）

R671 只在 375/1280 量过 WCAG 1.4.12 间距覆盖；补量 640（`sm` 首档，也是 1280 窗口 200% 缩放的等效 CSS 视口）与 1024：

- 640 `/`：加间距后 `scrollWidth 656 > clientWidth 625`（默认 625/625），十路由中唯一整页横滚。溢出根：`<a href="/ats-checker">`「Check my resume's ATS score」left 287 / right 656（`whitespace-nowrap`，R671 的 `max-sm:whitespace-normal` 在 ≥sm 不生效），父级 `flex flex-col … sm:flex-row` 双 CTA 行——两颗按钮并排后总宽超出 625。
- 640 其它 9 路由、1024 十路由：`scrollWidth === clientWidth`，新裁切仅 hero 装饰预览（与 R671 相同，有意）。

## 方案（最小改动）

`src/pages/Landing.tsx` hero CTA 行：`sm:flex-row` → `sm:flex-row sm:flex-wrap`。两颗按钮放得下时几何不变（`justify-center` 单行）；放不下时第二颗换到下一行居中，按钮本身不再需要折行。不改按钮尺寸、字号、`whitespace-nowrap`。

## 验收

- 本地：`npx tsc -b`、eslint Landing.tsx、`git diff --check`、`npm run build`、`node scripts/verify-dist.mjs`。
- 生产：`r671-textspacing.cjs 640` 十路由全部 `scrollWidth === clientWidth`、新裁切仅装饰预览；`r671-textspacing.cjs 375/1280` 与 R671 相同；`r673-root.cjs 640 /` 溢出根 0；默认排版 640/768/1280 两颗 CTA 几何与修前逐项相同（`r673-ctas.cjs`）；`r670-verify.cjs` 48 组对 R672 快照 0 差异；零 console 错误；存储回基线。
- 如实未验证：真实浏览器 200% 缩放（以 640 视口等效）；真机。

## 结果（index-Be73VzZf.js）

- `r671-textspacing.cjs 640`：十路由全部 625/625，新裁切仅 hero 装饰预览；`r673-root.cjs 640 /` 溢出根 0（修前 1：ATS CTA right 656）。375 十路由 360/360、新裁切 0，与 R671 相同。
- `r673-ctas.cjs` 默认排版 640/700/768/1280 两颗 CTA 几何 before/after 逐项相同。
- `r670-verify.cjs` 48 组对 R672 快照 0 差异；零 console 错误；`r671-store.cjs` 路由巡航后应用存储键不变（verifier 自身的 `theme` 写/删使原始 JSON 对比为 false，与 R671 时同因）。
