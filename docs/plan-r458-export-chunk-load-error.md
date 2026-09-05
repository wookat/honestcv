# R458 — friendly error when the PDF/DOCX exporter chunk fails to load

## 一手证据（生产）

- R455 已为「上传解析」侧的懒块失败加了友好文案（`extractFile.ts` 的 `loadEngine`），
  R434 已为分享页 PDF 下载加了固定友好文案。
- 但「导出」侧的懒块 `import('@/lib/pdf')` / `import('@/lib/docx')` 仍有三个面
  在块加载失败（断网/弱网/跨部署陈旧标签页）时不诚实：
  1. Builder 简历下载（`Builder.tsx` `runDownload` 路径）：catch 直接展示
     `e.message` → 用户看到 "PDF download failed: Failed to fetch dynamically
     imported module https://cv.zalize.com/assets/pdf-….js"。
  2. Dashboard `runDownload` 与 `docDownload`：同样展示原始 `e.message`。
  3. Builder 文档工具对话框（cover/interview/resignation 生成结果的
     PDF/DOCX 按钮，行 ~10320/10334）：`void import(...).then(...)` 无 catch —
     失败完全静默 + 产生 unhandled rejection。
- Chrome 对失败的动态 import 做文档级缓存（R434/R456 实证），因此文案需要
  指向 reload。

## 方案（最小改动）

- `src/lib/download.ts` 新增 `loadExporter<T>(load)`（与 `extractFile.ts`
  `loadEngine` 同款包装），失败抛：
  `Could not load the download component — check your connection, then reload and try again.`
- 五个动态 import 调用点包上 `loadExporter`：
  - `Builder.tsx` 简历下载 pdf/docx 两处；
  - `Builder.tsx` 文档对话框 pdf/docx 两处按钮改为 async + try/catch →
    `setError(...)`（该对话框已有 `error` 展示位）；
  - `Dashboard.tsx` `docDownload` pdf/docx 与 `runDownload` pdf/docx。
- SharedResume（R434 已有固定友好文案）、`usePdfLength`/auto-fit 的后台测量
  路径（静默降级，无用户动作）不动。

## 验证

- tsc / eslint / build 本地全绿。
- 生产 QA（testing agent）：CDP 阻断 pdf/docx 导出块 →
  - Builder 工具栏 PDF/DOCX 下载失败展示新文案（非原始串）；
  - Builder 文档对话框 PDF/DOCX 失败出可见 error 文案、零 unhandled rejection；
  - Dashboard 简历/文档下载失败同款文案；
  - 解封 + reload 后下载恢复；happy path、TXT/MD 不受影响；375 光暗回归。
