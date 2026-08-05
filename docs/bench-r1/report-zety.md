# 竞品深度体验报告：Zety（zety.com）vs HonestCV（cv.zalize.com）

- 体验日期：2026-08-05（UTC）
- 体验方式：真实浏览器全流程操作（虚构 Software Engineer「Alex Chen」简历），mail.tm 临时邮箱注册真实账号，走到付款页为止（未真实付款）
- 账号：zetyaudit1785929120@web-library.net（临时域名直接被接受，**全程无邮箱验证**，注册后 mail.tm 收件箱 0 封邮件——连欢迎邮件都没有）
- 附录含全部截图清单（编号对应 screenshots/ 目录）

## 一、概述

Zety 是 Bold/Works Limited 系（同家族还有 LiveCareer、ResumeLab 等）的头部简历生成器。核心体验是一条打磨了多年的「向导式漏斗」：经验年限 → 模板选择 → 分步表单（联系方式/工作/教育/技能/摘要）→ Tips & fixes → 最终编辑器 → 下载付费墙。整体感受：**流程转化设计（含 AI 辅助）是业界顶级水平，但商业模式建立在争议性极强的「$1.95 试用 → 自动续费 $25.95/4周」订阅暗坑上**。免费用户唯一能拿走的是无格式 .txt 文件。

对 HonestCV 的一句话结论：Zety 的强项是「引导 + 内容代写」，弱项是「诚实定价 + 导出自由」。HonestCV 一次性付费/免费模式在信任维度上有天然优势，需要补齐的是引导式体验和 AI 内容质量（详见 P0/P1/P2 清单）。

## 二、六维度评分

### a. 模板质量 — 4/5
- 模板选择页按经验年限推荐，画廊内约 40+ 张模板卡（含变体；官方口径 18+ 模板 ×600+ 设计变体），单栏/双栏均有，每个模板约 7-8 种配色（DOM 中共数到 366 个配色 radio、34 种色名）。（截图 04、05）
- 排版细节可调：字体、字号档位（Small/Normal/Large）、Section/Paragraph/Line spacing 三级间距滑杆、"Advanced" 高级项。（截图 28）
- 选中的 "Charismatic" 类单栏模板观感干净、层级清晰。（截图 21）
- 扣分：**无法验证导出 PDF 观感**——PDF 导出在付费墙后（见 e），免费只有 .txt（版式全丢，见附件 Alex_Chen_Resume.txt）；模板卡缩略图较小、无法全屏预览细节。

### b. 编辑器交互 — 4/5
- 分步向导右侧有**实时预览**，填写联系方式时逐字符同步渲染。（截图 07）
- 最终编辑器：左侧 Templates/Design & formatting/Add section/Spell check 四个面板；Section order 支持**拖拽排序**，拖动后预览即时更新且屏幕阅读器播报 "You have moved the item from position 8 to position 6"（无障碍做得认真）。（截图 29）
- 预览区悬停即出现分节的 Rename/Edit/Delete 内联工具。（截图 31）
- 顶部持续显示 "Saved" **自动保存**状态；undo/redo 按钮在有操作后启用。
- 移动端（~530px 窄窗口）：编辑器出现横向滚动条，左侧工具栏仍占宽度，Download/Print 按钮被挤出屏幕（DOM 标记 offscreen），体验明显降级。（截图 32）
- 扣分：窄屏适配一般；富文本编辑器焦点管理有坑（页面级 Ctrl+A 会全选整页；本次测试中文本一度出现重复插入 "Responsible for mResponsible for..."，虽有自动化操作因素，但编辑器未做输入保护）。（截图 11 原文行可见）

### c. AI 改写质量 — 3.5/5
- 输入平庸 bullet：**"Responsible for managing the team and working on projects"**
- 点击 "Enhance with AI" 后给出三组、每组 3 条的改写（Simplify / Elevate impact / Highlight result），单选一组整体替换：（截图 11）
  - Simplify: "Managed team to ensure successful project execution and delivery." / "Oversaw project management activities to meet deadlines and objectives." / "Coordinated collaboration among team members to optimize performance."
  - Elevate impact: "Directed team efforts to achieve project milestones and exceed expectations." / "Facilitated project management processes to maintain timelines and quality standards." / "Led team in executing projects, driving efficiency and effectiveness."
  - Highlight result: "Supervised team operations to enhance project outcomes and drive success." / "Streamlined project workflows to improve overall team productivity." / "Guided team through project phases, ensuring alignment with goals."
