# R645 — 键盘走查：原地换链接后焦点不掉回 body

## 背景 / 证据（生产 index-Dpid_6jw.js，qa/r645-evidence.cjs、r645b.cjs，1280）

R644 的 axe 自动化 0 violations 明确不覆盖键盘走查。本轮用 Playwright 键盘（Tab / Enter / Escape）走 R635–R640 引入的「Use this one instead / use this one / reconnect it」原地换链接动作，记录 `document.activeElement`：

| 入口 | 动作前焦点 | Enter 后 pipeline | Enter 后焦点 |
| --- | --- | --- | --- |
| /jobs 卡片 · 早期副本「Use this one instead: targeted resume …(2)」 | 该按钮 | resumeVersionId → qa-v2 ✅ | **BODY** |
| /jobs 卡片 · 早期 cover「Use this one instead: cover letter CF — Cover 2」 | 该按钮 | coverDocId → qa-cover2 ✅ | **BODY** |
| /dashboard 副本行 CopyTargetNote「use this one instead」 | 该按钮 | → qa-v2 ✅ | **BODY** |
| /dashboard 文档行「use this one instead」 | 该按钮 | ✅ | **BODY** |
| /builder Copies 弹窗 CopyTargetNote「use this one instead」 | 该按钮 | → qa-v2 ✅ | 弹窗容器 DIV（Radix FocusScope 兜底） |

原因（代码实证）：换链接后行互换——被点击按钮所在的「Earlier …」行变成「Targeted resume: / Cover letter:」行（另一段 JSX），按钮元素卸载；浏览器把焦点丢回 `<body>`。键盘/读屏用户执行动作后失去位置，需要从页头重新 Tab 二十余次才能回到卡片（同页面 Tab 序列实测：页头 9 个链接 + 5 个 tab 按钮之后才进入面板）。这是 WCAG 2.4.3 Focus Order / 2.4.11 层面的可用性缺口，axe 无法检出。

数据写入本身全部正确（pipeline 已换、原件保留），本轮不改任何数据逻辑。

## 方案

新增 `src/lib/useFocusAfterRender.ts`：

```ts
export function useFocusAfterRender(): (id: string) => void
// 记录一个元素 id；下一次 render 提交后（useEffect）document.getElementById(id)?.focus()
```

换链接动作前先登记「换完之后应该拿到焦点的元素」——即该行换完后的新「Open」按钮：

- **Jobs.tsx**：链接行 Open 按钮加稳定 id `job-<jobId>-<copy|cover|interview|resignation>-open`（只有选中职位的面板渲染这些行，id 唯一）。早期文档 `Use this one instead / Use for this job` 与早期副本同款按钮 onClick 先 `focusAfterRender(linkedRowOpenId(...))` 再 `applyPipeline(...)`。结果：Enter 后焦点落在「Open targeted resume <新链接副本>」/「Open cover letter <新链接文档>」，读屏直接播报换成了谁。
- **Dashboard.tsx**：副本行 Open 加 id `copy-<versionId>-open`，文档行 Open 加 id `doc-<docId>-open`；`linkCopyToJob` 登记 `copy-<id>-open`；`linkDocToJob(d, jobId, focusRow)` 只在行内（非文档弹窗 `docTargetNote(d, true)`）登记 `doc-<id>-open`，弹窗内继续交给 Radix FocusScope（焦点留在弹窗）。
- **Builder**：焦点已被 Radix 兜底到弹窗容器，可用，本轮不动。

不改可见文字、布局、数据关系；`useFocusAfterRender` 每次 render 后只在有登记时查一次 DOM。

## 验收

- tsc / eslint（仅既有 warning）/ prettier（新文件）/ build / verify-dist 全绿。
- 生产 1280 + 375（qa/r645-verify.cjs）：上表 4 个 BODY 场景 Enter 后 `activeElement` 为对应 Open 按钮且 `aria-label` 指向新链接对象；pipeline 写入不变；axe 仍 0 violations；无溢出、零 console 错误、零 AI 调用、存储回基线。
- 未做：真实读屏（NVDA/VoiceOver）实听——如实标注。
