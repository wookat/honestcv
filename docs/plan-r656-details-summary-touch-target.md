# R656 — `<details><summary>` 折叠标题（/ats-checker FAQ、分数说明；builder 分数算法）小屏热区 20px / 16px

## 生产实证（index-DaRDVKBP.js，qa/r655-sweep.cjs 逐屏 axe + qa/r656-verify.cjs before，375）
- `/ats-checker` 底部 FAQ 四个 `<summary>`（`cursor-pointer text-sm font-medium`）实测 294×20（1280 为 638×20），axe `target-size` fail（块级 list-item，不享 2.5.8 行内豁免）。这是 R655 之外 sweep 报出的第二组真 fail。
- 同文件 447 行「What do these scores mean?」summary 同一 className，仅在有分数时渲染（本轮粘贴文本未触发，几何按同类推断）；Builder.tsx 8080 行「How this score is calculated」summary `text-xs`，1280 实测 571×16，375 默认状态下 ATS 面板不渲染该节点。
- 静态页 `build-seo.mjs` 的 `details.mnav/rnav summary` 分别已是 40×40 / 仅 ≥768px 显示，不在范围。

## 方案（3 处 className）
- 两处 `text-sm` summary：`-my-2.5 py-2.5 sm:my-0 sm:py-0` → 375 盒 40px；`text-xs` 的 builder summary：`-my-3 py-3 sm:my-0 sm:py-0` → 40px。负外边距抵消，文字位置、`<details>` 高度、展开后 `mt-2` 答案位置不变；≥640px 等于现状。不改结构/文案。

## 结果（index-CH8uqO1t.js，qa/r656-verify.cjs before/after）
- 375 FAQ ×4：20 → 40px、中心命中；文字顶距 13、details 高 46 等于修复前；点击展开答案距文字行 8px（mt-2）与修复前一致，Enter 再收起；滚到 FAQ 后 main 范围 axe 0（修复前 target-size 4 节点）；无溢出；零 console 错误。
- 1280：FAQ 638×20 等于修复前；builder summary 571×16 等于修复前（桌面不改）。
- 未验证：`What do these scores mean?`（需分数）与 builder summary 在 375 的实际 40px（默认状态不渲染）；仅 className 同型推断。未做真实读屏/真机触控。
- 部署：资产上传成功，Workers Routes 仍 code 10000。
