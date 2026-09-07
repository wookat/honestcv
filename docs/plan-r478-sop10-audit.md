# R478 — SOP-10 四维差距审计（操作台 / 功能深度 / 落地页 / 架构）

节点轮（上一次 SOP-10：R473）。本轮同时闭合 R476 遗留的 /builder Lighthouse
FCP/LCP 方差观察项。结论先行：四维全净、零 P0–P2，本轮为 docs-only 审计轮
（先例：R303/R316/R328/R339）。

## 一手证据（2026-08-31，全部生产 cv.zalize.com）

### 1. 架构 — R476 观察项闭合（银行项）

Lighthouse 移动模拟两跑（`/tmp/lh-builder-1.json`、`/tmp/lh-builder-2.json`）：

| 指标 | 跑 1 | 跑 2 | R476 前基线 | R476 当日异常 |
| --- | --- | --- | --- | --- |
| perf | 0.54 | 0.54 | 0.53 | — |
| FCP | 2.8s | 2.8s | 3.1s | 4.8–6.0s |
| LCP | 4.7s | 4.7s | 4.7s | 5.0–6.2s |
| TBT | 1,310ms | 1,350ms | 1,330ms | 450–960ms 波动 |
| CLS | 0 | 0 | 0 | — |

两跑指标一致、且 FCP 优于 R476 前基线 → R476 当日的 FCP/LCP 劣化确证为
网络/CDN 方差，非回归。**观察项闭合。**

### 2. 架构 — 入口块归因：瘦身已到地板

本地带 sourcemap 构建后手写 VLQ 归因（source-map-explorer 对 rolldown 产出
的 map 报 `generated column Infinity` 无法使用；脚本 `~/audit-r1/smap_attr.py`，
本轮修正 source 索引跨行累积 bug 后与文件总字节对上）：

入口 `index-*.js` 288.7KB 中：react-dom-client 175.1KB（61%）、react-router
35.3KB、tailwind-merge 27.1KB、react 7.5KB、scheduler 3.5KB；应用代码合计仅
~25KB（Layout 9.6KB、lib/jobs 7.2KB、App 3.6KB 等）。R473–R477 之后入口已无
可摘除的应用侧大块——**继续压 /builder TBT 只剩 react-dom 渲染树本身**
（Builder 首渲染 ~1,500+ 节点，长任务 844/287/232/229ms 全在入口块执行）。

### 3. 架构 — /builder LCP 元素的定性

两跑 LCP 元素均为 first-run 向导对话框的描述段（`lcp-breakdown-insight`：
TTFB 53ms + element render delay 789ms）。Lighthouse 干净浏览器 = 全新访客
= 无 localStorage → R350 向导自动打开，**这就是新用户的真实首屏**，非状态
污染（修订 R477 计划文档中的推断）。要改善它同样只剩「更快执行 JS」一条路。

### 4. 操作台 / 落地页 — 七路由扫描全净

`~/audit-r1/r478_audit.py`（CDP 新标签逐路由）：`/`、/builder、/ats-checker、
/dashboard、/documents、/samples、/jobs 全部零 console 错误、零未捕获异常、
唯一 #main、零水平溢出、标题/H1 正常；/builder 唯一 dialog 即 R350 向导。
/builder shell 79KB（含 R471 内联样式），render-blocking 零项，Builder 块与
入口块并行下载（81ms 同时发起，R476 modulepreload 生效），Speed Index 0.96。

### 5. 功能深度 — Rezi 2026-08 changelog 对照

Rezi 八月四周更新逐条对照：job location autocomplete（R308 已有）、job match
score 进列表/详情（R188/R251 tailoredMatchOf + matchOf 已有，含 Best match
排序）、大屏布局（R418 已修）、"updated at" 完整性（R197 已修）、职位描述
完整查看（/jobs 详情窗格已有）。其余为 Auto-Apply/浏览器扩展/移动 App/
Apple 登录/Agents 简历段——账号体系与扩展均在本产品 local-first 边界外。
模板对照：Rezi 新增 Harvard/Jake's/Dev Compact；我方 25 模板含 Ivy/Scholar/
Engineer/Compact 同型。/tools 九个免费工具全部有站内等价物（含公开
/ats-checker 关键词扫描）。**无可在一轮内落地的深度缺口。**

## 银行项（供 R479+ 定夺）

1. /builder TBT ~1.3s（模拟）：唯一剩余大项是首渲染树规模。候选方向：编辑
   列各 section 卡按需/折叠渲染（R477 预览列同思路的编辑列版）；收益需先用
   CDP 数一遍折叠态下各卡节点数再定，改动面大、回归风险高，须单独一轮。
2. tailwind-merge 27KB 在入口（shadcn cn() 依赖）：可评估 lite 替代，属
   微收益高风险，暂不动。

## 退出标准

零 P0–P2 → docs-only 轮成立；本文档 + handoff-context 更新即为交付物。
