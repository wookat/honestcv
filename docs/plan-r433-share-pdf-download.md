# R433 — 分享页 /s/<id> 给接收者一键下载真实 PDF

## 生产实证（2026-08-31）
- `src/pages/SharedResume.tsx` + 生产 /s 页头部：ready 态只有 `Print`（走 `window.print()`，
  依赖浏览器"另存为 PDF"）和 `Build your own free resume` 两个按钮，没有任何直接下载。
- 分享链接的核心受众是招聘官/内推人：他们经常需要真实的 PDF 文件（转发、上传 ATS、存档）。
  Print-to-PDF 出来的是浏览器分页渲染，与应用的真实导出（jsPDF：真实字体嵌入、链接注解、
  页边距/分页逻辑，R271/R275/R293 系列）不一致，且在移动端操作繁琐。
- 应用已具备全部能力：`downloadResumePdf(resume, filename)`（@/lib/pdf，懒加载 chunk）
  和 `professionalFileName`（R239 专业文件名），Builder 下载即用这两件套。

## 方案（最小修复，仅 SharedResume.tsx）
- ready 态头部在 Print 旁新增 `Download PDF` 按钮：
  - `await (await import('@/lib/pdf')).downloadResumePdf(state.resume, professionalFileName([fullName, targetRole, 'resume'], 'pdf'))`
  - busy 态按钮禁用并显示 "Preparing…"。
  - 失败时 role=alert 显示友好文案（对齐 R413 模式）："Preparing the PDF failed — try again."
- 不加任何门槛：接收者不是下载门（免费邮箱门）的对象，分享内容本来就是所有者主动公开的快照。
- Print、gone/error/loading 分支、快照渲染全部字节不变。

## QA（生产，测试代理）
- 特批创建一条临时分享（合成简历），验证：Download PDF 出真实 PDF（pypdf 校验文本/页数/
  文件名 professionalFileName 规则）、busy/恢复、强制 import 失败→alert 文案、Print 回归、
  gone/error 分支回归、移动端 375 布局、基线字节还原，删净分享并确认 404。
