# R555 — 文档卡片显示未填占位符数

## 一手生产证据（2026-08-31，CDP，1280×900）
- /documents 保存 Software Engineer cover 示例后，卡片仅显示「Cover letter · Edited today」。
- 该信实际仍含 10 个 [占位符]（R554 QA 实测 Preview 渲染 10 个 <mark>）。
- 列表面完全无「未完成」信号：用户只有点 Open 进 Edit 页（计数条）或点导出（警示弹窗）才知道信没填完。
- Rezi 对比：Rezi dashboard 文档卡带完成度/状态信号。

## 缺口
文档列表卡片不诚实反映信件完成状态——放着一封满是方括号的信，列表却与已填完的信毫无区别。

## 最小方案
仅 Dashboard.tsx 文档卡 meta 行：对 cover/resignation（interview 不适用），当 countLetterPlaceholders(d.text) > 0 时追加琥珀色「· N to fill」。复用既有 countLetterPlaceholders（R553 1–120 正则）。

## 非目标
导出/警示/计数条/Preview 高亮/Builder/评分零改动。

## 验证
npx tsc -b、npx eslint src/pages/Dashboard.tsx、npm run build、npm run verify-dist；wrangler deploy（Routes code 10000 已知）；生产 CDP QA 1280×900 与 375×812：含占位符的保存信显示徽标、interview 文档不显示、填完后消失、零溢出零 console 错误；QA 后存储回六键基线。
