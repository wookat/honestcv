# R505 — 文档编辑器占位符定位器（2026-08-31）

## 一手证据（生产 cv.zalize.com CDP 实测）
- R504 的「Fill them in」把用户送进 /documents 文档编辑器，但编辑器是一个裸 `<textarea>`（rows=14，内容 288px > 视口 240px 需滚动）。
- 示例信含 15 个括号占位符（`[Hiring manager's name]`、`[Company]` …），编辑视图内：
  - 零占位符计数（`[role=status]`/`aria-live` 节点为空）；
  - 零定位/跳转辅助——用户必须肉眼在整墙文本里逐个找 15 个槽位。
- 对照：R504 警示弹窗能报数量，但用户点「Fill them in」后线索即断。

## 方案（最小）
仅 `src/pages/Dashboard.tsx` 文档编辑器 edit 视图：
- 当 `countLetterPlaceholders(docText) > 0` 时，在 textarea 上方渲染一行状态条：
  - `role="status"` 文案 `{n} placeholder(s) left — replace the [bracketed] parts with your details`；
  - 「Next placeholder」按钮：从当前光标位置起找下一个 `/\[[^\][\n]{1,60}\]/` 命中（到底后回绕），`focus()` + `setSelectionRange(start,end)` 选中该槽位，textarea 按行高估算 scrollTop 让选中行进入视口。
- 全部占位符清空后状态条消失（计数由 docText 实时驱动）。
- 复用既有 `countLetterPlaceholders`；零新依赖。

## 非目标
- 不做 textarea 内高亮着色（需 overlay/contenteditable 重构，入银行）；
- 不自动替换/AI 填充；不动 preview 视图、下载与 R504 弹窗逻辑。

## 验证
- 本地：tsc、eslint（Dashboard.tsx）、build、verify-dist。
- 生产：打开占位符文档编辑视图出状态条报 15；连点 Next placeholder 依次选中且回绕；删完占位符状态条消失；干净文档零状态条；375px 零溢出；零 console 错误。
