# R18 方案：Sections spacing + Section divider（对标 Rezi Finish Up 工具栏）

日期：2026-08-29 · 依据：R15 登录实测 Rezi 编辑器 Finish Up 工具栏（截图 ~/audit-r1/shots-r15/），其中 Sections spacing / Section divider 为我们设计工具条尚缺的两项可诚实收敛小批（Indent 影响 ATS 解析且 Rezi 默认关闭，本轮不做）。

## 目标

Builder 设计工具条新增两组控件，与既有 Text size / Line spacing / Font 同一模式，预览 + PDF + DOCX 三处一致生效：

1. **Sections**（节间距）：`Tight | Normal | Roomy` — 缩放每个 section 标题前的垂直间距。
2. **Divider**（节分隔线）：`Auto | On | Off` — Auto 跟随模板（现状），On 强制显示（模板无线时用细线，有粗线保持粗线），Off 强制隐藏。

## 架构决策

- 沿用 R15 fontFamily 的模式：`Resume` 加两个可选字段 + 纯函数 helper，三个渲染器只读 helper，不各自判断。
  - `sectionSpacing?: 'tight' | 'normal' | 'roomy'`（缺省 normal，向后兼容旧草稿）
  - `sectionDivider?: 'auto' | 'on' | 'off'`（缺省 auto）
  - `SECTION_SPACING = { tight: 0.6, normal: 1, roomy: 1.4 }`；`sectionSpacingOf(r)`
  - `dividerOf(r, tplDivider)`：off→'none'；on→模板为 none 时 'line'，否则保持模板值；auto→模板值
- band 模板（色带标题）不受 divider 影响（本就无下划线），只受 spacing 影响 — 与模板语义一致。
- 渲染接线：
  - `ResumePreview`：SectionHeading 的 `mt-4`(16px) 改为 `marginTop: 16 * sectionSpacingOf`；borderBottom 用 `dividerOf`。
  - `pdf.ts`：`PdfWriter` 增加 `ss`/`divider` 字段；`heading()` 的前置 `gap(10)` 改 `gap(10 * ss)`，划线判断用 writer.divider。
  - `docx.ts`：heading 段落 `spacing.before: Math.round(240 * ss)`；border 判断用 `dividerOf`。
- 无新依赖；不改模板定义；不迁移 localStorage（可选字段）。

## 验收

- 本地 lint/tsc/build 全绿；生产部署后 QA：预览三档间距肉眼可辨、Divider On/Off 对有线/无线/band 模板各验证、PDF（pdftotext+渲染）与 DOCX（document.xml border/spacing）实测、既有 Font/Auto-fit 回归、375px 触摸目标、console clean。
