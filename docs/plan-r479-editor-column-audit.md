# R479 — 编辑列渲染规模与 sora 字体双下载调查（docs-only）

日期：2026-09-05（生产 https://cv.zalize.com ，CDP 一手实证）
结论：两条候选缺口经一手测量后均不成立，本轮不改源码、不部署。先例：R303/R328/R478 docs-only 轮。

## 候选 1（R478 银行项）：编辑列 section 卡按需渲染

### 测量方法
生产 `/builder?example=software-engineer`（Alex Rivera 示例：2 experience、1 education、多组 skills），
1600×761 桌面视口，关闭首跑向导后对编辑列（`#preview` 的兄弟列）逐子元素计数。

### 数据
- main 区总节点 1822；Preview 子树 1000；编辑列 819 节点、15 个可见子块、37 个输入控件。
- 分块（节点数 / 高度px / 全部可见）：工具栏 24、状态行 35、Target job 18、
  Resume sections 导航 14、Contact 41、Summary 70、Target 29、Experience 345、
  Education 99、其余 optional/空 section 卡 8–54 不等。
- 所有子块 `offsetParent !== null`（无 display:none 大子树）；
  Experience/Education/Projects 折叠卡已有 `collapsedEntries` 条件渲染（展开内容不渲染）。

### 判定
与 R477 的情形（883 节点隐藏 Preview 子树在 375px 下 display:none 却完整渲染）不同：
编辑列全部内容对用户可见，最大单块仅 345 节点，不存在"不可见但完整渲染"的子树。
按需渲染/虚拟化需要整列重构，收益无一手证据支撑 → 不做，银行项按证据关闭。

## 候选 2：sora-latin.woff2 生产双下载

### 现象
本机长期使用的 Chrome profile 冷加载 `/` 与 `/builder`（禁缓存）时，
`sora-latin.woff2`（26KB）被请求两次，`inter-latin.woff2` 一次；
第一次 sora 请求无 `Origin` 头、`sec-fetch-mode: no-cors`、initiator 行列 0:0，
第二次与 inter 一样是 `cors`（与 `<link rel=preload crossorigin>` 匹配）。

### 归因实验
1. HTML 逐字节检查：inter/sora 两个 preload 标签与 @font-face 完全同构，各只出现一次。
2. 响应头无 `Link` / 无 103 Early Hints。
3. 把生产 HTML 原样保存本地服务后加载：两字体各请求一次，均 cors —— HTML 本身无缺陷。
4. 生产站在全新 browser context（无历史）加载：两字体各请求一次，均 cors，
   initiator 正确指向各自 preload 标签行。

### 判定
双下载只在带浏览历史的 profile 中出现，特征（no-cors、0:0 initiator、按历史触发）
与 Chrome 基于访问历史的推测式字体预取一致，属浏览器侧行为，非站点缺陷；
站点侧无合理改动可消除（去掉 crossorigin 反而违反规范并使正常访客双下载）。不改。

## 非目标
- 不重构 Builder 编辑列、不加虚拟化/懒渲染。
- 不改字体加载标签。
- 不部署（无源码变更）。

## 验证
- 本轮全部证据为生产 CDP 一手测量（脚本：audit-r1/r479_measure.py、r479_fonts*.py）。
- 无源码变更 → 无 tsc/eslint/build 需要跑（docs-only）。
