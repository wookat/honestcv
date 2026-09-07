# R657 — builder 关键词芯片（Missing keywords「+ kw」/「×」、Skills 建议、Restore）小屏 20–22px → 32px

## 生产实证（index-CH8uqO1t.js，qa/r657-evidence.cjs before，seed 含 JD 的目标副本，375）
- Missing keywords 每个胶囊 22px 高：`+ kw` 65×20、`×`（Mark as not relevant）21×20 紧邻、间距 gap-1=4px；同款还有 Skills 区「Mentioned in your experience」/「Common for your target role」建议芯片、ATS 分类面板三键胶囊（+ kw / Sparkles 草拟 bullet / ×）、ignored → Restore 虚线芯片。1280 同为 22px。
- axe target-size 通过——靠 2.5.8 的间距豁免（22+4 ≥ 24），不是靠尺寸；实际 375 上「+ kw」与「×」零间距并排，误触 × 会把关键词移出评分（有 Restore 但用户需发现）。这是 ATS 定向的核心操作面，密集网格采用 32px（Material 芯片标准高）而非 40px，避免 8 行网格从 208px 涨到 350px+。

## 方案（Builder.tsx 13 处 className，仅小屏）
- 胶囊内按钮与独立芯片：`min-h-8 sm:min-h-0`（20 → 32）；`×`/Sparkles 键 `px-2 sm:px-1.5`（21 → 25 宽）；5 个 wrap 容器 `gap-1.5 sm:gap-1`（4 → 6）。≥640px 等于现状。不改文案/数据/键盘 roving 逻辑。

## 结果（index-H5mVtm7t.js，qa/r657-evidence.cjs before/after）
- 375：`+ kw` 65×32、`×` 25×32 中心命中、胶囊 34（含边框）、行距 6；网格 8 行 126 → 194px（预期内的布局变化，截图 qa/shots/r657）。点 `+ initech` 写入 skills、点 × 写入 ignoredKeywords 行为不变；axe main 0；无溢出；零 console 错误。
- 1280：几何逐项等于修复前（65×20 / 21×20 / gap 4 / 组高 48）。
- 未实测：Skills 建议芯片与 Restore 芯片的 375 几何（同 className 推断）；Sparkles 键仅在分类面板出现。未做真机触控。部署资产上传成功，Workers Routes 仍 code 10000。
