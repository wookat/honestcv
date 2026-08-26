# 对标复刻批次1·A阶段 —— 主标尺竞品《逐屏图鉴》

- 我方产品：RezUp（https://cv.zalize.com，仓库 wookat/honestcv）
- 主标尺：**Rezi**（https://www.rezi.ai，Forbes 推荐，自称 4.3M 用户）
- 参照：Kickresume（https://www.kickresume.com）、FlowCV（https://flowcv.com）
- 采集时间：2026-08-26；采集方式：Playwright headless Chromium，桌面 1440×900 / 移动 375×812（DPR 2），整页截图；设计参数经公开页面 `getComputedStyle` 实测（原始数据见 `design-params.json`）
- 合规边界：只截图与读取公开页面 DOM/CSS；未反编译、未复制竞品文案/图片/图标素材。QA 流量按 testing-rezup skill 约定标记（`honestcv.qa=1`），且 headless UA 本身被我方统计丢弃，不污染线上数据。

## 截图索引（`screens/`）

### Rezi（主标尺）
| # | 屏 | 桌面 | 移动 375px |
|---|----|------|-----------|
| R01 | Landing 首页 | `rezi-01-landing-desktop.png` | `rezi-01-landing-mobile375.png` |
| R02 | Pricing 定价 | `rezi-02-pricing-desktop.png` | `rezi-02-pricing-mobile375.png` |
| R03 | 模板库 /resume-templates | `rezi-03-templates-desktop.png` | `rezi-03-templates-mobile375.png` |
| R04 | AI 功能页 /ai-resume-builder | `rezi-04-ai-resume-builder-desktop.png` | — |
| R05 | 免费工具枢纽 /tools | `rezi-05-tools-desktop.png` | — |
| R06 | 简历示例库 /resume-examples | `rezi-06-resume-examples-desktop.png` | — |
| R07 | 注册页（app.rezi.ai/signup，右侧含 Dashboard 预览图） | `rezi-07-signup-desktop.png` | — |

**登录后界面（编辑器 / AI Keyword Targeting 实操 / Rezi Score 评分面板 / Dashboard 空态）：待域名邮箱注册后补。**
注册边界内的过渡证据：R01 hero 内嵌完整编辑器 mock（左侧分区导航+中央文档+右侧评分 92 分环）、R04 内嵌 Keyword Targeting 面板、R05 内嵌 Cover Letter 编辑器、R07 右侧为官方 Dashboard 渲染图（Resumes/Cover Letters/Resignation Letters 三 Tab + 卡片网格 + Keyword Targeting 浮层）。以上均来自官网公开素材，足以支撑 A 阶段骨架分析；像素级参数待注册后补。

### RezUp（我方同屏）
| # | 屏 | 桌面 | 移动 375px |
|---|----|------|-----------|
| Z01 | Landing 首页（含定价+FAQ 同页） | `rezup-01-landing-desktop.png` | `rezup-01-landing-mobile375.png` |
| Z02 | 编辑器 /builder（空态） | `rezup-02-builder-empty-desktop.png` | `rezup-02-builder-empty-mobile375.png` |
| Z03 | ATS 检查器 /ats-checker（空态） | `rezup-03-ats-checker-desktop.png` | — |
| Z04 | 模板枢纽 /templates/ | `rezup-04-templates-hub-desktop.png` | `rezup-04-templates-hub-mobile375.png` |
| Z05 | 示例枢纽 /examples/ | `rezup-05-examples-hub-desktop.png` | — |

### 参照竞品
| # | 屏 | 文件 |
|---|----|------|
| K01/K02 | Kickresume Landing / Pricing | `kickresume-01-landing-desktop.png` / `kickresume-02-pricing-desktop.png` |
| F01/F02 | FlowCV Landing / Pricing | `flowcv-01-landing-desktop.png` / `flowcv-02-pricing-desktop.png` |

---

## 设计参数表（公开页 DOM/CSS 实测）

