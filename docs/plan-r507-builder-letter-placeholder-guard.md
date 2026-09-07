# R507 — Builder 信件弹窗补齐占位符警告与定位器（与 R504/R505 对齐）

## 一手证据（生产 CDP，cv.zalize.com）
- /builder?doc=cover 点「Start from a template」后结果含 5 个 `[bracketed]` 占位符，textarea 上方零 role=status、零计数、零定位辅助（Dashboard 文档编辑器在 R505 已有）。
- 直接点 TXT：静默下载，无任何弹窗/提示（Dashboard 同类下载在 R504 已有「Unfilled placeholders」确认弹窗）。PDF/DOCX 同一代码路径同样静默。
- 即同一产品里同一种文档，从 /documents 打开会被诚实拦截，从 /builder 弹窗生成却一键放行——R504/R505 的保护只覆盖了一半出口。

## 修复（最小，仅 Builder.tsx ToolDialog）
- 本地 `countLetterPlaceholders`（与 Dashboard 同一正则 `/\[[^\][\n]{1,60}\]/g`）。
- result textarea 上方：count>0 时琥珀状态条（role=status 报 "N placeholders left…"）+「Next placeholder」按钮（镜像 Dashboard jumpToNextPlaceholder：从光标处选中下一个槽位、回绕、滚动进视口）。
- PDF/DOCX/TXT 三按钮：下载体抽为 runLetterDownload(fmt)；count>0 先弹「Unfilled placeholders」确认——「Download anyway」照常下载、「Fill them in」关弹窗并聚焦定位到下一个占位符。
- Save to My resumes、AI Generate、模板内容、R506 current-job 回退零改动。

## 非目标
- 不改 Dashboard 已有实现；不做 textarea 高亮；不阻断下载（只确认）。

## 本地验收
`npx tsc -b --noEmit`、`npx eslint src/pages/Builder.tsx`、`npm run build`、`npm run verify-dist`。

## 生产 QA
- cover 模板后状态条报数、Next placeholder 依次选中回绕、编辑清零后消失。
- TXT/PDF 弹确认；Download anyway 下载；Fill them in 聚焦定位。
- 无占位符（全部填完）直接下载零弹窗；375px 零溢出零 console 错误；QA 后清理存储。
