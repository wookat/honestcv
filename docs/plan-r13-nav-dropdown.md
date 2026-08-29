# R13 设计方案：导航下拉信息架构（P2-9）

一手证据（2026-08-29 Playwright 实测 rezi.ai 桌面导航，截图 /tmp/rezi-nav-*.png）：
- Rezi 顶栏：Product ▾ / Enterprise / Templates ▾ / Resources ▾ / Pricing + Login + Try for free。
- Product ▾：AI Resume Builder、AI Resume Agent、Resume Checker、Keyword Scanner、Bullet Point Writer、Summary Generator、Cover Letter / Resignation Letter Generator、Job Search、AI Interview、View All。
- Templates ▾：View All、Simple/Modern/Compact/Creative 锚点、Resume/Cover Letter/Resignation Letter Examples。
- Resources ▾：Blog、User Guides、Chrome Extension、Resume MCP、View All。

现状（cv.zalize.com）：顶栏 5 个扁平链接（Templates/Examples/Guides/ATS Checker/Pricing）；对比页（vs Zety、vs LiveCareer）、One-time payment builders、About 只在页脚小字，导航不可发现。

## 方案（本批：React SiteHeader + 静态页 NAV_HTML，无新页面/依赖）
1. 桌面导航改为：Templates · Examples · Resources ▾ · ATS Checker · Pricing。
   Resources ▾ 下拉含：Resume guides（/guides/）、RezUp vs Zety（/vs/zety）、RezUp vs LiveCareer（/vs/livecareer）、One-time payment builders（/resume-builder-one-time-payment）、About（/about）——全部为已有页面，把页脚埋没的差异化内容提升为可发现导航。
2. React 实现：button + useState，aria-expanded/aria-haspopup，点击外部/选择后关闭，Escape 关闭；下拉面板复用现有卡片样式。
3. 静态页（build-seo.mjs NAV_HTML）：零 JS，details.rnav 桌面下拉（复用 mnav 的 details 模式 + 新桌面样式），移动 details.mnav 菜单内新增同组链接；两端 IA 保持一致。
4. 移动 React 菜单：在现有列表中追加 Resources 分组（小标题 + 同 5 链接），保持 min-h-10 触摸目标。

## 验证
本地 lint/tsc/build 全绿 → PR（基于 R12 分支）→ 部署 → 生产复验：桌面下拉开合/键盘可达、静态页（如 /guides/、/pricing/）同样可用、375px 菜单含新分组、无横向溢出、console clean。

如无异议按此执行。
