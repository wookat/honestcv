# R651 — 关系图行内动作（Open / use this one instead / reconnect it）触控热区只有 15–16px 高

## 生产实证（index-DJH3qdhb.js，qa/r651-evidence.cjs，1280 与 375）
- axe `wcag22aa`（含 `target-size`）在 /dashboard、/jobs（tracked 面板）、/documents、/builder 均 0 violations——WCAG 2.5.8 对「句子/文本块内的行内目标」明确豁免，所以自动审计**看不到**这类缺口。
- 直接量 `getBoundingClientRect()`（375×812，与 1280 相同）：
  - /dashboard 副本行 CopyTargetNote：「Platform Engineer at Initech」Link 15px 高；「tracked job uses another copy」Link 15px；「use this one instead」/「reconnect it」按钮 16px。文档行「use this one」/「use this one instead」按钮 16px。
  - /jobs 职位卡：「Open」（targeted resume / cover letter / interview prep / resignation letter，31px 宽 × 16px 高）、「Use this one instead: …」/「Use for this job: …」16px；未跟踪面板「Open」（saved letter/brief）16px。
  - /documents 文档备注「use this one」16px。
  - builder「Resume copies」弹窗行复用 CopyTargetNote，同 15–16px。
- 这些正是 R635–R640、R645–R650 反复收口的「原地换链接 / 打开已链接工件」的**唯一**入口；在 375 上是需要精准点按的 16px 文本。
- 项目内既有惯例（AtsChecker 底栏链接、builder 空态「Load an example resume / import your existing resume」、Dismiss）：`relative -my-3 inline-flex items-center py-3 sm:my-0 sm:py-0`——仅在 <640px 把热区撑到 40px，负外边距抵消内边距，行盒高度与桌面视觉不变。实测 builder「Dismiss」按钮 375 下 40px 高、页面布局未变。
- 参照：Apple HIG 44pt / Material 48dp 触控最小尺寸；WCAG 2.5.8 AA 24px（行内豁免不等于可用）。Rezi 应用内页需登录，不取证。

## 方案（只动 className，不改数据/文案/布局/焦点逻辑）
1. `src/lib/utils.ts` 新增 `INLINE_ACTION = 'relative -my-3 inline-flex items-center py-3 sm:my-0 sm:py-0'`（与既有惯例逐字一致），避免 20+ 处手抄。
2. 套用到关系图行内动作：`CopyTargetNote` 的 3 个 Link + 1 个 button；dashboard `docTargetNote` 的 3 个 Link + 1 个 button；/jobs 卡片/面板：已链接行 Open ×4（copy/cover/interview/resignation）、早期副本行「Use this one instead / Use for this job」、早期文档行 Open + Use、未跟踪面板文档 Open。
3. 不动：关键词「+N more」、导航/页脚链接（非关系图动作，另列）。
4. 风险：inline-flex 为原子行内盒，长文案不会在盒内折行——本批文案均 ≤ 30 字符，375 下整体换行可接受；相邻两行动作的 40px 热区可能重叠（相邻行距 ≥ 40px 时不重叠，实测验收）。

## 验收（生产 1280 + 375，qa/r651-verify.cjs）
- 375：上列每个控件 `getBoundingClientRect().height ≥ 40`，且所在行/卡片的高度与修复前一致（先量后量对比，±1px）；相邻动作热区中心点 elementFromPoint 命中各自控件（无遮挡）。
- 1280：每个控件高度与修复前一致（15–16px，`sm:` 重置生效），布局零变化。
- 点击/键盘 Enter 行为不变（Open 落 /documents 或确认弹窗；use this one instead 换链接且焦点落 Open——R645/R649 既有验收复用）。
- axe（wcag2a/aa/21a/21aa/best-practice + wcag22aa）0、无溢出、零 console 错误、无 AI 调用、存储回基线。未做：真实读屏实听。

## 结果（2026-09-06）
- 首版 Link 也用 inline-flex：生产 375 实测「tracked job uses another copy」「job has no cover letter linked」变原子盒整体换行，行高 48→64 / 80→96，`main` +16px——推翻。改为 `INLINE_LINK = 'relative py-3 sm:py-0'`（行内盒竖向 padding 只扩热区）后行高全部回基线。
- 部署 index-Bn1MCp03.js（Workers Routes code 10000 依旧，上传上线不受影响）。qa/r651-verify.cjs before/after：375 全部 30 个控件 ≥39px（按钮 40、Link 39）、中心点命中自身、行高与 `main` 高度逐一等于修复前；1280 控件高/行高/`main` 逐一等于修复前；dashboard 换链接行为与焦点（R645）不变；axe 0、无溢出、零 console 错误、存储回基线。未做：真实读屏实听、真机触控。
