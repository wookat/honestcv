# R544 — Target 面板缺失关键词 chip 支持「不相关」排除

## 一手证据（生产 CDP，2026-08-31，375×812，全新存储）
- 种子简历（skills: python, golang）+ JD 含 kubernetes/terraform/python/golang/scalable/oracle。
- Target job 面板（R542 块）渲染 chips：`+ kubernetes` / `+ scalable` / `+ oracle`，每个按钮唯一 title=`Add "…" to Skills`。
- 面板内不存在任何「not relevant / exclude」路径（`has not-relevant in panel: False`）。
- 对照：预览 pane 的 Score 卡关键词分诊早有三态（Add to Skills / Draft a bullet / × Not relevant → `ignoredKeywords`，且有 Excluded 列表可恢复）。

## 缺口
R541 的 keyword Fix → 把用户深链到 Target 面板作为「修关键词」的落点，但落点对不相关关键词（如 oracle，用户并不会）只有一个动作：把它写进 Skills——诱导关键词堆砌；诚实的动作（标记不相关、从覆盖率剔除）只存在于另一个 pane 的 Score 卡里，移动端需切 pane 找回。Rezi 的 keyword targeting 允许直接跳过/忽略不适用的关键词。

## 最小修复（仅 src/pages/Builder.tsx R542 块）
- 每个 chip 改为 Score 卡同款分裂式 span：左键 `+ kw`（append 进 Skills，原逻辑不变）+ 右键 `×`（`set('ignoredKeywords', [...(resume.ignoredKeywords ?? []), kw])`）。
- ats 重算后 chip 立即消失（missing 已剔除 ignored）；恢复走既有 Score 卡 Excluded 列表，不在面板重复。
- 文案「tap to add to Skills」改为如实描述两个动作。

## 非目标
- 不在 Target 面板加 Draft a bullet（保持面板紧凑，草拟入口留在分诊卡）。
- 不改 ats.ts、评分、Excluded 恢复逻辑。
