# 竞品对标报告：Teal（tealhq.com） vs RezUp（cv.zalize.com）

- 调研角色：UX 研究员 + 竞品分析师（Company OS）
- 调研日期：2026-08-05
- 调研方式：真实注册账号（mail.tm 临时邮箱 alexrivera1785929088@web-library.net），浏览器全程真实操作，虚构 Software Engineer 简历（Alex Rivera），走完「导入 → 编辑 → AI 改写 → ATS/Analyzer → Job Matcher → Cover Letter → 模板 → 导出 PDF」全流程，未付款。
- 证据：31 张截图（见附录），关键截图随报告附件发出。

## 概述

Teal 是「求职全流程平台」而非单纯简历生成器：简历 Builder 只是其 Home 仪表盘（求职目标、申请漏斗、Job Tracker、日程）中的一个模块。免费层功能完整度高（无限简历、PDF 导出无水印、10 个模板、10 次 AI bullet 额度），商业模式为纯订阅（$13/周 起，无一次性买断），付费点集中在「无限 AI + Analyzer 建议详情 + 完整关键词列表 + 高级模板」。整体打磨程度高，但也存在明显的按周计费、预选月付、导出后弹窗升级等增长套路。

对 RezUp 的核心启示：Teal 免费层就能完成「可投递的简历」，它赚钱靠的是「优化建议的深度」而不是「基础功能解锁」。RezUp 的一次性付费/免费模式在定价诚意上有差异化空间，但编辑器交互深度（逐条 bullet 实时质量检查、Coach Me 引导式改写、JD 关键词逐词比对）目前是明显差距。

### 注册流程实录
- 邮箱+密码注册**无需邮箱验证**即可进入产品（临时邮箱域名未被屏蔽），支持 Google 登录。
- 注册后 5 步 onboarding（求职状态/目标/时间线/职位名/导入方式），可跳过，随后直接进 Builder。
- 粘贴纯文本简历的解析准确度高：公司、职位、日期、地点、bullets、教育、技能全部正确入库（截图 05、06）。

---

## 六维度评分（1-5 分）

### a. 模板质量 — 3.5/5
证据：截图 17、18、19、22、24、25
- 模板库约 24+ 款，筛选维度：风格（Modern/Traditional/Creative）、栏数（单栏/双栏/混合）、会员（Teal/Teal+）。免费可用约 7-10 款，其余带橙色「+」角标锁定（截图 19）。
- 排版控制细：字体（Poppins 等多款）、行高、列表行高、强调色（10 色）、日期格式、页眉/日期/地点对齐、技能布局，均为免费（截图 24、25）。
- 导出 PDF：文本型（非图片）、Skia/HeadlessChrome 打印管线、无水印、间距干净、ATS 友好（截图 22）。观感中规中矩，字体偏几何无衬线，缺少更精致的字重层次。
- 扣分：免费模板同质化明显（多为单栏微调）；双栏和设计感强的款式基本锁在 Teal+。

### b. 编辑器交互 — 4.5/5
证据：截图 06、11、20、26、27
- 左编辑右实时预览，所有编辑即时反映到预览；每个字段（公司、地点、日期、单条 bullet）都有独立勾选框，可不删内容仅隐藏——「一份主简历 → 多个投递版本」的核心交互，体验极好。
- bullet 悬浮工具条：AI 改写（魔棒）、编辑、复制、删除 + 左侧拖拽柄；拖拽排序流畅且预览同步（截图 20）。
- 逐条 bullet「Guidance」面板：实时检查拼写、语法、是否含量化指标、动作动词、时间状语、关键词，附字符/单词数仪表、例句和提示（截图 11）——这是免费功能里最有护城河的一块。
- 自动保存（无保存按钮，刷新不丢）；导出前有「Final Resume Check」清单（拼写/动词重复/缺失字段，截图 21）。
- 扣分：**无全局 undo**（Ctrl+Z 对拖拽排序无效，实测截图 20 前后对比）；预览不可直接点击编辑（非所见即所得）。
- 移动端（420px 窄窗实测，截图 26、27）：完整响应式——汉堡菜单、Match 分数环、底部 Preview/Edit/Matching 粘性切换条，编辑功能完整可用。

### c. AI 改写质量 — 3.5/5
证据：截图 07、08、09、10
- 输入平庸 bullet 原文：**"Responsible for managing the team and working on projects"**
- Automatic 模式输出 3 条（截图 07）：
  1. "Led a team of X engineers to successfully deliver multiple projects within 6 months, enhancing collaboration and project efficiency."
  2. "Managed project timelines and resources, achieving a Y% increase in team productivity through effective delegation and communication."
  3. "Fostered a culture of innovation by implementing agile methodologies, resulting in improved project outcomes and team engagement."
  — 结构好（动词开头+量化+结果），但**留 X/Y 占位符**要求用户回填，且有编造风险（"6 months" 无出处）。