### Rezi 营销站（www.rezi.ai）
| 参数 | 实测值 |
|------|--------|
| 页面底色 | `#FAFAFA`（近白暖灰）；穿插整段纯黑 `#000` 分区与品牌蓝 `#4D5DFB` 系全宽 CTA 带 |
| 正文字体 | Inter Variable，17.6px / 行高 26.4px（1.5）/ 字重 450 / 颜色 `#545454` |
| H1 展示字体 | **PP Neue Montreal**，55.5px / 行高 63.8px（1.15）/ 字重 500 / 字距 -0.28px / 纯黑 |
| 次级标题 | 同族 45.9px、26.1px 两档，字重 500 |
| 容器最大宽 | **1344px** |
| 按钮 | 圆角 8px；营销页按钮高约 34px（padding 8px 16px）；hover 过渡 0.2–0.3s `cubic-bezier(0.165, 0.84, 0.44, 1)`（easeOutQuart，明显的「快进慢出」手感） |
| 章节节奏 | 大段留白 + 黑白蓝三色块交替（白底功能区 → 纯黑情绪区「You're not getting ghosted by humans」→ 品牌蓝转化区），每屏一个主张 |

### Rezi 应用端（app.rezi.ai，注册页可见部分）
| 参数 | 实测值 |
|------|--------|
| 字体 | Source Sans Pro 16px/24px，标题 24px/600 |
| 主色按钮 | `#4D70EB`，圆角 6px，高 48px，白字 700 |
| 过渡 | 0.15s `cubic-bezier(0.4, 0, 0.2, 1)`（Tailwind 默认） |
| 布局 | 左右分栏：左 40% 白底表单（Google/Apple OAuth 置顶 + OR 分隔 + 邮箱密码），右 60% 品牌蓝渐变底 + Dashboard 产品渲染图 |

### RezUp 现状（cv.zalize.com）
| 参数 | 实测值 |
|------|--------|
| 页面底色 | `oklch(0.99 0.002 250)`（近白冷灰） |
| 正文字体 | Inter 16px / 24px / 400 / `oklch(0.18 0.02 260)` |
| H1 展示字体 | Sora，Landing 48px / 行高 48px（1.0）/ 700 / 字距 -1.2px；内页 32–36px |
| 容器最大宽 | **1152px**（max-w-6xl） |
| 按钮 | 圆角 8px；主 CTA `oklch(0.5 0.18 265)`（品牌蓝紫）高 44px；次级白底描边 |
| 过渡 | 统一 0.15s Tailwind 默认曲线；hero 有 rise-in（--rise-delay 0/60/120/180ms） |
| 章节节奏 | 单页长 Landing：hero → 3 步 → 6 卖点卡 → 模板墙 → 对比表 → 定价 → FAQ → 尾部 CTA；段间 padding 32–64px |

---

## 逐屏图鉴（主标尺 Rezi）

### R01 · Landing
- **骨架**：满宽白底。顶部细导航（Logo + Product/Enterprise/Templates/Resources/Pricing + Login/Try for free）。Hero 为「小字眉题 + 55px 双行大标题 + 单 CTA」，紧跟一个**占满首屏的真实编辑器 mock**（左侧紫色分区图标栏、中央文档、右上角评分环 92），这是 Rezi 首屏的核心说服物。
- **下方节奏**：合作/集成 logo 带（Google、OpenAI、Zapier…）→ Forbes 引言卡 → 数据带（60.4%、4,350,834 用户、8.23/10）→ 纯黑「Build / Score / Target」三步区（每步配 UI 局部截图）→ 黑底情绪区「You're not getting ghosted by humans」→ 白底 ATS 模板区（内嵌示例简历 + 横向模板缩略滑轨）→ 品牌蓝三连功能区（Job search / AI agent / Mock interview，各配 UI 截图）→ 黑底工具矩阵 → 用户评价三列 → 定价双卡（$29 Pro / $0 Free）→ FAQ 手风琴 → 蓝底终 CTA → 超大 footer。
- **移动 375px**：导航折叠为汉堡；hero 文字居中堆叠；编辑器 mock 缩放保留；黑/白/蓝分区节奏完整保留；卡片全部单列。

