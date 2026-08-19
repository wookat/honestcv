# Rezi (rezi.ai) 竞品深度体验报告 — 对标 RezUp

日期：2026-08-05 ｜ 方式：真实注册账号 + 全流程浏览器实测（mail.tm 临时邮箱 alexcarterdev9127@web-library.net 成功收到验证码并激活，未被屏蔽）｜ 虚构简历：Alex Carter, Software Engineer（含目标 JD 定向）

## 概述

Rezi 是订阅制 AI 简历生成器（免费层 + Pro $29/mo / 季度 $19/mo / Lifetime $149），核心卖点是「Rezi Score」实时评分 + AI 写作 + JD 关键词定向。实测走通了注册 → 建简历（Targeted 模式粘贴 JD）→ 编辑五个分节 → AI 补写 bullet / AI Summary → Rezi Score / Keyword Targeting → 免费下载 PDF → DOCX 撞硬付费墙的完整链路。整体打磨度高，付费墙策略是「功能可见但降级/加锁」而非一刀切。

总评：产品体验成熟（约 4/5），但免费层限制极多（1 份简历、3 次 PDF、10 次 AI 生成、1 个模板），这是 RezUp「一次性付费/免费」定位可直接攻击的软肋。

## 六维度评分

### a. 模板质量 — 3.5/5
- 模板库共 **11 个**（Standard / Compact / Modern / Harvard / Jake's Resume / Bold / Alternative / Highlight / Highlight Compact / Dev / Dev Compact），全部为 **ATS 单栏**风格，无双栏花哨模板（与 RezUp 定位相同）。
- **免费仅 1 个**（Rezi Standard Format），其余 10 个全部 PRO 加锁（证据：22、23）。
- 排版控件完善：字体（Merriweather 等）、字号、行距、段距、Letter/A4、分页「Break」标记、Auto-adjust 一键压缩到一页（证据：19）。
- 导出 PDF 观感干净、无水印、文本可复制、单页排版正确（证据：25、rezi-export.pdf）。扣分点：免费只有一种版式，字体偏小（默认 9pt）。

### b. 编辑器交互 — 4/5
- 分节向导式（Contact → Experience → Education → Skills → Summary → Finish up & Preview），每节有教学视频；编辑时无实时简历预览，**只有到 Finish up 页才能看到整页预览**，预览页支持直接点击 contenteditable 修改（证据：11-13、19）。
- 自动保存（"Changes saved" toast、"Last Saved: a few seconds ago"），离开未保存表单会弹 Heads-up 挽留框。
- Experience 列表支持 Sort by date；未观察到自由拖拽排序整个分节的能力（未深测，如实标注）。
- 公司名自动识别补全（输入 TechNova Solutions 会提示确认公司实体「以获得更好的 AI 结果」）。
- 缺陷实测：日期输入框直接打字会出错（"June 2022" 变 "August 2026 2022"，必须用日历控件）；contenteditable bullet 区首字符偶发丢失（"Built" 变 "uilt"，证据见流程记录）；undo 依赖浏览器 Ctrl+Z，无显式撤销按钮。
- 窄窗（420px）响应式良好：侧栏收起为汉堡菜单，表单单列（证据：29）。

### c. AI 改写质量 — 3.5/5
- 输入基准平庸句：`Responsible for managing the team and working on projects`
- AI Complete 输出：`Responsible for managing the team and working on projects by coordinating sprint activities, implementing agile workflows, and delivering reliable software meeting client requirements`（证据：15）
- 特点：**只做续写扩充，不重写句式** —— 弱开头 "Responsible for" 原样保留，且没加量化数字；同时左侧实时诊断（Buzzwords / Passive Voice / Filler Words / Wordy Content 等 6 项）会标记问题，但这些诊断本身多数是 PRO 锁定的（证据：14、16）。
- AI Summary Writer 表现更好：自动读取简历上下文 + 目标 JD，生成的 Summary 准确引用了 4 年经验、2M 请求、45% 优化、目标公司 Acme Corp（证据：18）。
- 免费额度：AI GENERATIONS 10 次（用 2 次后显示 2/10）。

