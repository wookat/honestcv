# R647 — builder「Resume copies」弹窗删除后键盘被锁在弹窗外

## 生产实证（index-DgKcqXK4.js，qa/r647c-evidence.cjs，纯键盘，1280）
- /builder → Copies → 某行「Delete copy X」→ 确认弹窗（Radix 将 Resume copies 弹窗 aria-hidden）→ Enter「Delete」：
  - Resume copies 弹窗仍打开（modal），但 `activeElement` = BODY；
  - 之后连续 Tab 走的是弹窗**后面**的页面（Skip to content → 顶部导航 → 主题按钮…），12 次 Tab 都没进弹窗；
  - 弹窗内的「Deleted "X" — Undo / Dismiss」10s 后消失。键盘用户既到不了 Undo，也到不了弹窗关闭按钮。
- Cancel / Escape 路径正常：焦点回到该行「Delete copy X」（dialog.tsx opener 恢复）。
- 对照：R646 修过的 dashboard/jobs 路径 Undo 已可达。
- 原因（推断，与 R645/R646 同构）：确认按钮关闭确认弹窗时 opener（行内 Delete）已随行卸载，dialog.tsx 放行 Radix 默认恢复，无 trigger → 焦点落 body；外层 Resume copies 弹窗的 FocusScope 在嵌套弹窗关闭后不会主动把 body 上的焦点拉回。

## 方案（最小、只动焦点，不动数据/文案/布局）
1. 确认弹窗 `DialogContent onCloseAutoFocus={focusOnClose('undo-copy')}`（R646 helper；Cancel 路径无 Undo 元素则维持 opener 恢复）。
2. Undo 按钮加 id `undo-copy`；toast 内有焦点时 10s 计时暂停（同 R646 的 `onFocus/onBlur + relatedTarget`），新 toast 出现时重置。
3. Undo 后 `focusAfterRender` 到恢复行：`builder-copy-<id>-open`，若该副本恢复为正在编辑（Open 被 disabled）则落到 `builder-copy-<id>-rename`。
4. 行内 Open/Rename 加稳定 id。

## 验收（生产 1280 + 375，qa/r647-verify.cjs）
- Delete 后 activeElement = Undo（`:focus-visible`）且在 Resume copies 弹窗内；聚焦 10.5s 后 toast 仍在；Tab 离开后 10.5s 消失。
- Undo 后 versions 精确恢复、焦点落在恢复行 Open（或 Rename）；wasActive 分支亦然。
- Cancel/Escape 焦点仍回该行 Delete；Open 确认路径不受影响。
- axe 0 violations、无溢出、零 console 错误、无 AI 生成调用、存储回基线。
- 未做：真实读屏实听。