- 评价：动词升级到位、速度快（~3-5s）、三档意图分类是好交互；但**输出全是空洞的模板句，零量化指标**（没有提示用户补数字/成果），"Highlight result" 一档其实没有 result。摘要生成（3 个 "PERSONALIZED FOR YOU" 版本，按 Technical Expertise/Leadership/Project Execution 分角度）会引用已填技能，个性化程度尚可。（截图 16）
- 另：技能推荐第一屏出现 Bentley InRoads、CADPIPE、Bioreactor Design 等与软件工程师无关的项（题库检索质量参差），但弹窗 "top 4 skills" （Javascript/SQL/OOP/Python）是准的。（截图 14、15）

### d. ATS 评分逻辑 — 3/5
- 两层机制：
  1. **Tips & fixes**（prefinalize 页）：按 Best practices / Spelling and grammar / Missing details 三类给出建议，如 "List 6-12 skills"、加行业关键技能、重排技能顺序，一键 Add/Accept。（截图 17、18、22）
  2. **Resume Score**（最终编辑器右下角）：0-100 分（本次 73 分），文案 "Resume above 70 tend to land more interviews"，展开后按 section 列出扣分点（Education 1 条、Work History 2 条）。（截图 21、22）
- 评价：本质是**完整度/最佳实践启发式检查**，不是真正的 JD 匹配——**全程未要求上传 JD**，也不展示关键词覆盖分析。"SmartApply™/ResumeCheck 帮你打败 ATS" 更多是营销话术（声称检查 30+ 项）。（截图 19）
- HonestCV 的 ATS 匹配分若基于 JD 关键词对比，在这个维度上已经比 Zety 更实质。

### e. 付费墙设计 — 2/5（体验分；作为转化机器可打 5/5）
- 触发链路：全部内容填完（沉没成本最大化）→ "Your perfect resume is ready!" 强制注册（截图 24、25）→ 点 Download 直接跳付款页。
- 价格结构（截图 26、27）：
  - **14-Day Access $1.95**（默认预选，标 "MOST POPULAR"）——小字：**14 天后自动续费 $25.95/4 周**（≈$28/月）
  - Annual Access $5.95/mo
- 暗黑模式清单：
  1. 预选带自动续费的试用价，续费条款仅在卡片底部和付款页脚注小字披露；
  2. 制造紧迫感："603 people have used the 14-Day Access in the last 24 hours!"，脚注自认 "The number shown is a result of a calculation"；
  3. 名企 logo 墙（Amazon/Google/Walmart…）脚注自认与这些公司无任何关联；
  4. 注册即默认同意接收营销邮件（无勾选框，文字声明式同意）；
  5. 取消需登录账户操作/邮件/打客服电话（800-985-7561），未提供一键取消。
- 免费能拿到什么：**只有 .txt 纯文本下载**（"Subscribe before you download?" 弹窗左下角小链接，截图 30、31），简历数据和编辑器本身免费无限用。PDF/DOCX/打印/邮件全部付费。
- 正面项：14 天退款保证、电话/在线取消渠道明示。

### f. 性能与打磨 — 4/5
- SPA 路由切换即时；final-resume 页 navigation timing：TTFB 224ms / DOMContentLoaded 343ms / load 356ms（缓存后），首次冷加载主观 2-3s。
- 全流程无报错、无空状态破绽；每步都有插画、进度条（Resume Completeness 0→100%）、"Taylor 简历专家" 人设文案，打磨度很高。
- 无障碍：拖拽有 aria 播报、表单 label 完整、键盘可达——明显投入过。
- 扣分：营销弹窗密度极高（几乎每步一个 nudge：Add another role / 304,000 job seekers 横幅 / 订阅弹窗），窄屏降级明显。

## 三、HonestCV 若要比肩需要做什么

### P0（不做就明显落后的核心体验）
1. **引导式分步向导 + 实时预览**：Zety 的最大优势是"不让用户面对空白页"。HonestCV 需要 Contact→Experience→Education→Skills→Summary 的分步流程，右侧实时渲染，含完成度进度条。
2. **AI 改写的「多方案单选」交互**：不要只给一个改写结果；提供 2-3 组不同意图（精简/强化影响/突出成果）×每组多条，用户单选替换。同时**做 Zety 没做的：主动提示补量化数字**（如"加一个百分比或金额会更有力"）。
3. **预写内容库（bullet/摘要示例按职位检索）**：Zety 靠海量 pre-written examples 让小白 10 分钟出简历。HonestCV 至少要为主流职位提供可一键插入的示例 bullet 和技能清单（用 LLM 实时生成也行，但要有"按职位搜索"入口）。
4. **分级 Tips & fixes 检查器**：完整度/最佳实践/拼写三类问题分级列出，一键修复（加技能、重排、补章节）。这与现有 ATS 匹配分互补且成本低。
5. **把「诚实定价」做成武器**：在导出/定价页明示"一次付费、无订阅、无自动续费"，直接对比竞品 $25.95/4 周的暗坑（不点名或点名均可）。这是 Zety 用户最大的痛点（Trustpilot/Reddit 上大量 "$1.95 变 $25.95" 投诉）。

