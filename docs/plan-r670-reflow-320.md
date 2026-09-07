# R670 — 320px 回流（WCAG 1.4.10 Reflow）：builder 页头把「Menu」推出视口、角色操作行与首页 CTA 溢出

## 缺口（生产一手证据，index-DE-3CXPP.js，2026-09-06）

`qa/r670-reflow.cjs` 以 320×640（= WCAG 1.4.10 规定的 320 CSS px，也等于 1280 桌面 400% 缩放）扫 16 条路由，读 `scrollWidth` 与越过 `clientWidth` 的非 fixed 元素：

| 路由 | scrollWidth / clientWidth | 越界根元素 |
|---|---|---|
| `/builder` | **356 / 305** | 页头右侧组 `flex items-center gap-1`（left 98 → right 348：主题 40 + 历史/助手/已保存/下载 170 + Menu 40）；角色 1 操作行 `ml-auto flex shrink-0 items-center`（7×38 = 266，right 312） |
| `/` | **306 / 305** | 首屏 CTA「Check my resume's ATS score」`whitespace-nowrap` 307px，父容器只有 273px |
| 其余 14 条 | = clientWidth | 无（/pricing 与首页定价表在各自 `overflow-x-auto` 容器内，属 1.4.10 允许的二维内容） |

`qa/r670-builder320.cjs` 截图（`qa/shots/r670-builder-320.png`）：320 宽下页头只剩到「下载 ▾」按钮被切半，**主题切换与「Menu」（移动端唯一导航入口）整段在视口外**，只能横向滚动整页才能碰到；360 宽（Galaxy S 系）经典滚动条下 clientWidth 345 时同样越界（right 348）。375 宽下页头 right 348 < 360 不受影响。

角色操作行：`w-max` 分区导航（Contact…Custom）在自己的横向滚动容器内不算；但 7 个 38px 图标按钮在 `shrink-0 ml-auto` 下 320 宽时超出卡片 8px，整页出现横向滚动。

## 为什么不是伪影 / 豁免

- 1.4.10 只豁免需要二维布局的内容（表格、图、工具栏 **在自己的滚动容器内**）。页头按钮组与卡片操作行不是滚动容器，溢出的是 `html`（`scrollWidth > clientWidth`），是页面级二维滚动。
- 不是 axe 报的（axe 无 reflow 规则），是几何实测。
- 文案/按钮数不变，只是这个宽度没有为它们留位置。

## 方案（最小、只影响 <360px / <640px）

1. `src/components/Layout.tsx`：品牌字样 `RezUp` 包一层 `<span className="max-[359px]:sr-only">`——360 以下只留 logo，链接可访问名不变（`sr-only`）。省 ~58px → 页头 right 348 → ~290 < 304。不动主题切换、不砍任何按钮。
2. `src/pages/Builder.tsx` 角色操作行：`ml-auto flex shrink-0 items-center` → `ml-auto flex items-center max-sm:basis-full max-sm:flex-wrap max-sm:justify-end sm:shrink-0`。<640 时该行本来就独占一行（`<p>` 是 `basis-full`），改为占满并允许换行：375 宽 266 < 可用宽 → 几何逐像素不变；320 宽换成两行，不再溢出。≥640 保持 `shrink-0` 不变。
3. `src/pages/Landing.tsx` 首屏第二个 CTA：加 `max-[359px]:h-auto max-[359px]:min-h-10 max-[359px]:whitespace-normal max-[359px]:py-2`——360 以下允许两行；≥360 无任何变化。

`max-[359px]:` 是 Tailwind v4 任意断点变体，仓内首次使用；不新增配置。

## 验证

- 本地：`npx tsc -b`、`npx eslint src/components/Layout.tsx src/pages/Builder.tsx src/pages/Landing.tsx`、`git diff --check`、`npm run build`、`node scripts/verify-dist.mjs`。
- 生产（部署后，qa/r670-verify.cjs）：
  - 320：/、/builder、/dashboard、/jobs、/documents、/ats-checker、/pricing `scrollWidth === clientWidth`；/builder 页头「Menu」按钮 right ≤ clientWidth 且 `elementFromPoint` 命中它；角色操作行 7 个按钮全部 right ≤ clientWidth。
  - 375 / 1280 × 亮/暗：页头右组、角色操作行、首页两个 CTA 的 `getBoundingClientRect` 与修复前逐像素一致（before 快照写入日志）；axe 真违规 0；零 console 错误；存储回基线。
- 如实不验证：真机 320 设备与真实 400% 桌面缩放渲染（CDP 视口模拟）。
