# R14 设计方案：Resignation Letter 生成器（功能深度收敛）

一手证据（2026-08-29 实测）：
- Rezi 导航 Product ▾ 含 Resignation Letter Generator（/tools/resignation-letter-generator），Templates ▾ 含 Resignation Letter Examples；工具页定位「polished, customized resignation letter … exit gracefully」。
- RezUp 现状：career 文档只有 cover letter 与 interview prep（BundleToolDialog，`CareerDocKind = 'cover' | 'interview'`），无辞职信；这是 Rezi Product 下拉中我们唯一缺失且轻量可做的工具（Job Search/AI Interview/AI Agent 为重后端，另行决策）。

## 方案（本批，无新依赖）
1. worker/prompts.ts：`buildResignationLetterMessages(company, role, lastDay, reason, name)` —— 专业、克制、感谢+交接承诺，不编造事实；未知处用占位符。
2. worker/index.ts：`POST /api/ai/resignation-letter`，与 cover-letter 相同的 bundle/免费额度门控与配额消费；必填 company+role。
3. src/lib/api.ts：`aiResignationLetter()`。
4. src/lib/documents.ts：`CareerDocKind` 加 `'resignation'`。
5. Builder BundleToolDialog：kind 扩展 `'resignation'`；输入 Company、Your role、Last working day、可选 reason；Generate/模板/编辑/PDF/DOCX/保存到 dashboard 全复用现有 UI。工具按钮区 2→3 个（sm:grid-cols-3）。辞职信不依赖 JD/简历文本（生成时不再强制 JD）。
6. Dashboard：文档列表 kind 标签与图标支持 resignation；标题改「Career documents」。

## 验证
本地 lint/tsc/build 全绿 → PR（基于 R13 分支）→ 部署 → 生产复验：生成/模板/保存/dashboard 显示、375px 布局、console clean。

如无异议按此执行。
