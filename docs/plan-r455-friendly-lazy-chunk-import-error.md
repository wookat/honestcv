# R455 — 上传解析引擎懒块加载失败的友好文案

## 一手实证

R453 QA 已在生产实证（CDP 阻断 chunk 复现）：断网/弱网时 `.docx` / `.pdf`
上传路径的懒块（fflate、pdfjs ~1MB legacy chunk）加载失败，错误被各调用方
`err.message` 原样展示——用户看到浏览器技术串
"Failed to fetch dynamically imported module: https://cv.zalize.com/assets/…"
（R453 银行 P4，本轮闭环）。四个入口共用 extractFile.ts：
/ats-checker、Builder 导入对话框、Dashboard（两处）、Landing。

## 方案（窄）

仅 `src/lib/extractFile.ts`：新增 `loadEngine()` 包装三个动态 import
（pdfjs 主块、pdfjs worker、fflate），加载失败抛
"Could not load the file reader — check your connection and try again, or paste the text instead."
（与 R410/R434 文案家族一致）。解析失败分支
（坏 PDF/坏 DOCX/扫描件无文本）文案不变；调用方零改动。

## 不做

- 不加重试逻辑（Chrome 对失败 import 有文档级缓存，刷新即恢复，文案已指引）。
- 不动 pdf 导出路径（R434 已处理分享页；Builder 导出错误面另行审计）。

## 验收

- tsc/eslint/build 绿。
- 生产 CDP：阻断 fflate/pdfjs chunk 后上传 .docx/.pdf → 精确友好文案、零未捕获错误。
- happy path：正常上传 .docx/.pdf 解析照旧、file checks 照旧。
- 坏文件文案回归（damaged PDF/DOCX、scanned no-text）。
