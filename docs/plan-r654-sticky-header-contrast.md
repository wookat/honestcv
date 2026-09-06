# R654 — 粘性半透明页头滚过深色/着色区块时，导航文字对比度跌到 3.87–4.3（< 4.5）

## 生产实证（index-DoQxTL4K.js，qa/r654-evidence.cjs + r654-verify.cjs before）
- SPA 页头（`Layout.tsx`）与静态页页头（`scripts/build-seo.mjs` 的 `header.site`）都是 `background 85% + backdrop-blur`，导航文字 `text-muted-foreground`（#626975，13–14px）。页顶在纯白上 6.0:1 通过；但页头是 sticky，滚动后叠在下方内容上时 axe color-contrast（按 alpha 与下层元素混色）实测：
  - 1280 `/pricing/` 滚到 y=300/600：`ATS Checker`、`Pricing` 两条导航 3.87:1（前景 #626975 / 混色背景 #d7d8d9）。
  - 1280 `/dashboard` 空态把「Import your LinkedIn」滚到视口中央（页头叠在渐变空态卡上）：`by Zalize` 4.3:1（#dce3f5）。
  - 375 两页均通过（导航隐藏、下层区块不同）；R648 审计只在页顶跑 axe，因此没发现。
- 竞品对照：Rezi 公开页页头为不透明白底（此前审计截图），无此问题。

## 方案（两处 85% → 95%，保留毛玻璃）
- `Layout.tsx`：`bg-background/85` → `bg-background/95`；`build-seo.mjs` `header.site`：`color-mix(in oklch,var(--bg) 85%,transparent)` → `95%`。
- 推算：muted #626975 相对亮度 ≈0.146；95% 白底叠任意下层（含纯黑）混色亮度 ≥0.93 → 对比 ≥(0.93+0.05)/(0.146+0.05)=5.0，全站任何滚动位置都 ≥4.5。暗色主题同理（浅色文字叠 95% 深底）。
- 不改 builder 内 sticky 区段导航（同样 85%，但下层是表单卡片白底，实测未见失败；如实标注未改）。

## 结果（index-BooZ5OSm.js，qa/r654-verify.cjs after，ALL PASS）
- 1280 `/pricing/` y=300/600 页头最低对比 3.87 → 4.84；1280 `/dashboard` 空态叠渐变 4.3 → 5.02；页顶、375、暗色主题（6.4）全部 ≥4.5；页头计算样式 alpha 0.95 仍半透明；无溢出、零 console 错误。
- 部署：资产上传成功，Workers Routes 仍 code 10000。未做：真实读屏实听、真机对照。