### P1（显著提升竞争力）
6. 模板配色/字体/间距自定义（每模板 5-8 配色 + 3 档字号 + 间距滑杆），保持 ATS 安全的前提下给个性化空间。
7. 分节拖拽排序 + 悬停内联编辑/重命名/删除 + 明示自动保存状态（"Saved" 指示器）。
8. AI 摘要生成：按已填经历/技能生成 3 个不同角度的摘要供选择。
9. 移动端编辑器完整适配（Zety 在这里是弱项，可反超：HonestCV 验收标准本就要求移动端）。
10. 导出前诊断报告页（相当于 Zety 的 prefinalize），把 ATS 分数、缺失项、修复建议汇总为一页，提升导出仪式感与信任。

### P2（锦上添花/差异化）
11. 求职信（cover letter）配套生成——Zety 订阅卖点之一。
12. 个性化在线简历 URL（Zety 的 "Personalized URL" 卖点）。
13. 按经验年限/学历的模板推荐问卷（2 问即可，提升新手决策速度）。
14. 拼写检查器独立入口。
15. 无障碍打磨（键盘拖拽播报、aria-label 全覆盖）——Zety 做到了，值得对齐。

## 四、未能体验的环节（如实标注）
- **付费后的 PDF/DOCX 导出观感、Cover letter builder、Personalized URL、付费版 ResumeCheck 完整报告**：需真实付款，本次按要求未付款。
- Google/Facebook OAuth 注册路径未走（邮箱注册已成功，无需回退）。
- 邮箱验证环节不存在（Zety 不验证邮箱，临时域名直接可用）。

## 附录：截图清单（screenshots/）
| # | 文件 | 内容 |
|---|---|---|
| 01 | 01-homepage.png | Zety 首页 |
| 02 | 02-onboarding-experience.png | 经验年限问卷 |
| 03/04/05 | 03/04/05-template-gallery*.png | 模板画廊（含配色选择） |
| 06/07 | 06-wizard-contact.png / 07-contact-filled-livepreview.png | 联系方式表单 + 实时预览 |
| 08 | 08-ai-recommendations-modal.png / 08b | 工作经历 AI 推荐生成 |
| 09 | 09-bullet-editor-prewritten.png | bullet 编辑器 + 预写示例 |
| 10/11 | 10-ai-test-input-bullet.png / 11-ai-rewrite-3variants.png | AI 改写测试原文与三组输出 |
| 12/13 | 12-bullet-after-ai-apply.png / 13-nudge-add-details.png | 应用改写 + 追加详情 nudge |
| 14/15 | 14-skills-suggestions.png / 15-top-skills-modal.png | 技能推荐（含无关项）+ top4 技能弹窗 |
| 16 | 16-ai-summaries.png | AI 摘要三版本 |
| 17/18 | 17-tips-fixes-modal.png / 18-tips-fixes-panel.png | Tips & fixes 检查 |
| 19 | 19-smartapply-upsell.png | SmartApply ATS 营销页 |
| 20/21 | 20-final-editor.png / 21-final-editor-templates-score73.png | 最终编辑器 + Resume Score 73 |
| 22 | 22-score-suggestions.png | 评分扣分项明细 |
| 23 | 23-download-format-modal.png | 下载格式选择（PDF/DOCX/TXT） |
| 24/25 | 24-create-login-wall.png / 25-signup-modal.png | 注册墙 |
| 26 | 26-paywall-plans.png | 付费墙：$1.95 预选 + $25.95/4周 自动续费 |
| 27 | 27-payment-checkout.png | 付款页（未付款） |
| 28/29 | 28-design-formatting-panel.png / 29-drag-reorder-works.png | 设计面板 + 拖拽排序 |
| 30/31 | 30-subscribe-before-download.png / 31-txt-downloaded-free.png | 下载拦截弹窗 + 免费 txt |
| 32 | 32-mobile-narrow-editor.png | 窄窗口（~530px）编辑器降级 |
