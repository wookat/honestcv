# R551 — 占位符导出警示引用文档里真实存在的占位符

## 一手生产证据（CDP，cv.zalize.com）
- 种本地简历（Ava Chen / Acme / Globex 在职）后，/documents 打开 Software Engineer 覆盖信示例并「Use this example」。R550 播种后文本已不含 `[Company]`。
- 查看器点 PDF → 「Unfilled placeholders」弹窗文案："…still contains 11 bracketed placeholders like [Company]…"，而该文档第一个真实占位符是 `[Hiring manager's name]`，全篇不存在 `[Company]`。
- 根因：Dashboard.tsx 与 Builder.tsx 两个警示弹窗把示例占位符硬编码为 `[Company]`。

## 对照
Rezi 及同类产品的告警均引用文档实际内容；本产品「诚实错误信息」原则要求示例如实。

## 方案（最小改动）
- 在两个文件各自的 `countLetterPlaceholders` 旁新增：
  `firstLetterPlaceholder(text) = text.match(/\[[^\][\n]{1,60}\]/)?.[0] ?? '[Company]'`
- Dashboard 弹窗：`like ${firstLetterPlaceholder(placeholderWarn?.text ?? '')}`。
- Builder 弹窗：`like ${firstLetterPlaceholder(result)}`。
- 弹窗只在 count>0 时出现，回退值仅为类型兜底。

## 非目标
- 不改占位符正则、计数、locator、导出与 R504/R505/R507 行为。

## 验证
- 本地：tsc、eslint（两文件）、build、verify-dist。
- 生产 QA（375×812 与 1280×900）：播种示例 PDF 警示引用 `[Hiring manager's name]`；未播种（空草稿）示例警示引用 `[Hiring manager's name]`（首个真实占位符）；Builder ?doc=cover 生成模板路径警示引用其文本首个占位符；下载/填写按钮行为不变；零溢出零 console 错误；QA 存储清理。
