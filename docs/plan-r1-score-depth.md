# R1 设计方案：ATS 分数深度闭环（对标 Rezi Score）

依据：docs/audit-2026-08-29-rezi-r1.md（P0-1 / P0-2 / P1-4）。

## 架构决策
- 纯前端实现，沿用「浏览器本地计分、数据不出设备」原则；不新增后端接口。
- 重构 `src/lib/ats.ts`：`AtsResult` 增加子维度分解 `subscores`，向后兼容现有 `score/keywordScore/structureScore` 字段（现有 UI 不破坏）。
- 复用 `src/lib/guidance.ts` 的 bullet 质量检查作为 Content 子维度数据源（不重复造规则）。

## 子维度定义（0-100）
1. **Content**（内容质量）：基于 guidance.ts 逐 bullet 检查（weak opener / no metric / filler / first-person / 长度），issue 越少分越高；summary 长度纳入。
2. **Searchability**（可检索性）：联系方式完整、标准分区存在（experience/education/skills）、日期完整。
3. **Keyword Match**（关键词匹配）：现有 keywordScore（无 JD 时显示「贴 JD 解锁」而非 0 分）。
4. **Best Practices**：bullet 数量 3-6/role、量化 bullet 占比、skills 填写、education。

总分 = 有 JD 时四维加权（Keyword 40 / Content 25 / Searchability 20 / BP 15）；无 JD 时三维归一。

## 页面结构与交互规格
1. **Score Breakdown 弹窗**（新组件 `ScoreBreakdown.tsx`）：
   - 顶部大仪表 + 四个子维度小环（仿 Rezi 五环布局，视觉走 RezUp 自有 Tailwind 语言，不复制 Rezi 样式资产）。
   - 每个子维度下逐条列出可整改项（❌/⚠️/✅ + 一句话说明 + 该项影响的分值），点击滚动/聚焦到对应编辑区。
   - 入口：builder 侧栏 ATS score 环旁「See breakdown」按钮；替代/合并现有 Health 弹窗内容（Health 保留入口，指向同一弹窗，避免双弹窗心智）。
2. **缺失关键词一键落地**（P0-2）：
   - Missing keywords 列表每个 chip 增加操作：「+ Skills」一键把关键词追加进 skills 字段（本地、即时、可撤销）；
   - 有 AI 额度时提供「Write bullet」——调用现有 aiTailor 通道生成一条含该关键词的 bullet，review-before-apply（复用现有 tailoring UI 模式）。
3. **诊断可见性**（P1-4）：侧栏 score 环下常驻显示 top 2 可整改项摘要（现 strength.missing 已有雏形，接入新子维度数据）。

## 验证
- 本地 `npm run lint` + `npm run build` 全绿。
- `npm run deploy` 上线后生产 1440/375 双视口截图复验：弹窗布局、无横向溢出、触达 ≥40px、对比度。
- 回归：无 JD、空简历、长简历三态下分数与弹窗不崩。

如无异议按此执行（默认方案）。
