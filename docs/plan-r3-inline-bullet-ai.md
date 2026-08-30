# R3 设计方案：编辑器内逐条 bullet AI 修复 + 静态页导航一致性（P1-3 / R2 遗留）

依据：docs/audit-2026-08-29-rezi-r1.md（P1-3：Rezi 在编辑上下文内对单条 bullet 给 AI 建议；RezUp 只有整段重写与独立 Tailor 弹窗）+ R2 生产复验发现（静态预渲染页 header 无新导航）。

## 方案
1. **逐条 bullet AI 修复（Builder）**
   - `BulletGuidance`（Experience 下方的逐行质量警告）为每条有问题的行增加「Fix with AI」按钮。
   - 点击后复用现有 `runRewrite('bullets', 单条文本, apply)`：LLM 返回多个候选走现有 VariantPick 审阅选择（review-before-apply），apply 只替换该行。
   - 复用现有配额/402/错误处理；无新端点。
   - 交互规格：按钮 min-h 满足移动端触达；busy 状态按 tag `exp-{id}-line-{idx}` 区分；空行不出按钮。
2. **静态页导航一致性（build-seo.mjs）**
   - 定义共享 `NAV_HTML`（Templates/Examples/Guides/ATS Checker/Pricing）与 `.nav` CSS（≥768px 显示，移动端隐藏），插入全部 9 处静态 header 的 brand 与 CTA 之间，与 React SiteHeader 对齐。

## 验证
- lint/build 全绿；独立 PR（基于 R2 分支，#215 合并后自动重定向）。
- 部署后生产复验：builder 内对有警告的行走一次真实 AI 修复（消耗 1 次免费额度）；静态页 /templates/ /pricing/ 1440 显示导航、375 隐藏且无溢出。

如无异议按此执行。