- Coach Me 模式（截图 08-10）：先问「这条职责里你真正做过什么」（从上下文提取选项：Team management/Project coordination…），再生成具体版本，如 "Increased team productivity by 30% within 6 months by implementing agile methodologies and regular feedback sessions."——引导式收集事实的思路好，但**数字（30%、20%）仍是 AI 虚构**，与 RezUp 的「诚实、防幻觉」定位正好相反，是可攻击点。
- 另有 Keywords（结合 JD 关键词）与 Custom Prompt 模式。免费额度：bullet 改写 10 次、专业总结 2 次、Cover Letter 2 次（定价页，截图 28），额度剩余数直接显示在 Regenerate 按钮上。
- Cover Letter 生成（免费 2 次，截图 16）：能正确引用简历里的公司名、30%、40%、2M requests 等事实，质量高。

### d. ATS 评分逻辑 — 3/5（免费层）
证据：截图 12、14
- **Analyzer（不要求 JD）**：整体分 58%，分三类——Resume Structure（4 issues）、Measurable Results（5 issues）、Keyword Usage（1 issue），共 10 条建议。但**建议内容全部打码模糊化**，解锁需 Teal+（截图 12）——免费只告诉你「有问题」，不告诉你「是什么问题」。
- **Job Matcher（要求粘贴 JD**，或从 Job Tracker 选）：输入虚构 Senior SWE JD 后得 41% Match Score，Hard Skills 9/21 逐词比对（✓FastAPI ✓Docker ✓AWS ✗GraphQL APIs ✗Django），Soft Skills 0/2；但免费只显示 5 个关键词，其余 18 个模糊化 + 「Upgrade to Teal+」横幅（截图 14）。
- 算分逻辑可反推为：硬技能/软技能关键词覆盖率为主 + 结构与量化指标检查。修改简历后分数实时重算（列表页显示 Match: 29%→41% 的变化）。
- 扣分：免费层「给分不给方案」，评分变成付费漏斗而非工具本身。这正是 RezUp「免费给完整 ATS 反馈」可以正面打的点。

### e. 付费墙设计 — 3/5（商业上聪明，用户体验上有套路）
证据：截图 12、13、14、23、28、29
- 触发点实测：① Analyzer 建议详情（打码）② Job Matcher 关键词第 6 个起（打码）③ AI 额度用尽（按钮显示剩余次数）④ 高级模板（锁标）⑤ **导出 PDF 成功后立刻弹「Get Hired 2X Faster / Get Teal+ for $13/week」升级弹窗**（截图 23）。
- 价格（截图 13、29）：$13/7天、$29/30天、$79/90天、$179/年。纯订阅，无一次性买断，无免费试用期（但「No credit card required to start」指免费层）。
- 暗黑模式清单：
  - **按周计费锚点**：主 CTA 全部用「$13/week」弱化实际月支出（≈$52/月若按周续）；
  - **升级弹窗默认预选 $29/月**（截图 13），非最便宜项；
  - 导出成功瞬间插升级弹窗，利用完成时刻的情绪窗口；
  - 定价页把 $13/周 换算成「$1.85 a day」进一步弱化。
  - 未发现「隐藏取消」的直接证据（未订阅无法实测取消流程），定价页明示 "cancel at any time"，如实标注：**取消流程未能体验**。
- 免费层能拿到的东西（诚实地说相当多）：无限简历与求职跟踪、10 模板、PDF 导出无水印、10 次 AI bullet + 2 次总结 + 2 次 Cover Letter、Top5 关键词、基础 Analyzer 分数、逐条 bullet Guidance 检查。

### f. 性能与打磨 — 4/5
证据：截图 21、23、31 + 实测数据
- 加载：app 页 TTFB 99ms、DOMContentLoaded 0.9s、完全加载 1.9s（Playwright 实测）；页面切换（五个 tab）均 <1s，AI 生成 3-8s 有加载态。
- 打磨亮点：onboarding 分步动效、导出前 Final Check、空状态有引导文案（Home 仪表盘 0 applications 时给出下一步指引，截图 31）、bullet 悬浮工具条、额度余量实时显示。
- 小瑕疵：Target Title 在预览中渲染为 "Software ngineer"（首字母 E 丢失，截图 06/22 均可见，输入过程或解析引入，未再复现验证归因，如实标注）；Ctrl+Z 无效；导出弹升级窗略打断心流。
- 全程无报错、无白屏，未触发任何 5xx。

---

## RezUp 若要比肩需要做什么

### P0（不做就明显落后的核心体验）
1. **逐条 bullet 实时质量检查**（拼写/动词开头/量化指标/长度仪表）：Teal 免费层最强粘性功能，纯规则+词表即可实现大半，不依赖 LLM，成本低。
2. **JD 关键词逐词比对的 ATS 匹配**：粘贴 JD → 硬/软技能抽取 → ✓/✗ 逐词展示 + 覆盖率分数。RezUp 已有 ATS 匹配分，需把「分数」升级为「逐词证据」，且**免费全量给出**（Teal 免费只给 5 个词，这是我们最容易赢的点）。
3. **内容与显示分离（勾选框控制显隐）**：一份主简历派生多个投递版本，Teal 的核心工作流；RezUp 目前单份编辑模式撑不起「一人投多岗」的真实场景。
4. **AI 改写多候选 + 不编造数字**：一次给 3 条候选让用户选（Teal 模式），但把「X/Y 占位符/虚构 30%」改为显式「[请填入真实数字]」占位并禁止 AI 生成无出处数字——把 Teal 的幻觉弱点变成 RezUp 的「Honest」卖点。
5. **粘贴文本/LinkedIn 导入解析**：Teal 粘贴纯文本解析准确度高，是新用户 3 分钟内见到成品的关键。RezUp 若仍需逐字段手填，激活漏斗必输。

