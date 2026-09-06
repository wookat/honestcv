# R520 — ATS Checker 报告在用户照着修改简历时瞬间整块消失

## 一手证据（生产 CDP，全新存储，2026-08-31）

在 https://cv.zalize.com/ats-checker 粘贴真实简历 + JD，点 Check my ATS score，
得到完整报告（Match score、Missing keywords、Priority fixes、Format & content checks）。
随后在简历 textarea 追加一行（模拟用户照着 Priority fixes 修改），第一个 input 事件后：

- 整块报告卡片（含 Priority fixes 列表）立即 unmount，页面只剩输入区与 footer；
- 无任何提示、无「已过期」标记、无重新检查引导——用户正在对照的修复清单直接蒸发。

## 根因（src/pages/AtsChecker.tsx）

两个 textarea 的 onChange 都执行 `setChecked(false)`，而报告由 `checked ? scoreResumeText(...) : null`
门控；任何一次按键都把 checked 清零 → `result === null` → 整个报告卡片消失。
上传文件路径（handleFile）同样 `setChecked(false)`。

## 最小修复

把「报告是否显示」与「当前输入」解耦：报告冻结在最近一次 Check 的输入快照上。

- 新增 `scan: { resumeText, jd } | null` 状态；Check 按钮 / 示例按钮 / /builder 导航种子设置快照。
- `result` 改为 `useMemo(() => scan ? scoreResumeText(scan.resumeText, scan.jd) : null, [scan])`；
  jdSegments / analysis / isExample 同步改用快照值。
- textarea onChange / handleFile 不再清 checked；报告保持显示。
- `stale = scan && (resumeText !== scan.resumeText || jd !== scan.jd)` 时在报告卡上方渲染
  role=status 琥珀条：「You've edited your inputs since this check — the report below is from
  your last check.」+ Re-check 按钮（重设快照）。
- useDeferredValue 与 R518 瞬态守卫随快照化自然移除：评分只在 Check 点击时对确定文本执行一次，
  按键不再触发任何重评分（比 R406 的 defer 更强的防卡键保证）；fixedChecks 基线直接跟随每次 scan。
- sessionStorage 草稿结构不变（checked === scan !== null；刷新后按当前文本重建快照，等价于自动重查）。

## 非目标

- 不做实时 live re-score（大文本按键重评分正是 R406 要避免的）。
- 不改评分算法、检查清单、Priority fixes 内容（R519）。
- 不动 Builder 侧评分路径。

## 验证

tsc / eslint（单查）/ build / verify-dist；生产 QA：check → 编辑 → 报告仍在 + stale 条出现 →
Re-check 后条消失且报告更新；fixed 徽章语义回归（真实修复恰 1 枚、首查 0 枚）；375px 零溢出。
