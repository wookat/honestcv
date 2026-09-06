# R588 — SOP-10 四维审计节点 + /dashboard 移动端快捷链横向溢出（2026-09-06）

## 审计（生产 index-AZ1YhpkC.js，零 AI 配额，零分享/支付/leads）

### 复扫矩阵
7 路由（/ /builder /dashboard /jobs /documents /ats-checker /pricing）× 1280/375，CDP 实测
`documentElement.scrollWidth / clientWidth / visualViewport.width` + 超出 clientWidth 的元素枚举，console 错误 0。

| 路由 | 1280 | 375（经典滚动条→client 360） | 结论 |
|---|---|---|---|
| / | 1265/1265 | 360/360；`table.min-w-[560px]` 在 overflow-x-auto 容器内 | 有意的内滚，页面无溢出 |
| /builder | 1280/1280 | 375/375；节导航 `w-max` chip 条 | 已知有意内滚（skill 记录） |
| **/dashboard** | 1265/1265 | **367/360**：两张 `md:hidden` 快捷链卡 `a.bg-card.flex` 右缘 367 | **P2 真实页面横向溢出** |
| /jobs /documents /ats-checker /pricing | 1265 | 360/360 | 零溢出 |

### 竞品公开页（rezi.ai 首页/features/pricing，仅公开内容）
- 首页三支柱 Build / Score / Target + 大量社会证明（4.5M 用户、Forbes、4.7/5）。RezUp 三支柱已对齐（Builder / ATS 评分 / JD 关键词 targeting），社会证明差距沿 R298 结论继续缓议（无真实数据不造假）。
- 本轮未见新的功能维度缺口需要立项；本轮以修实测 P2 为主。

## 一手证据（/dashboard 375 与 360 视口）
- 375 视口：`scrollWidth 367 > clientWidth 360`，两张卡 right=367，`span.truncate` 未产生省略号（`scrollWidth>clientWidth` 为 false）。
- 360 视口（安卓最常见宽度）：`scrollWidth 367 > clientWidth 345`，溢出 22px；真机无滚动条时仍溢出 7px。
- 现场验证修法：给两张 `<a>` 注入 `style.minWidth='0'` 后 scrollWidth 立刻等于 clientWidth（360/345），第一张卡副标题出现真实省略号（`p.scrollWidth>p.clientWidth && clientWidth>0`）。
- 截图：qa/shots/r588/01-dashboard-before-375.png、02-dashboard-after-minw0-375.png（同 360）。

## 根因
`<div class="grid gap-3 md:hidden">` 的隐式 auto 轨道以子项 min-content 定尺；`<Link class="flex …">` 作为 grid item 默认 `min-width:auto`，
其 min-content = 图标 + gap + 内部 `truncate`（nowrap）整行文本宽度 ≈ 367px，轨道被撑到 367 → 页面横向溢出。
内层 `span.min-w-0` 只影响 flex 子项的自动最小尺寸，无法阻止 min-content 向 grid item 传播（与 .agents/skills/testing-rezup 第 52 条记录的 Chrome 行为一致）。

## 方案（最小改动，仅 src/pages/Dashboard.tsx）
两张快捷链 `<Link>` className 增加 `min-w-0`：grid item 最小贡献变 0，轨道回落到容器宽度，`truncate` 生效。
不改布局结构、文案、路由、存储。

## 验证
- 本地：tsc -b / eslint Dashboard.tsx / build / verify-dist。
- 部署：npm run deploy（预期 Workers Routes code 10000，不影响上传）。
- 生产复验：/dashboard 375 与 360 `scrollWidth === clientWidth`、卡片右缘 ≤ clientWidth、副标题真实省略号；1280 桌面 `md:hidden` 卡不渲染，无回归；7 路由复扫零溢出零 console 错误；存储回基线。
