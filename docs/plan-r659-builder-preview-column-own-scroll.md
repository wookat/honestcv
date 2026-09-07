# R659 — builder 桌面预览列改为自滚动容器（sticky 列高于视口时 ATS 面板与键盘焦点不可达）

## 证据（生产 index-CplAcj51.js，qa/r659-evidence.cjs / r659-scroll.cjs / r659-verify.cjs before）
- 1280×812 与 1440×900：`#preview` 为 `lg:sticky lg:top-20`，列高 2744（芯片 79 + 预览纸 602 + ATS 卡 1182 + 关键词卡 766 + 底栏 36），左编辑列 4452，页高 4894。
- 粘性列在 scrollY 0–~1700 期间固定在 top 80：ATS「See full score breakdown」按钮停在 y=930、关键词卡 2008–2774，**整整 1700px 的编辑滚动里都在视口外且不动**；只有当页面滚过左列大半（Experience/Education 之后）粘性才释放，此时预览纸又滚出了视口。即桌面用户在编辑时看不到 ATS 分数细节与缺失关键词面板——产品核心差异化面板在标准笔记本视口下"不存在"。
- 键盘：从预览列首个可聚焦元素 Tab 走完 139 站，3 站焦点在视口外（score breakdown 按钮 930、`How this score is calculated` summary 956、一个 input 1005）——浏览器按普通流计算滚动量滚动了窗口，但粘性元素不随之移动，焦点整站不可见（WCAG 2.4.11/2.4.12）。R658 已记录为候选。
- 鼠标滚轮悬停在预览列上滚 900px：`scrollY` 900、列 `scrollTop` 0、按钮仍在 930——滚轮只滚页面，列内容不动。
- 375：预览列非粘性（`hidden lg:block` + 底栏切换），不受影响。

## 方案
- `#preview`：`lg:sticky lg:top-20 lg:self-start` 之外加 `lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:[scrollbar-width:thin]`——列自身成为滚动容器（视口 812 → 列高 716，底边 797），滚轮悬停即滚列、键盘焦点由浏览器在嵌套滚动容器内 scrollIntoView。这是侧栏高于视口时的通用做法（文档站侧栏、GitHub PR 文件树）。
- 打印：`print:max-h-none print:overflow-visible`——`@media print` 只隐藏非 `[data-resume-preview]` 祖先链之外的元素，`#preview` 是祖先，不能带 overflow 裁剪。
- 不改 375、不改左列、不改数据。

## 验证（qa/r659-verify.cjs）
- 1280×812 本地：列底 797 ≤ 812；overflow auto、scrollHeight 2731 > 716；滚轮 600 后 scrollY 0 / scrollTop 600、score 按钮 y=331 且 elementFromPoint 命中；Tab 139 站视口外 0（before 3）；print 媒体下 max-height none / overflow visible；列内无绝对定位后代越出列框；axe 0；无溢出。
- 375×812 本地：预览面板 static / max-height none / overflow visible 不变；Tab 139 站；axe 0；无溢出。
- 本地唯一 console 错误为 vite preview 无 `/examples/examples.json`（Worker 才提供），非产品问题。
- 生产复验：见 handoff-context R659。
