# R5 设计方案：简历操作台 /dashboard（对标 Rezi dashboard）

依据：R1 一手取证（docs/audit-2026-08-29-rezi-r1.md 与 /home/ubuntu/audit-r1/shots-app/24-dashboard.png 等）：Rezi 登录后的核心操作台是一个简历卡片仪表盘——每份简历一张卡（缩略图 + 名称 + 分数 + 操作），支持新建/复制/重命名/删除/打开。RezUp 现状（本轮生产实查）：多简历能力只藏在 builder 的「Copies」小对话框里（纯文本列表），没有可视化操作台入口，属于「操作台」维度最大的剩余差距（P1）。

## 方案（架构决策）
- 不引入账号/服务端：沿用 local-first 架构，复用 `listResumeVersions`/`saveResumeVersion`/`deleteResumeVersion`（localStorage `honestcv.resumeVersions`），新增 `renameResumeVersion`、`duplicateResumeVersion` 两个纯函数。
- 新路由 `/dashboard`（lazy 加载，模式同 Builder），SPA 内页；不改静态预渲染管线。
- 卡片缩略图直接复用 `ResumePreview`（非分页模式）按比例缩小渲染（pointer-events-none），不做截图/canvas。
- 「当前草稿」（`honestcv.resume`）作为第一张卡，Open 即回 /builder；副本卡 Open = 先确认「会替换当前草稿」，确认后写入 `honestcv.resume` 并跳转 /builder（与现有 Copies 对话框语义一致）。

## 页面结构 / 交互规格
- SiteHeader + 标题「My resumes」+ 副标题（存本浏览器）。
- 卡片网格（1/2/3 列响应式）：当前草稿卡（Continue editing）、每个副本卡（缩略图、名称、更新时间、ATS 分、Open/Duplicate/Rename/Delete）、末尾「Save current as a copy」入口。
- Rename 为卡上内联输入；Delete/Open 需确认；触摸目标 ≥40px；375px 单列无横向溢出。
- Builder 顶部按钮行加「My resumes」链接；Copies 对话框加 dashboard 入口。

## 验证
- lint/build 全绿，独立 PR（基于 R4 分支，保证生产部署累积），部署后 1440/375 生产复验 + console clean。

如无异议按此执行。
