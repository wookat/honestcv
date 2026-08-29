# R12 设计方案：P2 清理 —— session 探测 401 静默 + 部署后 HTML 陈旧窗口收窄

一手证据：
- worker/index.ts `app.get('/api/za/session')` 未登录时返回 401 → 浏览器 console 必然打印红色错误（fetch 无法抑制），R10/R11 QA 均观测到；唯一消费方 src/lib/resumeCenter.ts `zalizeSessionEmail()` 只关心 `res.ok`+`data.email`。
- R11 QA 实测：部署后首个生产加载拿到旧 HTML（引用已删 bundle index-C-JhY2En.js → 404 无样式页），约 4 分钟后恢复。根因：页面响应 `Cache-Control: public, max-age=300, s-maxage=600`，zone edge cache 无法用现有 token purge，旧 HTML 存活期内新部署已删除旧 hash 资源。

## 方案（本批小改）
1. `/api/za/session`：未登录改为 `200 { email: null }`（不再 401）。客户端 `data.email ?? null` 语义不变，console 不再出现红色错误。同源探测无信息泄露差异。
2. 页面 Cache-Control 由 `max-age=300, s-maxage=600` 收紧为 `max-age=60, s-maxage=60`：将部署后陈旧 HTML 窗口从最长 ~10 分钟收窄到 ~1 分钟；/assets/ 仍 immutable 一年不变，边缘命中主要靠资源层，Worker 渲染页面成本低。CACHE_VER 随本轮 bump 使 Worker 内部缓存立即失效。

## 验证
本地 lint/tsc/build 全绿 → PR（基于 R11 分支）→ 部署 → 生产复验：未登录访问 /builder console 无 401 错误；`curl -sI https://cv.zalize.com/` 显示新 Cache-Control；双视口回归。

如无异议按此执行。
