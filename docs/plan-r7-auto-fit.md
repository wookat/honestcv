# R7 设计方案：Auto-fit 一键排版（对标 Rezi Auto-Adjust）

依据：R1 一手取证——Rezi 编辑器有 Auto-Adjust：一键调整字号/行距让简历刚好排满目标页数，免去手动反复试。RezUp 现状（代码核对 Builder.tsx + 生产实查）：已有 Text size (S/M/L) 与 Line spacing (compact/normal/relaxed) 手动开关，以及「PDF export: N pages」提示（超 1 页仅给文字建议），但没有自动化闭环——用户要自己在 9 种组合里试。差距分级：P2（体验类，但实现成本低、收益直接）。

## 方案（架构决策）
- 复用现有真实排版度量 `countResumePdfPages(resume)`（浏览器端 pdf-lib 实际渲染计页，与导出一致，杜绝估算偏差）。
- 纯前端、无新依赖、无 AI 调用：Auto-fit = 在 9 个 (fontScale × lineSpacing) 组合上实测页数，选出「达到最少页数的组合中可读性最好的一个」（优先大字号，其次宽行距）。
- 应用即改 resume.fontScale / lineSpacing（走现有 set() 与 undo 历史，可 Ctrl+Z 撤销）。

## 交互规格
- 「PDF export: N pages」行旁新增「Auto-fit」按钮（Wand2 图标）；点击后按钮显示 Fitting… 并禁用。
- 结束后短提示：成功压页 →“Fits N page(s) — set text size X, line spacing Y”；已是最优 →“Already at the best fit”。提示 role="status"。
- 组合从最可读到最紧依序实测，同页数取序靠前者；顺序：L/relaxed, L/normal, M/relaxed, L/compact, M/normal, S/relaxed, M/compact, S/normal, S/compact。
- 移动端按钮 ≥40px 触摸目标。

## 验证
- lint/tsc/build 全绿；独立 PR（基于 R6 分支，累积链）；部署后生产复验：长简历（多页）点 Auto-fit 页数下降且设置项 ring 状态同步；1440+375；console clean。

如无异议按此执行。