### d. ATS 评分逻辑 — 4.5/5（Rezi 最强项）
- **Rezi Score 0-100** 常驻右侧，随内容增加实时涨分（实测 40 → 45 → 57 → 62），分五个子维度：Content 54 / Format 56 / Optimization 100 / Best Practices 74 / Application Ready 62，还有「与其他用户对比」的百分位直方图（证据：21）。
- 建议具体可执行：bullet 未加句号、简历只有 0.47 页、总词数 120（建议 400-800）、Summary 过长（建议约 30 词）；每条附文档链接。但 Personal pronouns / Buzzwords / Passive voice / Filler words 详情 PRO 锁定。
- **JD 不强制但深度集成**：创建时可选 Targeted Resume 粘贴 JD；之后 AI Keyword Targeting 自动比对——已命中 React / REST APIs / JavaScript / PostgreSQL，缺失 Node.js 时直接给「Yes - Add Bullet Point」一键生成含该关键词的 bullet；其余 10 个缺失关键词**文字乱码模糊化 + PRO 锁**（证据：20）。
- 这套「分数 + 子维度 + 一键修复 + 关键词 gap」闭环是 RezUp ATS 匹配分最该对标的形态。

### e. 付费墙设计 — 3.5/5（体验角度；商业上激进）
- 免费层（pricing 页明示，证据：30）：1 份简历、3 次 PDF 下载、10 次 AI 生成、1 个模板、1 次 AI Interview；Rezi Score / Keyword Targeting / 内容诊断均为 Limited。
- 触发点实测：① 首次点 Download PDF **能成功下载**，但下载完立即弹 "Nice job with your resume!" 升级弹窗（证据：24）；② 下载菜单显示 "Downloads left: 2"（证据：26）；③ **DOCX 导出硬付费墙**，弹 "Upgrade to Pro"（证据：27）；④ 模板切换、关键词列表、诊断详情全部 PRO。
- 价格：Monthly $29/mo、Quarterly $19/mo（标 Most Popular - Save 34%）、Lifetime $149 一次性；人工 Expert Review 单独按字收费（12h $29.90 / 1d $24.70 / 2d $19.50，证据：28）。
- 暗黑模式评估：**默认选中 $29 Monthly 而非更便宜的 Quarterly**（轻度引导）；乱码模糊化关键词制造 FOMO；但无强制绑卡（"free to start, no card required" 属实）、弹窗可关闭、无隐藏取消入口的证据 —— 总体克制，不算恶劣。

### f. 性能与打磨 — 4/5
- 应用加载快（SPA，编辑器秒级切换分节），AI 生成 3-8 秒有骨架动画，PDF 生成约 5 秒。
- 空状态好：每个分节有示例占位、教学视频、AI 建议入口；空 dashboard 有「点击创建或拖入简历」卡片。
- 保存/校验反馈即时（toast、实时诊断、公司名确认）。
- 小毛病：日期控件打字容错差、contenteditable 偶发吞首字符、部分文案组件（"Downloads left" 藏在二级菜单）不够醒目。

## RezUp 若要比肩需要做什么

### P0（不做就明显落后）
1. **常驻实时 ATS 分数 + 子维度拆解**：不只给一个总分，学 Rezi 拆 Content/Format/Optimization/Best Practices，每条建议给「怎么改」并可点击跳转对应位置；分数随编辑实时变动是留存钩子。
2. **JD 关键词 gap 一键修复**：已命中/缺失关键词清单 + 「为缺失关键词生成一条 bullet」按钮。Rezi 把缺失关键词锁在 PRO，RezUp 免费全开就是最直接的差异化打点。
3. **AI 改写要重写而非续写**：Rezi 保留 "Responsible for" 弱开头是明显短板。RezUp 应输出强动词开头 + 量化占位（如 "Led a X-person team..."），一次给 2-3 个候选。
4. **免费导出无阉割**：Rezi 免费限 3 次 PDF、DOCX 完全锁死。RezUp 的 PDF/DOCX 无限免费导出必须在落地页和编辑器里大声说出来。
5. **自动保存 + 未保存挽留 + 即时反馈 toast**：这是 Rezi 打磨感的基础盘。

