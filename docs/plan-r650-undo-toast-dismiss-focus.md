# R650 — 键盘走查：Undo toast「Dismiss ×」Enter 后焦点掉回 body

## 生产实证（index-C9Is68an.js，qa/r649-evidence.cjs，纯键盘，1280）
- dashboard 删除副本 → 焦点落 Undo（R646）→ Tab 到「Dismiss」→ Enter：toast 卸载，`activeElement` = BODY；下一次 Tab 从页面顶部重来。
- /jobs 取消跟踪 → 同样 Undo → Tab → Dismiss → Enter：BODY。
- builder「Resume copies」弹窗内的 Undo 条同构（推断：Dismiss 后 Radix 兜底到弹窗容器；验收脚本实测）。
- 三处 toast 的计时过期路径不受影响：焦点在 toast 内时计时暂停（R646/R647），过期只在焦点已在别处时发生。Dismiss 是唯一「焦点在 toast 内时 toast 卸载」的路径。
- 参照：WAI-ARIA APG 对可关闭通知的建议是关闭后把焦点还给合理位置（触发点若已不存在则给相邻项/区域）；Rezi 公开页无相关承诺。

## 方案（最小、只动焦点）
1. `useFocusAfterRender` 接受多个候选 id，下一次 render 后聚焦第一个存在的（向后兼容单 id 调用）。
2. 新增 `neighbourFocusId(removedIds, selector)`：在确认删除那一刻（行仍在 DOM）按文档顺序取被删行之后第一个未删行的控件 id，否则之前的，否则 `'main'`（三页均有 `<main id="main" tabIndex={-1}>` 跳转锚点）。
3. dashboard `undoDelete` 增加 `dismissFocusId`（单删/批删副本按 `copy-<id>-open`，删文档按 `doc-<id>-open`）；Dismiss → `focusAfterRender(dismissFocusId, 'main')`。
4. builder `undoDeleteCopy` 同增 `dismissFocusId`（`builder-copy-<id>-open`；相邻行若是正在编辑副本其 Open 为 disabled，`focus()` 无效 → 再退 `main`）。
5. /jobs Dismiss → 若被取消跟踪的职位仍是当前选中职位，落其原状态芯片 `track-chip-<status>`（芯片组只要有选中职位就渲染，且此时为未按下态，即「重新跟踪」的动作点）；否则 `main`。
不改数据/文案/布局/计时。

### 实施中修正（生产实测推翻第 5 条）
- 第一版只试芯片→`main`。生产实测（index-Db8il4bC.js 之前的调试 bundle）：tracked 标签页下被取消跟踪的选中职位**只**来自 pipeline，取消后 `selected` 为 null → 面板整块卸载、芯片组随之消失（`chips=[]`），Dismiss 永远落 `main`，等于没修。
- 修正：`untrack()` 在删之前计算有序候选 `[芯片(仅当职位仍可显示), 相邻职位卡 job-card-<id>（新增稳定 id）, main]` 存入 ref；Dismiss 依次尝试。
- 375 附带发现（生产截图 qa/shots/r650dbg）：移动端在详情面板里取消跟踪 tracked 职位后，面板只剩「Select a job to see the details.」、列表仍隐藏、也没有「Back to list」按钮（它只在有选中职位时渲染）——用户只能靠浏览器 Back。这也使相邻职位卡不可见、不可聚焦。修正：职位从面板消失（不在搜索结果/深链职位里）时 `setMobileDetail(false)` 回到列表；桌面端无影响（列表本就可见）。

## 验收（生产 1280 + 375，qa/r650-verify.cjs）
- dashboard：两份副本删第一份 → Undo → Tab → Dismiss → Enter → 焦点 = 第二份的「Open X」（`:focus-visible` 真）；只有一份 → `main`。删文档 → 相邻文档 Open。
- /jobs：tracked 标签页两职位，取消跟踪选中职位（确认弹窗路径）→ Dismiss → 焦点 = 相邻职位卡 `job-card-<id>`（375 时列表已回到可见）；只有一职位 → `main`；pipeline 精确只剩另一职位。
- builder Copies 弹窗：删非编辑副本 → Dismiss → 焦点 = 相邻行 Open（弹窗内）。
- toast 已消失、数据与修复前一致；axe 0、无溢出、零 console 错误、无 AI 生成调用、存储回基线。未做：真实读屏实听。

## 结果（2026-09-06）
- 部署 index-DJH3qdhb.js（Workers Routes code 10000 依旧，上传上线不受影响）。qa/r650-verify.cjs 1280 与 375 各 ALL PASS（375 部署后第一次跑 5a 落 `main`，之后连续三次全过；推断为边缘 Jobs chunk 传播延迟，未再复现）。
- 已验证：dashboard 首/末/唯一副本、文档、jobs 相邻卡/唯一职位、builder 弹窗内相邻行；axe 0（含弹窗打开态）、无溢出、零 console 错误、存储回基线。
