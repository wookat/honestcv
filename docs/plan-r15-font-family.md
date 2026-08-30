# R15 设计方案：字体族选择（编辑器排版深度收敛）

一手证据（2026-08-29 登录实测 app.rezi.ai 编辑器，截图 ~/audit-r1/shots-r15/）：
- Rezi Finish Up & Preview 工具栏含独立 Font 下拉（默认 MERRIWEATHER）、字号、Line height、Sections spacing、Indent、Section divider、Paper size、Color、View as pages、Auto-Adjust、Template、Share、Download PDF。
- RezUp 现状：22 模板 + 强调色 + Letter/A4 + 字号（S/M/L）+ 行距（Compact/Normal/Relaxed）+ Auto-fit 均已有；唯独字体族被模板锁死（tpl.serif 决定 serif/sans），用户不能独立换字体——这是 Rezi Adjust 工具栏中我们唯一缺失的可诚实小批项。
- 其余差距（Share 公开链接=需要云端持久化属架构决策；How You Compare 百分位=无真实数据不做；Icons/Profile picture=ATS 反模式，刻意不做）。

## 方案（本批，无新依赖）
1. src/lib/resume.ts：`fontFamily?: 'auto' | 'serif' | 'sans'`（默认 'auto' 跟随模板）+ `serifOf(resume, tplSerif)` 帮助函数。
2. src/components/ResumePreview.tsx：字体族用 serifOf 覆盖。
3. src/lib/pdf.ts：StandardFonts Times/Helvetica 选择用 serifOf（pdf-lib 标准字体，无需内嵌 TTF/新依赖）。
4. src/lib/docx.ts：Georgia/Calibri 选择用 serifOf。
5. Builder 设计工具条：Text/Spacing 旁加 Font 段（Auto/Serif/Sans 三键，同样式，aria-pressed，≥40px 移动触摸）。

## 验证
本地 lint/tsc/build 全绿 → PR（基于 R14 分支）→ 部署 → 生产复验：切换 Font 三档预览即时变化、PDF/DOCX 字体一致、Auto 跟随模板、375px 布局、console clean。
