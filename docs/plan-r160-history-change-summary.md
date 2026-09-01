# R160 — Edit history checkpoint 差异摘要（restore 前可判断内容）

## 一手审计（2026-08-31，Rezi 公开编辑器）

- Rezi 编辑器标题下拉菜单：Settings / History（子菜单 Undo・Redo・Versions）/ Duplicate / Review / Move / Download / Delete。
- 点 Versions 打开右侧「Version History (beta)」面板：时间线列出快照（"5 hours ago" / "a day ago"），点选任一版本即可切换查看该版本内容，再决定是否留在该版本。
- 即：用户在恢复前就能判断"这个版本里是什么"。

## RezUp 现状（一手核对代码 + 生产）

- R140 已有会话内 undo/redo；`honestcv.resumeHistory` 已有每 ~10 分钟自动 checkpoint（上限 15 条），Builder 工具栏 History 按钮打开 Edit history 弹窗（HistoryDialog）。
- 但每条 checkpoint 只显示相对时间 + "姓名 — target role"一行；恢复是"盲恢复"——看不到该 checkpoint 与当前草稿差在哪，只能恢复后靠再恢复回来试错（恢复前会先存当前草稿的 checkpoint，可逆但绕）。

## 方案

在 HistoryDialog 每条 checkpoint 下新增一行分节差异摘要（与当前草稿对比，restore 前即可判断内容）：

- 新增纯函数 `snapshotChanges(snap: Resume, current: Resume): string[]`（Builder.tsx，HistoryDialog 旁）：
  - 文本节：summary、skills、certifications（legacy 行）——不同则记 `Summary`、`Skills`。
  - contact 任一字段（含 hiddenContact）不同 → `Contact`。
  - 条目节（experience/education/projects/certItems/involvement/coursework/awards/publications/references/military/agents/customSections）：按条目 id 对齐，统计 added/removed/edited → `Experience (1 edited, 2 added)` 风格。
  - 版式组（templateId/accentColor/pageSize/fontScale/lineSpacing/fontFamily/sectionSpacing/sectionDivider/bulletIndent/contactIcons/textColor/sectionOrder/headings 等其余字段）任一不同 → `Design & layout`。
  - target job（targetRole/jobDescription/ignoredKeywords）不同 → `Target job`。
- UI：非当前项在时间行下方以 muted xs 文本显示 `Differs from current: A · B · C`（最多列 4 项，余量 `+N more`）；与当前草稿完全一致的项继续显示 `Current`。
- 零 schema、零存储、零评分/导出改动；不加依赖。

## 不做

- 不做 Rezi 式"点选版本整页切换查看"（需要预览态管理，收益低于逐节摘要且更易误留在旧版本）。
- 不做逐字 diff 视图。

## 验证

- 本地 lint/build 全绿。
- 部署生产后 1600+375：构造多个 checkpoint（改 summary、加/删/改经历、换模板），断言各条摘要行准确；Current 项无摘要；restore 回归（含 restore 前自动 checkpoint）；375 摘要换行无溢出。
