# R4 设计方案：分页实时预览（P2-5「View as pages」+ 实际功能缺陷修复）

依据：docs/audit-2026-08-29-rezi-r1.md（P2-5：Rezi 编辑器预览按真实页展示，多页可见 + Auto-Adjust）。实证复核发现现状不止是差距而是缺陷：`ResumePreview` 用固定 aspect-ratio + `overflow:hidden`，**超过一页的内容在预览中被直接截断不可见**，但 PDF/DOCX 导出会输出多页——预览与导出不一致。

## 方案（架构决策）
- `ResumePreview` 增加 `paginated` 属性；默认 false 保持现状（landing hero 用单页缩略不变）。
- 分页实现用「窗口平移」法，不改内容渲染逻辑：每页一个固定 aspect-ratio 页框（overflow hidden），第 i 页内部把同一份内容 `translateY(-i * 窗口高)`。页数 = ceil(内容 scrollHeight / 页内容窗口高)，由 ResizeObserver 实时更新（编辑、换模板、字号行距变化时自动重分页）。
- 每页角标「Page i of N」；与既有「recruiters prefer one page」提示互补。
- Builder 预览面板（编辑区与 Finish 页）改用 `paginated`。

## 交互规格
- 多页时页框纵向堆叠、间距 gap；单页时视觉与现状一致。
- 不引入横向溢出；375px 下页框仍 100% 宽。

## 验证
- lint/build 全绿；独立 PR（基于 R3 分支）。
- 生产复验：长简历（多角色多 bullet）预览出现第 2 页且内容衔接正确；删内容回到 1 页；1440/375 无溢出；控制台干净。

如无异议按此执行。
