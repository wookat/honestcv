# R696 — 应用内四个筛选框的结果数不播报（WCAG 4.1.3 Status Messages）

## 生产实证（qa/r696-evidence.cjs，index-smApJyJU.js，1280 与 375）

MutationObserver 监听 `[aria-live],[role=alert],[role=status],[role=log]` 全部子树变化；每个筛选框先输入有结果的词、再输入无结果的词：

| 筛选框 | 有结果时 live-region 事件 | 无结果时 live-region 事件 | 空态段落 |
| --- | --- | --- | --- |
| /dashboard「Search copies」 | none | `added:status:No saved copies match “zzz”.` | `role=status`（仅空态） |
| /documents「Search documents」 | none | none | 可见，无 role |
| /samples「Search samples by role or industry」 | none | none | 可见，无 role |
| /jobs Tracked 页「Filter by title or company」 | none | none | 可见，无 role |

即：四个筛选框在「列表已经缩小到 N 条」时读屏用户听不到任何东西；三个在「什么都不剩」时也听不到。/jobs All 页的「N jobs found」（既有 `role=status`）与 R669 给 /examples/ 静态页加的「N of M shown」是本仓已有的正确做法，应用内这四处漏掉了。console 错误 0。

## 方案

新增 `src/components/FilterResultStatus.tsx`：常驻挂载的 `sr-only` `role="status"`，`query` 为空时内容为空串（区域先存在再变文字，同 R695 `CopyStatus` 的理由），否则「N of M {noun} match “q”」/「No {noun} match “q”」。

```tsx
export function FilterResultStatus({ query, shown, total, noun }: { query: string; shown: number; total: number; noun: string }) {
  const q = query.trim()
  return (
    <p role="status" className="sr-only">
      {!q ? '' : shown === 0 ? `No ${noun} match “${q}”.` : `${shown} of ${total} ${noun} match “${q}”.`}
    </p>
  )
}
```

接入四处，各放在对应搜索框旁：
- Dashboard copies：`shown = sortedVersions.length`，`total = versions.length`；既有空态 `<p role="status">No saved copies match…</p>` 去掉 `role`（避免同一事实播报两次），可见文案不变。
- Dashboard documents：把内联的 `docs.filter(...)` 提成 `filteredDocs` useMemo（列表与空态本已各算一次同一谓词），`shown = filteredDocs.length`，`total = docs.length`。
- Dashboard samples：`shown = filteredExamples.length`，`total = examples.length`。
- Jobs Tracked 页：`shown = trackedQueue.length`，`total = pipeline.length`，仅在 `tab === 'tracked'` 且筛选框渲染时挂载。

不改：可见文案、列表排序/过滤谓词、空态段落、/jobs All 页既有「N jobs found」。

## 验证

- 本地：`npx tsc -b --noEmit`、`npx eslint` 改动文件、`git diff --check`、`npm run build`、`npm run verify-dist`。
- 生产（qa/r696-evidence.cjs 1280 + 375）：四个筛选框有结果→`status:N of M … match`，无结果→`status:No … match`，清空→区域清空且不再有旧文本；copies 空态不再双报；焦点始终留在输入框；console 错误 0；存储回基线。
- 未做：真实读屏实听（NVDA/VoiceOver 对逐字输入的合并播报行为未验证）。
