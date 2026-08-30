# R9 设计方案：移动端导航菜单（对标 Rezi 移动导航）

一手证据（2026-08-29 R8 复审计 + 代码核对）：Rezi 移动端 header 提供汉堡菜单可达全站导航；RezUp 现状是 `SiteHeader` 的主导航 `hidden md:flex`、静态页 `nav.main{display:none}`（<768px 完全隐藏）——手机用户在任何页面都没有导航入口，只能靠 footer 链接或返回首页。差距分级：P1（移动端可用性硬指标，公司验收标准要求移动适配）。

## 方案（架构决策）
- React `SiteHeader`（Layout.tsx）：新增 `md:hidden` 汉堡按钮（Menu/X 图标，aria-expanded，≥40px），展开为 header 下方面板，含 Templates / Examples / Guides / ATS Checker / Pricing / My resumes 六项（每项 min-h-10）；路由跳转后自动收起。
- 静态预渲染页（build-seo.mjs）：零 JS 方案 `<details class="mnav"><summary>` 汉堡，展开绝对定位下拉；桌面隐藏 .mnav、显示现有 nav.main。React 页与静态页视觉一致。
- 无新依赖；不改路由与数据。

## 交互规格
- 按钮 aria-label="Menu"，aria-expanded 同步；面板链接列表纵向、全宽、40px 高触摸目标；点击链接即收起（React 端 onClick 收起，静态端 details 原生行为）。
- 桌面 ≥768px 不变。

## 验证
- lint/tsc/build 全绿；独立 PR（基于 R8 分支）；部署后生产复验：375px 下 /（React）与 /templates/（静态）汉堡菜单展开/收起/跳转、触摸目标 ≥40px、无横向溢出、console clean；1440 桌面回归导航不变。

如无异议按此执行。