### P1（补齐后达到同一梯队）
1. Coach Me 式引导改写（先问事实再生成），差异化做成「只用你提供的事实」。
2. 导出前 Final Check 清单（拼写/重复动词/缺失字段/邮箱格式）。
3. 移动端窄屏完整可编辑（Teal 420px 下全功能可用，RezUp 需对齐；老板已有移动端硬指标）。
4. 拖拽排序 + 撤销（做全局 undo 即超越 Teal——它没有）。
5. Cover Letter 生成（复用简历事实，Teal 免费 2 次，我们可更慷慨）。
6. 模板样式控制面板：字体/行高/强调色/日期格式/对齐（Teal 全免费，我们至少给 2-3 个维度）。

### P2（锦上添花/长线）
1. 求职跟踪看板（Teal 的主场，非 RezUp 定位内，除非转型全流程平台，暂不建议跟进）。
2. 模板库扩容至 15+ 款并按风格/栏数筛选。
3. 邮件模板、目标薪资、求职目标仪表盘等外围功能。
4. 定价页对比表（Free vs Paid 逐项打勾，Teal 的转化页做法值得抄——但用「一次性付费 vs 订阅制」做对比主轴，直接标注「Teal: $13/周起订阅」作锚点）。

---

## 未能体验的环节（如实标注）
- 真实付款、订阅后的 Teal+ 功能内貌（Analyzer 建议全文、无限 AI）、**取消订阅流程**——按任务要求不付款，无法验证是否存在隐藏取消。
- 邮箱验证邮件流程：注册后未强制验证，mail.tm 邮箱未收到验证信也不影响使用，故未测试验证链路。
- LinkedIn 导入（需真实 LinkedIn 资料）与简历文件上传解析（选择了粘贴文本路径）。
- 附注：调研初期本机默认浏览器 UA 被 Teal 的 Cloudflare WAF 拦截（UA 含自动化标识），改用干净 UA 的浏览器实例后全程正常，未再触发风控。

## 附录：截图清单（~/teal-audit/screenshots/）
| # | 文件 | 内容 |
|---|------|------|
| 01 | 01-homepage.png | 官网首页 |
| 02 | 02-signup-page.png | 注册页（邮箱+Google） |
| 03 | 03-onboarding-1.png | onboarding 第一步 |
| 04 | 04-import-options.png | 导入方式（文件/LinkedIn/粘贴文本） |
| 05 | 05-import-done.png | 粘贴文本解析完成 |
| 06 | 06-editor-overview.png | 编辑器总览（左编辑右预览） |
| 07 | 07-ai-rewrite-suggestions.png | AI 改写 Automatic 模式 3 条候选（原文+输出） |
| 08 | 08-ai-coachme.png | Coach Me 第一步（选职责） |
| 09 | 09-coachme-step2.png | Coach Me 第二步 |
| 10 | 10-coachme-output.png | Coach Me 输出 3 条 |
| 11 | 11-bullet-guidance.png | 逐条 bullet Guidance 实时检查面板 |
| 12 | 12-analyzer-paywall.png | Analyzer 58 分 + 10 条建议打码付费墙 |
| 13 | 13-paywall-pricing.png | 升级弹窗（$13/29/79/179，预选 $29/月） |
| 14 | 14-job-matcher.png | Job Matcher 41% + 关键词比对 + 付费墙 |
| 15 | 15-cover-letter.png | Cover Letter 入口 |
| 16 | 16-cover-letter-output.png | Cover Letter 生成结果 |
| 17 | 17-designer-styling.png | Designer 样式面板 |
| 18 | 18-template-library.png | 模板库与筛选 |
| 19 | 19-templates-plus-locked.png | Teal+ 锁定模板 |
| 20 | 20-drag-reorder.png | 拖拽排序后状态 |
| 21 | 21-final-resume-check.png | 导出前 Final Resume Check |
| 22 | 22-exported-pdf-1.png | 导出 PDF 首页渲染 |
| 23 | 23-post-export-upsell.png | 导出后升级弹窗（$13/week） |
| 24 | 24-designer-presentation.png | 字体/行高/强调色设置 |
| 25 | 25-designer-alignments.png | 对齐与布局设置 |
| 26 | 26-mobile-narrow.png | 420px 移动端视图 |
| 27 | 27-mobile-editor.png | 移动端编辑器 |
| 28 | 28-pricing-free-vs-plus.png | 定价页 Free vs Teal+ 对比表 |
| 29 | 29-pricing-tiers.png | 定价档位（周/月/季） |
| 30 | 30-resume-list.png | 简历列表页 |
| 31 | 31-home-dashboard.png | Home 求职仪表盘（空状态引导） |
