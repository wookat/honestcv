# R34 方案：落地页产品套件区（对标 Rezi 首页四大工作流入口）

## 研究样本（一手证据）
- Rezi 首页 2026-08-29 实测（`~/audit-r1/shots-r33/r33-home.txt` / `.png`）：hero 下方并列展示四大工作流——"Score resume / Create Resumes / Generate Cover Letters / Search Jobs / Interview Prep"，每项都是首页一等公民入口。
- Rezi app 侧栏（`~/audit-r1/shots-r34/r34-dashboard.txt`）：RESUMES / COVER LETTERS / RESIGNATION LETTERS 分列 + AI INTERVIEW / JOB SEARCH 常驻。
- Rezi Cover Letter 创建实测（`~/audit-r1/shots-r34/r34-cover-create-step1.txt`）：免费账户点击 "Create new Cover Letter" 直接弹 "Upgrade to Pro"（$29/mo）付费墙——其求职信功能免费层不可用。

## 现状（cv.zalize.com 一手核对，`~/audit-r1/shots-r33/r33-ours-home.txt`）
- 落地页只讲简历：hero、上传出分、"What you get" 六卡、模板墙、AI 工具区、FAQ、定价。
- Cover letters / Interview prep / Job search **只在定价表 bullet 里出现一次**，落地页没有任何功能级入口或说明；header 有 "Jobs" 链接但无上下文。
- 差距分级：P1——功能已真实存在（R6/R14/R17/R26/R33 已上线且免费），但首页完全没有呈现，访客无从得知产品是套件而非单一简历编辑器。

## 方案
在 "What you get" 六卡之后新增「More than a resume builder」产品套件区，4 张卡（复用现有 Card/图标风格，各带真实 CTA）：
1. Cover letters — 按职位定制、信头 PDF/DOCX 导出（R31）→ `/builder`（工具在编辑器内）
2. Interview prep — 问题建议 + 答案 AI 反馈（R26/R27）→ `/builder`
3. Job search — 远程职位板 + 申请管线 + 一键定向/求职信（R17/R33）→ `/jobs`
4. Resume dashboard — 多简历副本、文档管理、编辑历史（R5/R24/R28）→ `/dashboard`
文案如实：全部免费（beta），不写用户量/评价等无证据内容；明确与 Rezi 差异点（Rezi 求职信是 Pro 付费墙，我们免费——此点有一手证据可写"free during beta"即可，不点名踩竞品）。

## 验证
- 本地 lint / tsc -b / build 全绿 → wrangler deploy → 生产 1440+375 QA（新区块渲染、4 个 CTA 可达、375px 无横向溢出、console clean、既有区块回归）。

## 刻意不做
- 不伪造 testimonials/用户数；不做营销自动播放视频；不改 header/导航（R13 已覆盖）；不新增路由。
