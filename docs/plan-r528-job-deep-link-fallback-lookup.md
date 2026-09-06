# R528 — ?job= 深链在过滤搜索外时回退全量查找，而不是谎报「已过期」

## 一手证据（生产 CDP，2026-08-31）
- `/api/jobs/search`（无参数）返回 15 条在售职位，含 id=2091068（Head of Marketing & Communications，descriptionTruncated=true）。
- 冷载 `https://cv.zalize.com/jobs?job=2091068`：页面默认搜索被简历 targetRole（"Senior React Developer"）播种，结果只剩 5 条 Lemon.io 职位；深链职位不在其中，UI 弹出 role=alert：
  「The job in that link wasn't found — it may have expired or been removed.」
  ——职位明明在售，只是不在收件人的默认搜索结果里。详情栏还自动落在无关的 Senior React 职位上。
- 后果：任何把职位链接分享给别人（或换台设备/换简历后自己打开收藏）的场景，只要对方的 targetRole 搜索不覆盖该职位，就会被谎报「职位已过期或被移除」。对照 Rezi 2026-08 Week4「Improved Job Description Visibility: more reliable full job description viewing for tracked roles」。

## 根因（src/pages/Jobs.tsx）
`fetchJobs` 只把 `pendingSeedJob` 与「首次搜索结果 + 本地 pipeline」对照（L183–191），未命中即 `setJobLinkNotFound(true)`；而首次搜索天然带简历 targetRole 过滤。

## 方案（最小改动，仅 Jobs.tsx）
1. 新增 `linkedJob: JobListing | null` state。
2. `fetchJobs` 中 pendingSeedJob 未命中 list/pipeline 时：若首次抓取本身带 q/category 过滤，先 `searchJobs('')` 全量回查一次；命中则 `setLinkedJob(job)` 并保持选中（移动端照常开详情），仍未命中才弹 dead-link 警示。首抓已是无过滤时跳过回查直接判死。
3. `selected` 解析链加入 linkedJob；自动回落 `setSelectedId` 在回查未决前不清掉深链选中。
4. 当选中的是 linkedJob（不在当前 shown 列表）时，列表上方出 role=status 信息条：「Showing the job from your link — it doesn't match your current search.」+ Dismiss。
5. 不改：URL 写回逻辑（R503）、pipeline、tracked 标签、worker API、R441 警示文案本体。

## QA（生产，装错误监听、375px 双查、合成存储清理）
- 冷载 `?job=<过滤外在售 id>`：不再弹 dead-link，详情栏显示该职位 + 信息条；375px 开详情浮层。
- 冷载 `?job=999999999`（真死链）：仍弹「wasn't found」警示（R441 回归）。
- 结果内深链、行点击、URL 写回照常。
