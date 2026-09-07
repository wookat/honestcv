# R441 — 死 ?job= 深链诚实反馈（/jobs 不再静默顶替成无关职位）

## 一手生产实证（2026-09-05, cv.zalize.com）

CDP 直载 `/jobs?job=bogus-r441-xyz`：页面零反馈地把详情面板换成搜索结果第一条
（"Freelance Copywriter"），并把 URL 原地改写成 `?job=1749306`——用户点开一条
分享/收藏的职位链接（职位已过期或 id 错误）时，看到的是一条完全无关的职位，
且没有任何提示说明链接里的职位没找到。移动端更糟：`mobileDetail` 因 `?job=`
存在而自动打开详情面板，直接全屏展示顶替职位。

R425（死 ?example）/R426（死 ?template）同族缺口：死深链必须诚实说"没找到"，
不能静默顶替。

## 方案（最小修复，仅 src/pages/Jobs.tsx）

- `pendingSeedJob` state 记录挂载时的 `?job=` id，首次 fetch 成功回调里一次性校验（校验后清空）：
  既不在结果列表也不在本地 pipeline ⇒ `jobLinkNotFound=true` 且
  `setMobileDetail(false)`（不再为顶替职位打开移动详情面板）。
- 列表上方渲染 role=alert 卡（R417 同款 destructive 样式）：
  "The job in that link wasn't found — it may have expired or been removed."
  + Dismiss 按钮。
- 有效 ?job= 深链、无参加载、搜索/重试路径字节不变。

## QA 清单（生产）

1. `/jobs?job=<bogus>`：alert 卡精确文案 + Dismiss 清卡；移动 375 不自动开详情面板。
2. `/jobs?job=<列表内有效 id>`：无卡，详情照常选中（移动端照常开面板）。
3. 无参 `/jobs`：无卡，R417 失败卡+重试回归。
4. 375 光暗零溢出、零 console 错误、基线字节还原、零逃逸。
