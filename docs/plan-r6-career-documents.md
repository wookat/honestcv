# R6 设计方案：Career documents 一等公民（对标 Rezi 多文档操作台）

依据：R1 一手取证——Rezi dashboard 把 Resume / Cover Letter / Resignation Letter 作为并列的文档类型管理（dashboard 顶部 tab 切换，每类文档可保存/重开）。RezUp 现状（生产实查 + 代码核对 Builder.tsx CareerToolDialog）：cover letter / interview prep 已能 AI 生成并可下载 PDF/DOCX，但生成结果是**一次性的**——关掉对话框即丢失，不能保存、不能重开，dashboard 上也完全没有这类文档的存在。差距分级：P1（功能存在但缺文档生命周期与操作台曝光）。

## 方案（架构决策）
- 沿用 local-first：新增 `src/lib/documents.ts`，localStorage key `honestcv.careerDocs`，模型 `CareerDoc { id, kind: 'cover'|'interview', title, text, updatedAt }`，提供 list/save/update/delete 纯函数（与 resumeVersions 同风格）。
- 不新增路由：文档列表进现有 `/dashboard`（R5 的操作台），在简历网格下方加「Cover letters & interview briefs」区。
- 生成对话框（CareerToolDialog）在有结果时新增「Save to My resumes」按钮；保存后可从 dashboard 重新打开查看/编辑/复制/下载/删除。

## 交互规格
- Builder 对话框：结果区按钮行加 Save（保存标题自动取 `公司 — Cover letter` / `目标角色 — Interview prep`，已保存后显示 Saved ✓，再次点击更新同一条）。
- Dashboard 新区块：每条文档一行卡（图标区分类型、标题、更新时间、Open/Delete）；Open 打开查看对话框（可编辑文本、Copy、PDF/DOCX 下载、保存修改）；Delete 走确认。空态：一句话说明 + 去 /builder 的链接。
- 触摸目标 ≥40px（375px），单列不横向溢出。

## 验证
- lint/tsc/build 全绿；独立 PR（基于 R5 分支，保持累积链）；部署后 1440/375 生产复验（保存→dashboard 重开→编辑→删除 全流程 + console clean）。

如无异议按此执行。
