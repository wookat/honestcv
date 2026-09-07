# R557 — 已保存文档按标题搜索

## 一手生产证据（2026-08-31，CDP，1280×900）
- /documents 播种 12 份混合文档后，页面上没有任何搜索框（`input[type=search]` 为空），只有 kind 过滤 chips——找一封具体的信只能逐卡肉眼扫。
- 对比：My resumes 的保存副本早有「Search copies」（R360，按名称/文件夹过滤 + 无匹配诚实提示）；文档列表是唯一没有查找能力的长列表面。
- R556 编号标题（`… (2)`、`… (3)`）落地后，同角色多版本文档更多，按标题查找的需求更真实。

## 缺口
文档一多（多角色 × cover/resignation/interview × 编号副本），/documents 列表面不可检索，与副本列表能力不一致。

## 最小方案
仅 src/pages/Dashboard.tsx：新增 `docQuery` 本地 state；kind chips 行左侧加 R360 同款搜索框（`Search documents`，仅 docs.length>0 时渲染）；列表 filter 叠加 `title.toLowerCase().includes(q)`；有查询、有文档但零匹配时显示「No documents match “…”.」诚实提示（复用副本同款样式）。查询不入 URL（与 copies 行为一致）；?kind 过滤、卡片操作、导出、R555 徽标零改动。

## 非目标
不搜正文（标题即卡片可见身份）；不加排序；不动 Letter examples 搜索。

## 验证
npx tsc -b、npx eslint src/pages/Dashboard.tsx、npm run build、npm run verify-dist；wrangler deploy（Routes code 10000 已知）；生产 CDP QA 1280×900 与 375×812：播种混合文档 → 键入过滤只剩匹配卡、与 kind chip 组合过滤、零匹配诚实提示、清空恢复、零溢出零 console 错误；QA 后存储回六键基线。