### R02 · Pricing
- 三卡结构：Free $0（灰按钮 Try for free）/ **Pro $29 高亮卡（深色底、Get started 白按钮、放大 105%）** / Enterprise $99（Book a demo 黑按钮）。卡内为逐行带勾功能清单。
- 下方：logo 信任带 → Trustpilot 引言 → **全功能对比长表**（Usage / Advanced Resume Tech / Rezi AI Writer / Interview / Resume Review / Downloading / Template Formats / User & Team Access 分组，Pro 列以浅蓝底高亮贯穿全表）→ FAQ（左侧类目锚点 + 右侧手风琴）→ 蓝底终 CTA。
- 关键定价锚点：AI 写作、Keyword Targeting、无限简历/下载、简历人工 Review 全部压在 Pro 付费墙后；Free 只给 1 份简历 + 有限 AI。

### R03 · 模板库
- H1 55px + 右侧引导文案。模板按**用途策展分组**：Latest arrivals / Recruiter favorites / Tech & startup ready / High-density layouts / For design & marketing，每组 2–3 张**大尺寸真实内容预览**（非缩略图），组间穿插一句话推荐语 + 用户评分条。
- 尾部：黑底「fully customizable」宣传卡 → 长文 SEO 区（每个模板一段详解 + 大图）→ FAQ → 蓝底 CTA。
- 移动端：模板大图单列，横滑轨变纵向流。

### R04 · AI 功能页
- H1「The Most Advanced AI Resume Builder」+ 顶部编辑器 mock（带右侧评分面板 92 与 AI 面板）。逐屏拆解 AI 能力：Keyword Targeting（配真实面板截图：关键词列表 + 绿色勾状态点）、AI 评分反馈、AI Editor、黑底大图区块逐个展示，再接 Forbes 引言、4M 用户信任区、FAQ、蓝底 CTA。
- 版式与 R01 同构：白/黑/蓝分区交替，每区一个功能主张 + 一张 UI 截图。

### R05 · 工具枢纽
- H1 双行「Stop guessing. / Start getting callbacks.」+ 4.7/5 评分条。顶部为**可切换 Tab 的工具演示区**（AI Cover Letter/其他工具，右侧表单 + 左侧文档预览）。
- 「One platform. Every tool you need.」右侧竖排工具目录列表；后接视频评价卡（可播放的用户视频 + 引言）、FAQ、蓝底 CTA。

### R06 · 示例库
- H1 + 角色搜索；示例按行业分组网格，每卡为真实简历首页缩略 + 角色名；SEO 长文与 FAQ 收尾。300+ 示例是其 SEO 获客主阵地。

### R07 · 注册页（app.rezi.ai/signup）
- 左右分栏：左侧极简表单（**Google/Apple OAuth 大按钮置顶**，OR 分隔线，email+password，主蓝 SIGN UP 大按钮 48px，底部 Sign In 链接）；右侧品牌蓝渐变底上浮 Dashboard 渲染图（三 Tab 文档卡片网格 + Keyword Targeting 浮层），注册页本身就在卖核心功能。

## 参照竞品速记
- **Kickresume**（K01/K02）：暖白底 + 彩色渐变卡片矩阵（bento 风）；hero 直接放「AI 生成过程」动画 mock；功能矩阵用 8 色 bento 网格；定价 $19/$9 双卡。信息密度高于 Rezi，视觉更「玩具感」。
- **FlowCV**（F01/F02）：免费为主卖点（1st resume free forever）；hero 右侧双层简历实拍卡 + TikTok 风浮层；「4 步流程」逐步配 UI 截图；50+ 模板横向滑轨；免费计划功能六宫格。整体粉/紫点缀、圆角更大、亲和力路线。
