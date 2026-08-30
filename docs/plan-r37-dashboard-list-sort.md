# R37 方案：操作台简历列表视图 + 排序（对标 Rezi resumes 工作区 grid/list toggle + Sort by）

## 一手证据（2026-08-29，登录实测 app.rezi.ai/dashboard/resumes）
- 截图：~/audit-r1/shots-r37/r37-sort.png、r37-list-kebab.png（承接 R36 的 r36-list-view.png）。
- Rezi Resumes 区右上有「CREATED ▾」排序下拉（Sort by: Name / Created / Edited）+ grid/list 视图切换。
- 列表视图为表格式行（Name / Created / Edited 列 + 行尾 ⋯ 菜单：Settings/History/Duplicate/Review/Move/Download/Delete），并保留「Click to create new resume or drop a resume here」整行磁贴。

## RezUp 现状
- /dashboard「My resumes」只有卡片网格，保存副本固定按保存顺序渲染（listResumeVersions 原始顺序），无排序、无列表视图。副本多了以后扫读名称/时间效率低（R36 QA 时 6+ 卡即需滚动）。

## 差距分级
- P1：无排序（Rezi Name/Created/Edited 三键）——副本管理效率差距。
- P2：无列表视图（R36 已记录）。

## 方案（本轮一并收敛 P1+P2，diff 小）
- 「My resumes」网格上方加控制行：Sort 下拉（Last edited 默认 / Name A–Z；我方无 createdAt 字段，诚实不提供 Created 排序）+ Grid/List 视图切换（LayoutGrid/List 图标按钮，aria-pressed）。仅在有保存副本时显示。
- Grid 视图：现状卡片，仅 versions 应用排序；draft 卡 + Start new + Import 磁贴保持在前不参与排序。
- List 视图：磁贴网格保持，其下 versions 渲染为行（名称 + Edited 相对时间 + ATS 分 + 与卡片完全相同的操作按钮组，抽成 versionActions(v) 复用），移动端按钮 wrap 且 ≥40px。
- 视图偏好持久化：新 localStorage key `honestcv.dashboardView`（'grid'|'list'）；排序为会话内状态不持久化。
- 零新 API / 零 AI；不做 Move/folders、Review、行内缩略图列（P2/刻意不做）。

## 验证
- 本地 lint/tsc/build 全绿 → 部署 → 生产 QA：排序两键正确性、视图切换+刷新持久化、列表行全操作（Open/Duplicate/PDF/DOCX/Settings/Delete）与 R35/R36 回归、375px 40px 无溢出、零 AI、localStorage 还原（仅允许残留 honestcv.dashboardView）。
