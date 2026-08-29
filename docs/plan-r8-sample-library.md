# R8 设计方案：操作台内 Sample Library（对标 Rezi Sample Library）

一手证据（2026-08-29 R8 复审计，~/audit-r1/shots-r8/）：登录 app.rezi.ai 实测，Rezi 操作台左侧常驻「SAMPLE LIBRARY」，页面为按角色/行业分类（PRO/BUSINESS/PROGRAMMING/…）+ 搜索框 + 简历样例卡片（缩略图+公司/职位），点击即可基于样例开始。另确认 Rezi 还有 Job Search（+2M 职位、Saved/Applied/Interviewing 管线）与付费人工 Review——均为账号+后端重资产功能，本轮不做（架构差异，记入待办）。

RezUp 现状（代码+生产核对）：已有 30 个角色示例（/examples/examples.json，build-seo 生成），但只从 SEO 页 ?example= 深链或 builder 空态进入；/dashboard 操作台内没有样例库入口，找样例要离开工作区。差距分级：P1（操作台维度——Rezi 把样例库作为工作区一等公民）。

## 方案（架构决策）
- 纯前端复用：/dashboard 新增「Sample library」区块，fetch 现有 /examples/examples.json（无新数据源、无后端）。
- 卡片复用 `exampleToResume()` + 现有 Thumb（ResumePreview 缩略图），与简历卡片视觉一致。
- 「Use this example」跳 `/builder?example=<slug>`，复用 builder 现有深链逻辑（含覆盖草稿前 confirm），零新状态写入。

## 交互规格
- 区块标题 Sample library + 说明；搜索框（按角色/行业过滤，大小写不敏感）+ 行业 chips（从 sector 去重生成，含 All）。
- 卡片：缩略图、role、sector、Use this example 按钮（≥40px 触摸目标）；grid 与上方简历卡一致（375px 单列）。
- 默认最多显示 9 张，过滤后同样；底部「Browse all examples」链去 /examples/ 静态页。
- 搜索无结果显示空态文案。

## 验证
- lint/tsc/build 全绿；独立 PR（基于 R7 分支，累积链）；部署后生产复验：搜索/筛选、Use this example 走 confirm 后正确载入 builder、1440+375、console clean、触摸目标 ≥40px。

如无异议按此执行。
