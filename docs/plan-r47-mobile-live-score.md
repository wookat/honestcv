# R47 方案：移动端编辑时常驻实时 ATS 分（对标 Rezi 移动编辑器底栏 Rezi score）

## 一手证据（2026-08-30，登录实测 app.rezi.ai，375×812）

截图：`~/audit-r1/shots-r47/`

- Rezi 移动端编辑器（`/dashboard/resume/<id>/contact|experience|skills|finish-up`）
  底部有**常驻固定工具栏**，最左侧始终显示 **Rezi score 圆环 + 数字（实测 47）**，
  右侧为上下文操作（编辑分区时 Add new / Sort，finish-up 时 Adjustments / Template / Download）。
  用户在任何分区编辑时都能实时看到分数变化。
- 我方 `/builder` 375px（生产实测）：移动端为 Edit / Preview & score 双 pane 切换，
  底部切换条**不显示任何分数**——编辑 pane 下 ATS 分完全不可见，必须切到
  Preview & score pane 才能看到，编辑时零分数反馈。桌面端双栏无此问题。

## 差距定级

P1：ATS 分数实时反馈是本产品核心卖点（落地页原话 "live ATS match score"），
移动端编辑时却看不到分数，改一条 bullet 想看影响要来回切 pane。
Rezi 在移动端用常驻底栏分数解决了这一点。

## 方案（最小诚实实现）

`src/pages/Builder.tsx` 移动 pane 切换条（`lg:hidden` 固定底栏）的
「Preview & score」按钮上追加实时分数徽标：

```tsx
// ats 已有：useMemo(() => scoreResume(resume, resume.jobDescription), …)
{ pane: 'preview', label: 'Preview & score', badge: ats.score }
// 渲染：label 后接
<span className={`… ${ats.score >= 80 ? 'green' : ats.score >= 50 ? 'amber' : 'red'}`}>
  {ats.score}
</span>
```

- 颜色阈值复用现有约定（≥80 绿 / ≥50 琥珀 / 其余红，与 score breakdown 一致）。
- 分数来源为既有 `ats` useMemo，**零新计算、零网络、零 AI 调用、零存储**。
- 徽标同时兼当入口提示：点按钮即达完整分数与预览（原行为不变）。

刻意不做：
- 完整 Rezi 式多按钮底部工具栏（Add new/Sort/Template/Download）——我方编辑
  pane 单页滚动即达全部分区，复制多按钮栏会挤占 375px 宽度且无对应信息架构。
- 圆环动画版 ScoreRing 嵌入底栏（stroke=7 在 ≤24px 尺寸下不可读）。

## QA 计划

1. 本地 lint / tsc / build 全绿。
2. 生产 375px：编辑 pane 下底栏徽标可见且与 Preview pane 内 ScoreRing 数值一致；
   粘贴 JD / 改内容后徽标实时变化；切 pane 行为回归；1440px 底栏隐藏不受影响；
   console clean；localStorage 还原。