### P1（重要提升）
6. 编辑器全程实时预览（Rezi 要到最后一步才能看整页，这是它的弱点，RezUp 可以做得更好）。
7. 日期用日历/下拉控件并支持直接打字容错（Rezi 在此翻车）。
8. Auto-adjust 一键压缩到一页 + 分页 Break 可视化。
9. AI Summary 生成时自动带入简历上下文与目标 JD（Rezi 此功能体验最好，值得抄）。
10. 移动端窄屏响应式（Rezi 已做到可用级）。
11. 公司名/学校名自动补全确认，提升 AI 上下文质量。

### P2（打磨/差异化）
12. 「与其他用户对比」百分位图，增强分数可信度。
13. 每分节教学视频或内嵌最佳实践提示。
14. 模板库按 Simple/Modern/Compact 分类筛选；RezUp 可强调「全部模板免费」。
15. 简历上传导入（PDF/DOCX 解析回填）与 LinkedIn 导入。
16. 定价页透明对比表（Rezi 的 Compare all features 表做得清楚，反而是信任加分项）。

## 未能体验/局限（如实标注）
- 未真实付款，Pro 解锁后的模板渲染、DOCX 内容、完整关键词列表、Pro 诊断详情均未见到实物。
- 人工 Expert Review、AI Interview、AI Resume Agent、Cover Letter 未深测（非本次对标核心）。
- 分节拖拽排序能力未确证。
- 注册链路无阻碍：mail.tm 域名未被屏蔽，验证码邮件 8 秒内到达。

## 附录：截图清单（~/rezi-research/screenshots/）
| # | 文件 | 内容 |
|---|------|------|
|01|01-homepage.png|官网首页|
|02|02-signup.png|注册页|
|03-06|03~06-*.png|首次登录 onboarding 三步|
|07|07-dashboard-empty.png|空 dashboard 空状态|
|08-10|08~10-create-resume-*.png|新建简历弹窗 + Targeted JD 模式|
|11-12|11~12-*.png|Contact 分节 + 自动保存提示|
|13-14|13~14-*.png|Experience 空状态 + bullet 实时写作诊断|
|15|15-ai-complete-bullet.png|AI 改写基准 bullet 原文与输出|
|16|16-experience-saved-score40.png|保存后 Rezi Score 出现|
|17|17-ai-skills-explorer.png|AI Skills Explorer|
|18|18-ai-summary-writer.png|AI Summary Writer（带 JD 上下文）|
|19|19-finishup-preview-score57.png|Finish up 预览 + 排版工具栏|
|20|20-keyword-targeting-pro-locked.png|关键词命中/缺失 + PRO 乱码模糊|
|21|21-rezi-score-breakdown.png|Rezi Score 五维拆解 + 百分位|
|22-23|22~23-templates-*.png|模板库 11 款、10 款 PRO 锁|
|24|24-paywall-after-pdf-download.png|PDF 下载后升级弹窗（$29/$19/$149）|
|25|25-exported-pdf-page-1.png|导出 PDF 渲染效果（无水印）|
|26|26-download-menu-limits.png|Downloads left: 2 + DOCX 入口|
|27|27-docx-paywall.png|DOCX 硬付费墙|
|28|28-expert-review-pricing.png|人工 Review 按字计价|
|29|29-mobile-narrow-responsive.png|420px 窄窗响应式|
|30|30-pricing-page.png|官方定价页（免费层明细）|
