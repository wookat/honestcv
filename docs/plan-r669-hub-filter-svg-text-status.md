# R669 — /examples/ 搜索框把 30 张缩略图里的同一份样例简历文字当成匹配内容（「engineer」返回全部 30 条）；筛选结果无状态通报（WCAG 4.1.3）；空态文案暗色 3.91:1

## 生产实证（qa/r669-hub.cjs、qa/r669-probe.cjs，375 与 1280，亮/暗）
- /examples/ 输入「engineer」：30/30 条全部保留；输入「nurse」：1 条。原因：每张卡片 `<li>` 内含 `<svg role="img">` 缩略图，其 `<text>` 是同一份 mock 简历（「Jordan Reyes / Senior Software Engineer · Austin, TX / SUMMARY / Engineer with 8 years… / Nimbus Cloud…」），`public/hub-filter.js` 用 `item.textContent` 匹配，svg 文字被算进去——「engineer」「software」「senior」「summary」「austin」「cloud」等常见词对全部 30 条都命中，筛选形同失效。/guides/ 无缩略图，「engineer」3/37 正常。
- 两页 `[aria-live] / [role=status] / output` 数量 0：输入后可见列表从 30→1→0、5 个 h2 被隐藏、空态段落出现，读屏用户得不到任何通报（WCAG 2.2 AA 4.1.3 Status Messages）。
- 空态 `#hub-filter-empty` 内联 `color:#667085`：亮色底 4.84:1 通过，暗色底 oklch(0.16 0.01 260) 仅 3.91:1（正文阈值 4.5）；同页 `--muted` 亮 5.38 / 暗 6.76。

## 方案（public/hub-filter.js + scripts/build-seo.mjs 两处字串，不改卡片内容/布局）
- hub-filter.js：匹配文本改为「不含 svg 的文本节点」——`TreeWalker` 遍历 `li` 的文本节点，跳过 `closest('svg')` 的节点；其余逻辑不变（保持 ES5 风格、外链文件、无内联脚本以满足 CSP）。
- build-seo.mjs：搜索框后新增 `<p id="hub-filter-status" role="status" class="vh"></p>`（视觉隐藏，`.vh` 复用 skip-link 的离屏方式），hub-filter.js 在每次 input 后写入「N of M shown」/「No matches」（空查询时清空）；空态段落 `color:#667085` → `color:var(--muted)`。
- 不改 /guides/（无 svg，逻辑一致自动受益）。

## 验证
- 本地：`npx eslint public/hub-filter.js scripts/build-seo.mjs`、`npx tsc -b`、`git diff --check`、`npm run build`、`node scripts/verify-dist.mjs`。
- 生产（qa/r669-probe.cjs 亮/暗 × 375/1280）：/examples/「engineer」应只剩标题/描述含 engineer 的卡片（预期 ≤ 5，不再是 30）、「nurse」仍 1；`role=status` 文本随输入更新；空态对比度亮/暗 ≥ 4.5；axe 真违规 0、console 0；主题键回基线。
