# R516 — /builder 桌面剩余 CLS：resume-length 计量行首帧渲染

## 一手证据（生产，2026-08-31）
- R515 复验时发现桌面 1280px 冷载 /builder 仍有一次 0.0272 位移（移动端已为 0）。
- 限速 CDP（1280×900，300ms/300KB/s）buffered layout-shift：单次 0.0272 @~1788ms，受影响节点为预览列（x≈645）的模板筛选 chip 条、预览容器、ATS score 卡——全部整体下移 82px。
- 元素排查：y 81–163 区间在最终布局中是「Resume length: … — looks sparse…」计量行（meter + 文案 + Auto-fit 按钮，66px 高 + 16px gap = 82px）。
- 源码根因：Builder.tsx 预览列 `{pdfLength !== null && (<div className="flex flex-wrap items-center gap-2">…)}` —— usePdfLength 的测量被 R472 刻意推迟到 load+idle，结果整行在 ~1.8s 后才插入，把下方模板 chips/预览/score 卡推下 82px。与 R515（examples.json 角色行）同构：异步数据门控整行插入。

## 方案（最小修改，仅 Builder.tsx）
- 计量行改为首帧渲染：去掉 `pdfLength !== null` 整行门控。
- pdfLength 为 null 时：meter 显示空进度（中性色）、aria-label 说明测量中；文案显示 "Resume length: measuring — the meter updates once the preview settles…"（长度与真实消息相近，减少换行差）；Auto-fit 按钮 disabled。
- 数据到达仅替换行内内容，不改行的存在性/结构。
- 非目标：不动 R472 的延迟测量（是正确的性能取舍）、不改移动端 pane 懒挂载（R477）、不追求任意视口下像素级零位移（换行行为 best-effort，与 R513 备案同口径）。

## 验证
- tsc / eslint（单查）/ build / verify-dist。
- 生产限速 CDP 1280px buffered layout-shift 归零（或仅剩与本行无关的项）；412px 回归仍 0；Auto-fit 测量完成后可用且行为不变；1280/412 零溢出；QA 后存储清理。
