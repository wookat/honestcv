# R506 — letter templates seed the current job from the resume

## 一手证据（生产 CDP，cv.zalize.com）
- /builder?doc=cover 弹窗自述 "Tailored to your resume…"，本地种入含进行中职位（ACME Corp / Software Engineer，endDate 空）的简历后点「Start from a template」，输出仍是
  `In my current role at [current company], …` —— 简历里明明有当前公司，模板照发占位符。
- 同理 resignation 模板：`Company you're leaving`/`Your current role` 两输入留空时输出 `[Company]`/`[your role]`，尽管这两个值就是简历最近的进行中职位。
- targetRole 与 fullName 已被模板正确使用（`Software Engineer position` / 署名），说明这是遗漏而非设计。
- R504/R505 链条的占位符警告与定位器都在为这些本可自动填充的槽位买单。

## 修复（最小，仅 Builder.tsx insertTemplate）
- 取当前职位：experience 中第一个未 hidden、company 非空、且 endDate 为空或匹配 ONGOING_RE（resume.ts 既有导出）的条目。
- cover 分支：`[current company]` → 当前职位公司名（无当前职位则保留占位符）。
- resignation 分支：company 输入空时回退当前职位公司，currentRole 输入空时回退当前职位 role；再退回原占位符。
- interview 分支、AI Generate 路径、输入框、R504 警告、R505 定位器零改动。

## 非目标
- 不自动填成就/JD 相关槽位（无法诚实自动化）。
- 不预填弹窗输入框本身（保持用户显式输入优先，回退只发生在模板生成时）。
- 不改 AI 生成路径。

## 本地验证
tsc -b、eslint（Builder.tsx 单查）、npm run build、npm run verify-dist。

## 生产 QA
- 种入含进行中职位的简历：cover 模板出现真实公司名、占位符计数少 1；resignation 空输入出真实公司+职位。
- 无进行中职位（全部有 endDate）：三处均保留原占位符。
- 用户在输入框显式填写时优先于简历回退。
- 375px 弹窗零溢出、零 console 错误；QA 后 localStorage 还原。
