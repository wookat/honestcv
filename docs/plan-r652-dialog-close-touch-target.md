# R652 — 所有弹窗右上角「Close ×」热区只有 16×16px

## 生产实证（index-Bn1MCp03.js，qa/r652-evidence.cjs，375×812；1280 同）
- `src/components/ui/dialog.tsx` 的 `DialogContent` 给每个弹窗渲染 `DialogPrimitive.Close`（`absolute top-4 right-4` + `XIcon size-4`，无 padding）。实测 builder「Resume copies」弹窗、/jobs「Stop tracking "Platform Engineer"?」确认弹窗、/dashboard「Delete "Platform — Initech"?」确认弹窗：Close 按钮 `getBoundingClientRect()` = 16×16，距弹窗上/右边 17px；60px 半径内无其他控件。
- axe `wcag22aa` target-size 通过——2.5.8 的「间距」豁免（24px 圆内无其他目标）成立，但 16×16 是 Apple HIG 44pt / Material 48dp 最小触控尺寸的 1/3，在手机上关闭 R586–R650 所有确认/披露弹窗（删除、取消跟踪、Copies、Resume settings、Target/Cover/Interview 确认）都要精准点按；键盘/Esc 不受影响。
- 该样式是 shadcn/ui 上游默认，7 个文件的所有弹窗共用同一处代码，改一处即全覆盖。项目内图标按钮既有惯例：`-m-* p-*` 撑热区不移动图标（R651 同源做法）。

## 方案（只改 dialog.tsx 一处 className）
- Close 按钮加 `-m-3 p-3 sm:m-0 sm:p-0`：<640px 时盒子 40×40，负外边距使图标仍停在 top-4/right-4 的原位（视觉不变），focus ring 随盒子放大；≥640px 完全等于现状。
- 不改 Radix 行为、焦点归还（openerRef）、任何弹窗内容。

## 验收（生产 1280 + 375，qa/r652-verify.cjs）
- 375：上述三个弹窗 Close 40×40，图标 `<svg>` 的 rect 与修复前逐一相同（top/right 17px、16×16）；点 Close 盒子四角内 4px 处 `elementFromPoint` 命中 Close；点击后弹窗关闭且焦点回到打开它的按钮（既有 onCloseAutoFocus 行为不变）。
- 1280：Close 仍 16×16、位置不变。
- axe 0（弹窗打开态）、无溢出、零 console 错误、存储回基线、无 AI 调用。未做：真实读屏实听、真机触控。

## 结果（2026-09-06）
- 部署 index-rBI4qE4w.js（Workers Routes code 10000 依旧，上传上线不受影响）。qa/r652-verify.cjs：375 三个弹窗 Close 均 40×40、图标 16×16 仍在 top/right 17px、四角 `elementFromPoint` 命中、背景透明（`data-[state=open]:bg-accent` 对 Radix Close 无效，无 40px 色块）；点击 Close 关闭弹窗且焦点回到打开按钮（Copies 触发钮 / 状态芯片「Saved」/「Delete Platform — Initech」）；1280 Close 仍 16×16 位置不变。弹窗打开态 axe 0、无溢出、零 console 错误、数据未动、存储回基线、无 AI 调用。未做：真实读屏实听、真机触控。
