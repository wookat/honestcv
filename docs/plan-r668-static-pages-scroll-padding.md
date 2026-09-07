# R668 — SOP-10 审计节点（首次覆盖预渲染 SEO 静态页）+ 静态页锚点跳转 / 键盘焦点不再落在粘性页头之下（WCAG 2.4.11）

## 审计节点（生产 index-DE-3CXPP.js；qa/r666-scan.cjs 逐屏累计 axe、qa/r666-icons.cjs 非文本、qa/r667-focus.cjs 焦点环、qa/r668-rezi.cjs 竞品）
- 应用 8 路由（/ /builder /dashboard /jobs /documents /ats-checker /pricing /samples）× 1280/375 × 亮/暗：axe 真违规 0、无名可聚焦 0、计算式文本对比度低于阈值 0、图标非文本对比度低于 3:1 0（64 个 builder 图标控件）、焦点环弱/无 0、console 错误 0；obscured-only 候选（builder 3、/documents 2、/samples 2、/templates 1）全部是粘性页头 / 固定底栏在 400px 滚动步长下盖住目标的伪影，非缺口。
- 焦点扫描在 /pricing 暗色报 39 处「环 1.02:1」：/pricing 是预渲染静态页、无 `:focus-visible` 样式、走 Chrome UA 自动焦点环；计算值 `outlineColor` 为 rgb(16,16,16)，但 `color-scheme:dark` 下实际渲染为白色——像素复核（qa/r668-focus-pixels.cjs）导航链接 / 主按钮 / skip link 均 19.56:1（亮色 18.52:1）。计算值假阳性，不改。
- /pricing 5 处「nofocus」是关闭状态 `<details class="rnav">` 下拉里的链接，不可聚焦是正确行为。
- Rezi 公开页（首页 / ai-resume-builder / pricing / resume-checker）：宣称能力仍是 builder、score/checker、tailoring、keyword targeting、examples/templates、cover/resignation letter、job search、interview prep；DOM 无 skip link、`nav/header/footer` 地标 0。无新的功能维度缺口。
- **首次把 sitemap 上的 114 个预渲染 SEO 页纳入节点**（此前 R644 起所有 axe/焦点节点只跑 React 路由 + /pricing）：抽样 /guides/ /guides/best-resume-fonts/ /examples/ /examples/software-engineer/ /templates/ /templates/modern/ /vs/zety/ /cover-letter-examples/ /about /ai /free-ats-resume-checker /terms × 1280/375 × 亮/暗——axe 真违规 2 条 target-size（/cover-letter-examples/ 1280 目录链接、/examples/software-engineer/ 375 相关链接），复核（qa/r668-ts.cjs）在同页别的滚动位置为 0，related node 是页头 `summary[aria-label=Menu]`——同为粘性页头滚动步长伪影；计算式对比度 0、console 错误 0。

## 生产实证（qa/r668-anchor.cjs、qa/r668-focusobs.cjs，1280 与 375）
- 静态页目录「On this page」锚点跳转：点击 `.toc a[href="#registered-nurse"]`（/cover-letter-examples/）或 guides 任一目录项后，目标 `h2[id]` 顶边在视口 16px，而粘性 `header.site` 底边 57px；`elementsFromPoint` 在标题处命中的是页头 `DIV.in` / logo `IMG`——**标题被页头整段盖住**，用户只看到标题下的正文。1280 与 375 相同（h2Top 15.6–16.3）。
- Shift+Tab 反向走查（从页底）：浏览器把焦点元素滚到视口顶端、落在页头之下——375 /guides/best-resume-fonts/ 「RezUp vs other resume builders」top 22.8 / 「Resume examples by role」top −0.4 / 「Check my ATS score」/「Start building free」；/cover-letter-examples/ 「AI cover letter generator」top 0.5；1280 /examples/software-engineer/ 「Registered Nurse resume example」top 24.7（页头底 57）。对键盘用户是 WCAG 2.2 AA 2.4.11 Focus Not Obscured (Minimum) 失败。「Skip to content」top 8 属误报：`a.skip` z-index 30 > 页头 20，位于页头之上。
- 根因：`scripts/build-seo.mjs` 静态 CSS 只有 `h2[id]{scroll-margin-top:1rem}`，没有 `scroll-padding-top`；React 应用侧已在 R658 用 `html{scroll-padding-top:4rem}` 收口，但 SEO 生成器的样式表独立，从未同步。

## 方案（只改 scripts/build-seo.mjs 的 CSS 字串，不改任何页面内容/结构）
- `html{scroll-padding-top:4rem}`（页头 3.5rem + 1px 边框 = 57px，与应用侧 R658 同值）。
- `h2[id]{scroll-margin-top:1rem}` → `.5rem`：锚点落点 = 64 + 8 = 72px（页头下 15px），接近原设计意图「标题下方留 1rem」而不再被盖住。
- 不动 `a.skip`、目录、相关链接布局；不改应用侧任何文件。

## 验证
- 本地：`npx tsc -b`、`npx eslint scripts/build-seo.mjs`、`git diff --check`、`npm run build`、`node scripts/verify-dist.mjs`；`grep scroll-padding-top dist/guides/index.html`。
- 生产（部署后以实际 HTML 内联 CSS 为准）：qa/r668-anchor.cjs 三条目录跳转 h2Top ≥ 57；qa/r668-focusobs.cjs 三页 × 1280/375 Shift+Tab 被页头盖住的焦点 = 0（排除 a.skip）；qa/r666-scan.cjs 抽样静态页 axe 真违规仍为 0、console 错误 0、存储回基线。
