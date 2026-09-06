# R620 — Resume settings 把副本改指到某个已跟踪职位时，不说、也不给一键链接

## 生产实证（index-DAMIUQTC.js，qa/r620-evidence.cjs 1280）
职位 J（SRE @ Globex）与 K（Platform Engineer @ Initech）都在跟踪，K 没有目标副本。在 dashboard Resume settings
把副本改指 K（role/company/JD 与 K 完全一致）：

| 场景 | 弹窗 | Save 后 dashboard 行 |
|---|---|---|
| 副本未被任何职位链接 | 无任何提示；按钮 Cancel / Save | 「targeted at Platform Engineer at Initech · **tracked job has no copy linked — reconnect it**」 |
| 副本是 J 的目标副本 | R616 提示（只说 J）；Cancel / Save as new copy / Save | 「for SRE at Globex · now aimed at Platform Engineer at Initech」；**Save as new copy 造出的新副本也不链 K** |

用户刻意把副本瞄准了一个正在跟踪、还没有副本的职位，系统明知匹配（同一个 `copyTargetsJob` 判定 dashboard 行
随后就会用到）却在能一步完成的地方保持沉默，让用户去 /jobs 找到 K → Reconnect targeted copy → 确认，四步之后才
得到本该在 Save 时就成立的链接。

## 方案（Dashboard.tsx，仅弹窗）
- `editingMatchesTrackedJob`：编辑中的目标字段 `copyTargetsJob` 匹配的跟踪职位（排除当前链接该副本的职位）。
- 提示（amber 框，与 R616 同源）：
  - K 无活链接副本：「The new target matches tracked job “Platform Engineer” at Initech, which has no targeted copy yet.」
  - K 已有活副本 X：「…which already uses the copy “X” — this copy stays unlinked.」（只说明，不给按钮；R594 文案随后接手）
- 按钮（仅当 K 无活副本）：
  - 未链接副本：**Save and link to that job** → `updateResumeVersion` + `setPipelineVersion(K, id)`（R619 顺带盖 forJob=K）。
  - J 的目标副本：把「Save as new copy」改为 **Save as new copy for that job** → `createResumeVersion` + `setPipelineVersion(K, newId)`；
    J 的副本原样保留。普通 Save 仍保持 J 链接 + R616 mismatch 标注，不移动链接（不静默改链）。
- 编辑中的副本正在编辑器打开时，仍走 R617 的 draft 同步。

## 验收（生产 1280 + 375）
- unlinked：提示出现、按钮 Save and link to that job；点击后 K→该副本、forJob=K、行文案「for Platform Engineer at Initech」。
- linked：提示同时说 J（R616）与 K；Save as new copy for that job → 新副本链 K、原副本仍链 J 且文案不变。
- control（目标不匹配任何跟踪职位）：无新提示、按钮不变。
- K 已有副本：只有说明、无新按钮。
- 无页面级溢出、零 console 错误、零 AI 调用、存储回基线。

## 实现中追加发现（375×800，生产 index-D0n2WcIc.js）
两条提示并存时 Resume settings 弹窗高 1026px、top=-113px、`overflow-y` 非 auto——Cancel/Save 落在视口外且不可滚动；
无提示时也已 758px（iPhone SE/8 的 667 高屏同样超出）。修复：DialogContent `max-h-[90vh] overflow-y-auto`
（与 documents 编辑弹窗同一写法）。复验：720px、scrollable=true、按钮可点。
