# R644 — 无障碍审计节点（axe-core）+ 关系图各行「Open / Delete / Use …」按钮补可访问名称（2026-09-06）

## 为什么这一轮做无障碍

R633–R643 在 /jobs 卡片、dashboard、builder Copies、/documents 上加了大量行内文字按钮（Open、Use this one instead、reconnect it …）。这些面从未做过自动化无障碍取证；老板的产品体验原则把「无障碍可用性」列为硬指标，且技术选型原则点名 axe-core。本轮先取证再动手。

## 生产实证（index-C-RldWYT.js，qa/r644-axe.cjs / qa/r644-axe2.cjs）

axe-core 4.13.0（wcag2a / wcag2aa / wcag21a / wcag21aa / best-practice），seed：真实职位 2091088 已跟踪（applied），链接副本 + cover + interview，另有 1 份早期 cover、1 份早期副本；页面通过 CDP `Page.setBypassCSP` 注入 axe（生产 CSP 只允许 self + 单一 hash，QA 注入需绕过，不改生产 CSP）。

- /jobs?tab=tracked&job=2091088、/dashboard、/documents、/builder：1280 与 375 **均 0 violations**。
- 打开的对话框：/jobs「Open targeted copy」确认弹窗、Stop tracking 弹窗、dashboard Resume settings 弹窗：1280 与 375 **均 0 violations**。

axe 没报，但按钮清单（`getByRole('button').allInnerTexts()`）暴露了一处一致性缺口：

- /jobs 跟踪卡片：`["Open saved brief","Open","Open","Open", …]` — 目标简历 / cover letter / interview prep / resignation letter 四行各有一个只叫「Open」的按钮；早期文档行、早期副本行的「Use this one instead / Use for this job」在多行时同名。
- dashboard 副本行：图标按钮已有 sr-only 名（「Duplicate X」「Delete X」「Edit name and target job for X」），唯独主按钮只叫「Open」；文档行同构（「Rename X」「Duplicate X」「Delete X」但「Open」）。
- builder Copies 行：「Duplicate copy X」有 aria-label，「Open」「Delete」没有。

读屏用户按按钮列表（rotor）浏览时听到一串「Open, Open, Open」；WCAG 2.4.4 在段落上下文内可算合格，所以 axe 不报，但同一行的兄弟按钮已经带主语，只剩 Open/Delete 没带，是我们自己的规范没贯彻到底。

## 方案（最小：只加 aria-label，可见文字不变）

可访问名称必须包含可见文字（WCAG 2.5.3 Label in Name），因此一律「可见动词 + 主语」：

- Jobs.tsx 卡片四行：`Open targeted resume <name>` / `Open cover letter <title>` / `Open resignation letter <title>` / `Open interview prep <title>`；早期文档行 `Open <kind> <title>`、`Use this one instead: <kind> <title>`（或 `Use for this job: …`）；早期副本行 `Use this one instead: targeted resume <name>`（或 `Use for this job: …`）。
- Dashboard.tsx：副本行 `Open <name>`，文档行 `Open <title>`（与兄弟按钮同款式）。
- Builder.tsx Copies 行：`Open copy <name>`、`Delete copy <name>`（与既有 `Duplicate copy <name>` 同款式）。

不改任何逻辑、样式、数据写入；不改生产 CSP。

## 生产 QA（1280 + 375，qa/r644-verify.cjs）

index-Dpid_6jw.js。seed 为 offer 状态 + 四类文档 + 早期 cover + 早期副本：

- /jobs 面板按钮名：`Open saved letter · Open targeted resume Sales Jedi — Creative Force · Use this one instead: targeted resume Sales Jedi — Creative Force (2) · Open cover letter CF — Cover · Open cover letter CF — Cover 2 · Use this one instead: cover letter CF — Cover 2 · Open resignation letter CF — Resignation · Open interview prep CF — Interview`
- dashboard：每份副本/文档 `Open X` 与 `Delete X` 成对；builder Copies：`Open copy X` / `Delete copy X`。
- axe 三页面 1280/375 仍 0 violations；无溢出；零 console 错误；零 AI 调用；存储回基线。

## 注意

- axe 0 violations 只覆盖自动化可检出的规则；键盘走查/读屏实听未做（如实）。
- QA 依赖 `Page.setBypassCSP`（qa/lib.cjs 现把 cdp 暴露给脚本），生产 CSP 未动。
