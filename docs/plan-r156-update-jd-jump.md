# R156 — “Update job description” jump from the ATS score card

## 一手观察（2026-08-31，app.rezi.ai Finish Up 页）
- Rezi Finish Up 右侧栏的 AI Keyword Targeting / 关键词建议面板底部有专属
  「Update job description」按钮——分数与关键词反馈所在之处，一键回到 JD 编辑。
- 我方 ATS score 卡在预览列（移动端在 Preview & score tab），而 JD textarea 在
  编辑列「Target job」Section（移动端在 Edit tab）。R155 QA 实测时代理即在
  Preview tab 找 JD 输入未果、被迫切回 Edit——真实用户同样会遇到该断链。
- 无 JD 空态提示为纯文本「Paste a job description in "Target job"…」，无可点入口。

## 方案（Builder.tsx 唯一改动，零 schema 零存储零依赖零评分改动）
1. Target job Section 增加 `anchor="target"`（复用既有 Section anchor/JUMP_EVENT
   机制，不进 SectionNav——navSections 列表不变）。
2. 有 JD 时：关键词区块末尾新增「Update job description →」ghost 小按钮，
   onClick=jumpToSection('target')——已内建 setMobilePane('edit')+平滑滚动+ring。
3. 无 JD 时：空态文本改为句子内嵌同样跳转的可点链接按钮（min-h-10 sm:min-h-0）。
4. 顺带修复已记录 P3：Excluded 恢复 chip 增加 aria-label（避免与工具栏
   Restore title 撞车，改善可达性；行为不变）。

## 不做
- 不在预览列复制 JD textarea（单一数据源，避免双向同步复杂度）。
- 不改移动端 tab 信息架构（既有布局，另行评估）。

## 验收
- 1600px：有 JD 时按钮出现，点击平滑滚到 Target job 卡带 ring；无 JD 时空态链接同效。
- 375px：从 Preview & score tab 点击自动切回 Edit tab 并滚到 Target job；触点 ≥40px。
- Excluded chip 有 aria-label 可被 getByRole('button', name=…) 唯一命中。
- R154 分诊卡、R155 审计 chip 回归不受影响。
