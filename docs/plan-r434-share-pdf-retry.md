# R434 — 分享页 PDF 失败提示给出真正可行的恢复路径

## 生产实证（R433 QA，2026-09-05）
- 生产 /s/<id> 冷加载阻断 assets/pdf-*.js 后点 Download PDF → alert "Preparing the PDF failed — try again."。
- 网络恢复后在同一文档内再点：Chrome 对失败的动态 `import()` 结果做文档级缓存，**不会重新发起
  chunk 请求**，重试永远失败、提示常驻——"try again" 的承诺在同会话内不成立。刷新页面后重试即成功。
- 这是浏览器语义（模块图中失败记录不可重试），非代码 bug；但我们的文案让用户原地重按，属不诚实提示。

## 方案（最小修复，仅 SharedResume.tsx）
- 失败 alert 文案改为 "Preparing the PDF failed — check your connection, then reload and try again."
  并在 alert 内加 "Reload page" 按钮（`window.location.reload()`）。分享页无本地未保存状态，刷新零代价。
- 成功/busy 路径、Print、其余分支字节不变。

## QA（生产，测试代理）
- 特批一条临时分享：冷加载阻断 pdf chunk→点下载→新文案 + Reload page 按钮；解除阻断→点 Reload→
  页面刷新后再点下载→真实 PDF 成功。happy path/375 光暗/R433 回归、删净分享 404、基线字节还原。
