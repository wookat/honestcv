# R649 — 键盘走查：builder「Resume copies」弹窗内副本备注「reconnect it / use this one instead」后焦点落到弹窗容器

## 生产实证（index-C9Is68an.js，qa/r649-evidence.cjs，纯键盘，1280）
- 弹窗内非正在编辑副本行的备注按钮「reconnect it」（目标跟踪职位 K 无副本）→ Enter 后 pipeline 正确写入 `K→该副本`，但 `activeElement` = 弹窗容器 `div[role=dialog]`（Radix FocusScope 兜底），不是该行任何控件；下一次 Tab 从弹窗第一个可聚焦元素重新开始，用户丢失位置。
- 「use this one instead」（K 用另一副本）同样落到弹窗容器。
- R645 当时记录此现象为「兜底到弹窗容器」并接受；R647 已给每行 Open/Rename 加稳定 id（`builder-copy-<id>-open` / `-rename`），现在补齐与 dashboard 同款（R645：dashboard 副本行换链接后焦点落该行 Open）。
- 同脚本另实证：dashboard 与 jobs 的 Undo toast「Dismiss ×」Enter 后焦点掉回 BODY（R646 已知、低价值）——列为 R650。

## 方案（最小、只动焦点）
`linkCopyToJob(versionId, jobId)` 写 pipeline 成功后 `focusAfterRender(\`builder-copy-${versionId}-${versionId === activeVersionId ? 'rename' : 'open'}\`)`（正在编辑副本的 Open 为 disabled，落 Rename，与 R647 Undo 同规则）。失败路径（存储满）不登记。不改数据逻辑/文案/布局。

## 验收（生产 1280 + 375，qa/r649-verify.cjs）
- 非编辑副本「reconnect it」「use this one instead」Enter 后 activeElement = 该行「Open copy X」（`:focus-visible` 真，仍在弹窗内）；正在编辑副本同动作 → 「Rename copy X」。
- pipeline 写入与修复前一致；备注变为「for K at Initech」Link；axe 0、无溢出、零 console 错误、无 AI 生成调用、存储回基线。
- 未做：真实读屏实听。
