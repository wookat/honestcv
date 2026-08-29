# R1 差距审计：Rezi vs RezUp（2026-08-29 一手取证）

**取证方式**：真实注册并使用 app.rezi.ai（临时邮箱账号），Playwright 逐屏截图 1440/375 双视口；同法截取 cv.zalize.com 生产站。证据存档于会话机 `~/audit-r1/shots{,-app}/`（截图 38 张）。仅研究公开可见页面与交互，未复制受保护素材。

**置信度**：以下均为 2026-08-29 实测事实（除标注「推断」外）。

## 一手观察摘要

### Rezi 编辑器（登录后实测）
- 分步分区导航：Contact → Experience → Education → Skills → Summary → Finish Up & Preview → AI Cover Letter。
- 左侧常驻诊断卡：Rezi Score 实时变动（实测 0→26→36），锁定的 PRO 项（Personal Pronoun / Buzzwords / Passive Voice / Filler Words / Wordy Content）+ 免费诊断（Dates missing、bullet 数量、量化 bullet、best practices applied 计数）。
- AI 建议：Experience 表单内「SUGGEST BULLET」生成完整 bullet，「APPLY SUGGESTION」一键写入；保存有「Changes Saved」toast。
- Finish Up 页：Rezi Score 仪表盘 + 「EXPLORE MY REZI SCORE」弹窗——5 个子维度分（实测 Content 58 / Format 30 / Optimization 0 / Best Practices 45 / Application Ready 35）、与他人对比的分布直方图（percentile）、逐条可点击的整改项（含指向具体 experience 的链接）。
- AI Keyword Targeting（Finish Up 右栏）：基于 JD 逐个提示缺失关键词（React/TypeScript/Node.Js/REST APIs/PostgreSQL），每个词问「Is this missing keyword relevant?」→「YES - ADD BULLET POINT」一键生成含该关键词的 bullet / NO 跳过。
- 排版工具栏：字体、字号、行高、边距、Letter/A4、颜色、Auto-Adjust（一键调满一页）、View as pages。

### Rezi 操作台/入口
- 必须注册（邮箱验证码）→ 3 步 onboarding（求职挑战/是否已有目标职位/是否共享给 hiring partners，含隐私选项）→ dashboard。
- 紫色侧栏多产品：Resumes / AI Resume Agent / AI Interview / Job Search / Sample Library / Review My Resume + 用量计数 + Upgrade。
- 新建简历弹窗：命名、经验档位、导入 PDF/DOCX、LinkedIn 插件、语言、Target your resume 开关（职位/公司/JD 三字段）、免费 formatting review 开关。

### Rezi 落地页（1440/375）
- 常规导航（Product/Enterprise/Templates/Resources/Pricing/Login/Try for free），主标题「Free AI Resume Builder」，强社会证明（用户数、评分、媒体标）、大型产品 mockup、超长页面（功能分区逐一展开、对比、FAQ、深色「不按月收费」区）。

### RezUp 现状（生产实测）
- 无需注册直接进 builder（差异化优势，保留）。已有：导入/备份/恢复/多副本、模板筛选+网格、颜色/纸张/字号/行距控制、ATS match score（keyword 70% + structure 30%）、Missing keywords 列表、Health report、Target job 输入、JD tailoring（逐条 AI 建议+review-before-apply）、PDF/DOCX/TXT/MD 导出。
- 落地页较短，信任背书弱，产品 mockup 简单。

## 差距清单（P0/P1/P2）

### 操作台（核心工作区）
- **P0-1 分数深度**：Rezi 有 5 子维度分解 + 百分位分布 + 逐条整改项弹窗；RezUp 只有单一 score + missing 列表 + 结构 checklist。缺「分数是怎么来的、改哪里能涨几分」的闭环。
- **P0-2 关键词落地闭环**：Rezi 缺失关键词→一键生成含该词的 bullet；RezUp 只列出 missing 关键词，用户需自己想怎么写进去。
- **P1-3 逐 bullet AI 建议入口**：Rezi 在每条 experience 表单内即时 SUGGEST BULLET；RezUp 的 AI 改写在独立 tailoring 面板，编辑现场感弱。
- **P1-4 内容质量诊断可见性**：guidance.ts 已有 weak-opener/no-metric/filler/first-person 检查，但埋在 Health 弹窗；Rezi 把同类诊断常驻左栏并计数。
- **P2-5 Auto-Adjust 一键排满一页**、View as pages。

### 功能深度
- **P1-6** 求职配套产品面（cover letter 已有？需核实入口曝光）、interview prep、sample library —— RezUp 有 cover letter/interview（Career Bundle）但入口弱。
- **P2-7** LinkedIn 导入、公司/学校自动补全。

### 落地页
- **P1-8** 页面长度/信任背书/产品 mockup 真实感明显弱于 Rezi；缺对比区、FAQ 深度、社证数字。
- **P2-9** 导航信息架构（Templates/Resources 下拉）。

### 架构
- **P2-10** 现架构（Workers+KV+浏览器本地数据）符合产品定位，无需大改；分数子维度化需要重构 ats.ts 输出结构（本轮做）。

## R1 实现批次选择
本轮聚焦 **P0-1 + P0-2 + P1-4**（操作台分数深度闭环），理由：这是「真正的操作台」差距的核心，且可纯前端完成、风险低。落地页（P1-8）进 R2，bullet 现场 AI（P1-3）进 R3。
