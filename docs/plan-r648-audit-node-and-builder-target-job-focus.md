# R648 — SOP-10 审计节点 + builder「Target job」区原地换链接后焦点掉回 body

## 审计（生产 index-Bl-ci03x.js，qa/r648-audit.cjs，1280 + 375）
- 7 路由（/、/builder、/dashboard、/jobs 跟踪面板、/documents、/ats-checker、/pricing）× 2 视口：axe（wcag2a/aa、wcag21a/aa、best-practice）0 violations；页面级无横向溢出；可聚焦元素 0 个无可访问名；零 console 错误；存储回基线。
- Rezi 公开页（features、ai-resume-builder、cover-letter、rezi-docs/job-search 2026-05-11 版、tools/job-search）：能力项与 R638 审计一致（五状态、批量、Target Resume、Apply on site），公开页无键盘/无障碍/撤销相关承诺——无新公开能力缺口。
- 结论：视觉/响应式/静态 a11y 无 P0–P2；R645–R647 证明静态 axe 抓不到「动作后焦点」问题，本轮继续键盘走查尚未覆盖的面。

## 生产实证（qa/r648-evidence.cjs，纯键盘，1280）
builder「Target job」区三个行内动作，Enter 后 pipeline 写入均正确，但 `activeElement` 全部掉回 BODY：
- A「Link this copy to it」（副本瞄准跟踪职位 K，K 无副本）→ BODY；
- B「Use this copy instead」（K 用另一副本）→ BODY；
- C「Save as new copy for it」（J 的链接副本改指 K）→ BODY，新副本已链接 K 并成为正在编辑副本。
原因（推断，与 R645 同构）：动作后该段 `<p>` 条件卸载，改为渲染 `linkedJob` 段「This copy is tailored to … View it on the jobs board →」，按钮随段消失，浏览器把焦点放回 body。
另观察：三个行内按钮高度 16px（内联文字按钮）；axe 未含 WCAG 2.2 target-size 规则，不在本轮范围。

## 方案（最小、只动焦点）
1. `linkedJob` 段的「View it on the jobs board →」Link 加 id `builder-target-linked-job`。
2. `linkCopyToTargetedJob` 与 `saveDraftAsCopyFor` 在写 pipeline 成功后 `focusAfterRender('builder-target-linked-job')`（R645 helper）。三条路径动作成功后 `linkedJob` 必为目标职位，该 Link 必存在；存储满失败路径不登记（焦点仍在原按钮，alert 弹出）。
3. 不改数据逻辑/文案/布局。
4. 审计补遗：验收对照组（副本已链接、JD 可抽关键词）在 1280 触发 axe `color-contrast`——ATS 卡「Keywords 72 ×70% / Structure ×30%」的 `text-muted-foreground/70` 对白底 2.97:1（要求 4.5:1）；R644/R648 审计 fixture 的 JD 为 `x` 抽不出关键词故未渲染该行。去掉 `/70`，随父级 `text-muted-foreground`。

## 验收（生产 1280 + 375，qa/r648-verify.cjs）
- A/B/C Enter 后 activeElement = 「View it on the jobs board →」（`:focus-visible` 真），其 href 指向目标职位 id；pipeline/activeVersionId 与修复前一致。
- axe 0 violations、无溢出、零 console 错误、无 AI 生成调用、存储回基线。
- ATS 卡权重文案不再触发 color-contrast（同 fixture 复验 axe 0）。
- 未做：真实读屏实听；行内按钮 target-size 列候选轮。
