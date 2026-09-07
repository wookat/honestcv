# R658 — SOP-10 审计节点 + 键盘焦点不再滚到粘性页头/固定底栏之下（WCAG 2.4.11）；builder 375 页脚末行可点

## 审计节点（index-H5mVtm7t.js，qa/r658-audit.cjs 逐屏滚动累计 axe，7 路由 × 1280/375；Rezi 公开页 qa/rezi-r658*.cjs）
- 1280：7 路由真实 axe 违规 0、无名可聚焦元素 0、console 错误 0；375：同上，唯一 3 条 target-size 报在 builder Skills 建议芯片（`+ HubSpot` 等 22px）。
- 复核（qa/r658-chips.cjs，同 seed，Builder-CRCnH5T2.js）：生产芯片实测 32px、className 含 `min-h-8`，与 R657 源码一致。审计跑在 R657 部署刚完成时，抓到的是旧 Builder 分块（class 无 min-h-8），属边缘缓存时差伪影，**非缺口**；R657 PR 描述中「skill suggestions」成立。
- Rezi 公开页（首页/pricing/ai-resume-builder/tools/job-search；ai-keyword-targeting 404）：宣称能力仍为 builder / keyword targeting / score / job search / cover & resignation letter / interview，无新公开功能面；本仓已有对应面，本轮无新增功能缺口。

## 生产实证（qa/r658-evidence.cjs、qa/r658-verify.cjs before，375 与 1280）
- Shift+Tab 反向走查时浏览器把焦点元素滚到视口**顶端**，正好落在 57px 粘性页头之下：/dashboard 375 有 40 处焦点停靠与页头相交（如「Browse all examples」26–43 全部被遮）、1280 有 36 处；/documents 375 2 处（`editor` 链接 9–26 全遮）、1280 2 处；/builder 375 26 处（页头 0–57 + 粘性 section nav 56–106 双层）。
- /builder 375 正向 Tab：粘性 section nav 的按钮（Contact/Summary/…）在 742–782 被 61px 固定底栏（751–812）遮住 26 处。
- /builder 375 页脚：滚到底后末行「HonestQR / HonestPDF / SubSleuth」在 756–771，永久位于固定底栏之下，`elementFromPoint` 命中底栏按钮——触控不可达（其余 21 个页脚链接可达；/dashboard 24/24 可达）。
- 以上对键盘用户是 WCAG 2.2 AA 2.4.11 Focus Not Obscured (Minimum) 失败：焦点元素被作者内容完全遮住；axe 无对应规则，静态审计看不到。

## 方案（index.css + Builder.tsx + Dashboard.tsx，不改文案/数据/布局）
- `html { scroll-padding-top: 4rem }`（页头 57）；`html:has([data-sticky-subnav]) { scroll-padding-top: 7rem }`（builder 页头 + section nav 106）；`<1024px` 且 `html:has([data-pane-switcher]) { scroll-padding-bottom: 5rem }`（底栏 61）。浏览器为焦点/`scrollIntoView`/hash 锚点滚动时自动避开这些区域。
- 既有锚点偏移改为与 scroll-padding 相加后**等于原值**：builder 区段 `scroll-mt-28`(112) → 0（112+0）；dashboard `#documents/#samples` `scroll-mt-20`(80) → `scroll-mt-4`（64+16）；builder `#preview` `scroll-mt-16` 移除（无任何入口链接到它）。
- builder 底部留白从 `main pb-20 lg:pb-6` 移到页脚外层 `pb-14 lg:pb-0`：main 24 + 页脚 56 = 原 80，页面总高不变，页脚末行离视口底 97px > 底栏 61。

## 结果（本地 vite preview + 生产，qa/r658-verify.cjs 375/1280）
- 375 preview：/builder scroll-padding 112/80、/dashboard /documents 64——三路由 Shift+Tab / Tab 被遮焦点 0；jump-to-section「Skills」落点 112 不变；/dashboard#documents 落点 80 不变；页脚 24/24 可达；scrollHeight 5584/6440/1626 逐一等于修复前；axe 0、无溢出、零 console 错误。
- 生产复验见 handoff R658 段。
- 未处理（如实）：1280 /builder 正向 Tab 到预览内「Edit text」span 时其位于 1017px 视口外——预览列 `lg:sticky` 高于视口，浏览器无法滚入，属既有独立问题（候选轮）；未做真实读屏实听与真机触控。
