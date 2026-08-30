# R2 设计方案：落地页深度（对标 Rezi 首页，P1-8/P2-9）

依据：docs/audit-2026-08-29-rezi-r1.md。R1 已上线（PR #214，生产复验通过）。

## 现状与差距（实证）
落地页已有 hero/mockup/信任带/三步/特性卡/模板/定价/深色对比/FAQ/CTA。与 Rezi 首页的剩余差距：
1. **逐特性深挖区**：Rezi 用交替的「文案 + 产品可视化」大区逐一展示 AI Writer / Keyword Targeting / Rezi Score；RezUp 把全部功能压缩成 6 张小卡，核心能力（实时 ATS 分、逐条 AI 建议、分数分解）没有可视化证明。
2. **导航信息架构**：Rezi 顶栏有 Templates/Resources/Pricing 等入口；RezUp 顶栏只有 logo + 一个按钮，SEO 页（/templates/ /examples/ /guides/ /pricing/）只在页脚。

## 方案
1. `SiteHeader` 增加桌面导航（Templates / Examples / Guides / ATS Checker / Pricing，`hidden md:flex`），移动端保持现状（logo+CTA）。
2. Landing 在「三步」之后新增 3 个交替布局 showcase 区（文案一侧 + 可视化一侧，md 以上左右交替，移动端堆叠）：
   - **Live ATS score + keyword targeting**：用真实组件（ScoreRing + matched/missing 关键词 chips，含 R1 的 sparkle「Draft bullet」样式）静态演示。
   - **AI tailoring（逐条审阅）**：original 划线 → suggestion + Accept/Keep 按钮的静态演示卡。
   - **Score breakdown（知道改哪里）**：R1 的分维度进度条卡静态演示。
   每区配一个指向 /builder 的 CTA。诚实原则：可视化全部来自真实产品形态，不虚构数字用户量/评分。
3. 原 6 张特性卡保留（压缩为次级信息）。

## 验证
- `npm run lint` + `npm run build` 全绿；PR 独立分支。
- 部署后 1440/375 生产复验：交替区不横向溢出、导航可点、视觉与 builder 实物一致。

如无异议按此执行。
