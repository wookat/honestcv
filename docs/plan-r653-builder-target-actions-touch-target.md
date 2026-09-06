# R653 — builder「Target job」区、/jobs「Tailoring report」、dashboard「Import your LinkedIn」行内动作热区 15–16px

## 生产实证（index-rBI4qE4w.js，qa/r653-sweep.cjs + qa/r653-verify.cjs before，375×812）
- R651 只覆盖了 `CopyTargetNote` / dashboard `docTargetNote` / jobs 卡片 Open·Use 这些「关系备注」动作；同一关系图上还有一批行内 `text-primary underline` 按钮/链接没走 `INLINE_ACTION/INLINE_LINK`，实测高度：
  - builder Target job 区（R621/R622/R637/R641 加的原地动作）：`Link this copy to it` 104×16、`Use this copy instead` 123×16、`Save as new copy for it` 133×16、`View it on the jobs board →` 155×15（改指场景第二条换行为 285×31，且盒中心 `elementFromPoint` 落在两行之间**未命中**）。
  - /jobs 面板 `Tailoring report`（展开 ATS 报告的唯一入口）88×16；无副本时 `Add your resume` 链接同款。
  - /dashboard 空态 `No resume yet? Import your LinkedIn profile →` 262×16。
- 全站扫描（qa/r653-sweep.cjs）另见 `/templates`、`/examples`、`/guides` 的普通内容链接 20–21px、`/jobs` 页脚 `Remotive` 17px——属导航/内容链接，非关系图动作，不在本轮范围（与 R651 一致）。
- axe wcag22aa target-size 依旧全绿（2.5.8 行内文本目标豁免），故只能靠几何实测发现。

## 方案（复用 R651 常量，不改布局）
- 按钮 → `${INLINE_ACTION}`（`relative -my-3 inline-flex items-center py-3 sm:my-0 sm:py-0`）：Builder.tsx `Link this copy to it` / `Use this copy instead` / `Save as new copy…`（3 处）、Jobs.tsx `Tailoring report`。
- 换行链接 → `${INLINE_LINK}`（`relative py-3 sm:py-0`）：Builder.tsx `View it on the jobs board →`（3 处）、`Find it again →`、`Open the saved …`、`Change the copy's target →`，Jobs.tsx `Add your resume`。
- dashboard LinkedIn 按钮是 flex 列的独立子项（`mt-2 self-center`），不是句内文本，套 `INLINE_ACTION` 的 `-my-3` 会和 `mt-2` 冲突并把元素推低 12px；改为专用 `-mt-1 -mb-3 py-3 sm:mt-2 sm:mb-0 sm:py-0`：<640px 盒子 40px、文字仍在原 8px 处、下方内容不动；≥640px 等于现状。
- 不改任何文案、数据、焦点策略（R645/R648）。

## 结果（index-DoQxTL4K.js，qa/r653-verify.cjs before/after 对照，1280+375 ALL PASS）
- 375：5 场景 10 个控件全部 40px（按钮）或 +24px（链接：15→39、换行 31→55），中心 `elementFromPoint` 全命中（含原先未命中的换行链接）；每个控件所在行高与 `main` 高度逐一等于修复前（48/64/24/280；3842/3918/1070/5222）。
- 1280：10 个控件尺寸、行高、`main` 高度全部等于修复前。
- 行为：`Use this copy instead` 以 Enter 触发后 pipeline 改指 qa-vK2、焦点落在 `View it on the jobs board →` 且 `:focus-visible`（R648 策略不变）；`Tailoring report` 点击后切为 `Hide tailoring report`。
- axe 0（页面顶部）、无横向溢出、零 console 错误、存储回基线、零 AI 调用。
- 顺带发现（非本轮改动，列入候选）：1280 下页面滚到 dashboard 空态渐变区时，粘性页头 `by Zalize`（`text-muted-foreground text-xs`）在 `#dce3f5` 混色背景上对比度 4.3 < 4.5，axe color-contrast 报告；页顶位置通过。
- 部署：资产上传成功，Workers Routes 仍 `Authentication error [code: 10000]`。未做：真实读屏实听、真机触控。
