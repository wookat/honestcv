# R532 — 移动端打开职位详情浮层时定位到顶部，返回列表时恢复原滚动位置

## 一手证据（生产 CDP，375×812，2026-08-31）
- /jobs 列表滚动到 scrollY=900 后点击一行（Senior Golang Developer）：详情浮层打开，但 scrollY 仍为 900——标题 h2 位于视口外（y=-148），「Back to list」按钮也在视口外（y=-202），用户落在职位描述中段，必须手动上滑才能看到标题与操作按钮。
- 参照 Rezi changelog 2026-08 Week4「Seamless Messaging Navigation: Navigate … without losing your place」：导航切换既要落点正确，也不能丢失原位置。

## 根因
- mobileDetail 只切换 list/detail 的 hidden class，不改动页面滚动；列表与详情共用同一页面滚动上下文，打开详情继承了列表的滚动偏移。

## 方案（最小改动，仅 src/pages/Jobs.tsx）
- 新 ref `listScrollRef`。mobileDetail 为真且视口 <768px 时：记录当前 scrollY 到 ref，`window.scrollTo(0, 0)`。
- mobileDetail 变假时（Back/「Back to list」/切标签等所有关闭路径）：恢复 `window.scrollTo(0, listScrollRef.current)`。
- 桌面端不动；R531 哨兵、URL/深链、R528–R530 逻辑零改动。

## 验收
- 375px：滚到列表中部点行 → 详情从标题顶部显示（scrollY=0）；浏览器 Back / Back to list → 回列表且 scrollY 恢复原值。
- ?job= 深链冷载：详情从顶部显示。
- 1280px：桌面双栏行为不变（点行不改滚动）。
- 回归：R531 哨兵行为、R528 过滤外深链、R529 信息条、R530 标签往返。
- 零 console/window 错误、零横向溢出、QA 后存储回基线键。
