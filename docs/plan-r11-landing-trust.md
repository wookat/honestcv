# R11 设计方案：落地页信任深度（P1-8 残余，对标 Rezi）

一手证据（2026-08-29 实测 rezi.ai 落地页全文）：Rezi 信任结构 = Forbes 背书引用 + 用户量/面试率/评分数据块（4.5M users、62.18% interview rate、4.7/5.0）+ 「The Problem」ATS 教育区块（"You're not getting ghosted by humans"，模拟 ATS 解析你被静默筛掉）+ Wall of Love 具名评价墙 + Trustpilot 评分 + 100% money-back guarantee。

RezUp 现状（生产实查 cv.zalize.com）：已有对比表、承诺区块、FAQ（5 条）、7 天退款（藏在 pricing 小字）。缺：(a) ATS 问题教育区块——用户为什么需要这产品的叙事；(b) FAQ 深度（Rezi 多标签几十条 vs 我们 5 条）；(c) 退款保证不显眼。

诚实约束：RezUp 品牌立足「不捏造」，没有可示人的真实用户量/第三方评分/媒体背书，禁止编造 testimonial、用户数、评分。可行的信任深化 = 教育与透明，而非社会证明造假。

## 方案（本批，仅 Landing.tsx，无新依赖/后端）
1. 新增「The problem」区块（hero 与 three-steps 之间）：标题类「拒掉你的往往不是人，是解析器」——左侧文案解释 ATS 静默过滤（结构错乱/关键词缺失/表格图形），右侧静态 mock 展示一次 ATS 解析（字段逐项 Detected / Skills 解析为正文 / 匹配 47%），全部为示意 UI，不含任何虚构统计背书。CTA 指向免费 ATS Checker。
2. FAQ 从 5 条扩到 10 条：新增「AI 会编造经历吗（不会，[add %] 占位）」「PDF 会被 ATS 读坏吗（文本型 PDF）」「和 Zety/LiveCareer 有什么区别（链对比页）」「付款后还能编辑吗（永久）」「退款怎么申请（7 天无理由，邮件）」。
3. 退款保证升级为 pricing 区块内醒目 badge 行（盾形图标 + 「7-day money-back guarantee · card never stored」），替换现有小字。

## 验证
本地 lint/tsc/build 全绿 → 独立 PR（基于 R10 分支）→ wrangler 部署 → 测试代理生产走查（桌面+375：新区块渲染、无横向溢出、FAQ 展开、对比度/触摸目标）。

如无异议按此执行。
