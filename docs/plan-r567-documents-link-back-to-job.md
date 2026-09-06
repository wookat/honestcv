# R567 — /documents 卡片回链被跟踪职位

## 一手证据（生产 CDP，index-CO-GGYDA.js）
- 种子：jobPipeline 含 offer entry（Senior Engineer at Globex，coverDocId=d-cover-1、resignationDocId=d-resig-1），careerDocs 含对应两份文档。
- /documents 卡片 meta 只有「Cover letter · Edited today」——文档与职位的关联在文档面完全不可见；用户从文档侧无法回到该职位复查状态/报告。
- 职位 → 文档方向早已闭环：R384（cover）、R564（interview）、R565（resignation）在 /jobs 详情面板渲染「…: 标题 · Open」行；R562 为 targeted copy 做了 Builder → /jobs 回链。文档 → 职位是该链最后一个单向缺口。

## Rezi 对照
Rezi 8 月 changelog「Improved Application Tracking / clearer visibility」方向：应用相关产物与 tracker 双向可见。

## 方案（最小修复，仅 src/pages/Dashboard.tsx）
- import listPipeline（@/lib/jobs）。
- useMemo 由 docs 重算 docId → PipelineEntry 映射（扫 coverDocId/interviewDocId/resignationDocId）。
- 文档卡 meta 行追加「· for <SPA Link to=/jobs?job=id>Senior Engineer at Globex</Link>」；无关联零渲染。

## 非目标
- 不改 jobs.ts / 保存钩子 / 关联写入（R563–R565 语义不动）。
- 不改 viewer/导出/计数/徽标。
- 不消耗真实 AI 配额。

## 验证
- npx tsc -b；npx eslint src/pages/Dashboard.tsx；npm run build；npm run verify-dist。
- npx wrangler deploy（预期 Workers Routes code 10000 既有权限缺口，资产+worker 上传成功）。
- 生产 QA：1280/375 卡片显示回链且点击落 /jobs?job=<id> 详情面板；无关联文档零渲染；零溢出零 console 错误；QA 后存储回六键基线。
