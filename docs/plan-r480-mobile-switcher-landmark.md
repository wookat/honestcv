# R480 — 移动端 Edit/Preview 切换条纳入 landmark（axe region 违规修复）

日期：2026-09-05（生产 https://cv.zalize.com ，CDP + axe-core 一手实证）

## 一手证据
全新 browser context 下对生产 4 条核心路由（/builder?example=software-engineer、/jobs、
/documents、/dashboard）× 2 视口（1280 / 375）跑 axe-core（脚本 ~/audit-r1/r480_axe.py）：
- 唯一违规：/builder 375px —— `region`（moderate）："All page content should be
  contained by landmarks"，节点 `.bg-background/95` = 移动端固定底部
  Edit / Preview & score 切换条（Builder.tsx，`role="group"` + aria-label）。
- 其余 7 组组合全部 CLEAN。

根因：切换条渲染在 `</main>` 之后的 fixed 底条，`role="group"` 不是 landmark 角色，
读屏用户按 landmark 导航时该控件不可达（且 axe 判违规）。

## 最小实现
仅 src/pages/Builder.tsx 一处：切换条外层 div 的 `role="group"` 改为 `role="navigation"`
（landmark 角色，语义为「切换视图的页内导航」），保留既有
`aria-label="Switch between editing and preview"`（命名 landmark 必需）。
两个切换按钮的 aria-pressed / 行为零改动。

## 非目标
- 不动其它底部状态条（R427 堆叠条按需出现，axe 本轮未flag）。
- 不改切换逻辑 / renderPreviewPane 门控（R477）。
- 不做全站 landmark 重构。

## 验证
- 本地：npx tsc -b、eslint（Builder.tsx）、npm run build、node scripts/verify-dist.mjs。
- 部署后生产 QA：375px /builder axe region 违规清零；1280 及其余路由保持 CLEAN；
  切换条功能回归（Edit↔Preview、R477 延迟挂载不回归）；375 光暗零溢出零 console 错误。

## 部署
npm run deploy（照旧如实记录：上传成功、Workers Routes API auth code 10000，不扩权限）。
