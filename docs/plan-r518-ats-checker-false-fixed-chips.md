# R518 — /ats-checker 首次检查即出现「Fixed since last check」假徽章

## 一手证据（生产 CDP，2026-08-31）
- 全新状态（localStorage 无任何 ats 相关键、无 sessionStorage 草稿）打开 /ats-checker，粘贴简历+JD 后点一次「Check my ATS score」。
- 首次检查结果里「Punctuated bullet points」旁出现绿色「Fixed since last check」徽章——但用户从未做过上一次检查，也没修过任何项。
- 复现率：程序化输入后立即点击（等价于用户粘贴后立即点击）稳定复现。

## 根因（src/pages/AtsChecker.tsx）
- 评分输入走 `useDeferredValue`（R406：大文本防卡键）。点击 Check 后的第一帧渲染里，`scoredResumeText`/`scoredJd` 可能仍是旧值（空或粘贴中途的部分文本），此时 `result` 用**过期文本**算出一份瞬态报告。
- `fixedChecks` effect 无条件把每份 `result` 写入 `prevScanRef` 作为对比基线。瞬态报告成为基线后，deferred 值追平、真实报告出炉，凡是「部分文本 fail → 完整文本 pass」的检查项都被打上「Fixed since last check」。
- 编辑时 `setChecked(false)`，所以正常路径只在显式 Check 之间对比——坏的只是瞬态渲染混入基线。

## 修复（最小）
- effect 开头增加瞬态守卫：`scoredResumeText !== resumeText || scoredJd !== jd` 时直接 return——不更新基线、不更新 fixedChecks。
- 只有 deferred 值与当前输入一致（真实完整的一次检查）才参与基线与对比。两次真实检查之间的既有语义零改动。

## 非目标
- 不动 useDeferredValue 性能策略、不动检查项本身、不动 Builder 侧 R225 chips。

## 验证
- 本地：tsc / eslint（单查）/ build / verify-dist。
- 生产 QA：全新状态首次检查零「Fixed」徽章；第一次检查后修复一项（给 bullet 加句号）再 Check，该项出徽章（语义回归）；375px 零溢出零 console 错误；QA 后清理存储。
