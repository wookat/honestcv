# R436 — 分享页原始 HTML 的 canonical 不再指向主页

## 生产实证（curl，2026-08-31，特批临时分享、验毕删净 404）
- 创建临时分享后 curl /s/<id> 原始 HTML：
  - title/og:title/og:url 已被 R432 重写为候选人与分享 URL（正确）；
  - 但 canonical 仍是 https://cv.zalize.com/ —— 与 og:url 自相矛盾（R431/R435 同族），
    向爬虫声明分享页是主页副本；水合后 CanonicalSync 才修正，爬虫看不到。
- /s/bogus（404 分支）不重写，维持现状（noindex + 404，无需 canonical）。

## 方案（最小修复，仅 worker/index.ts share 分支一行）
- 在 R432 重写链前部追加 `.replace(/<link rel="canonical" href="[^"]*"/, canonical=分享 URL)`，
  与 SPA_ROUTES 分支既有写法一致；revoked/未知 id、SPA、'/' 分支字节不变。

## QA（生产，测试代理）
- 特批一条临时分享：curl 原始 HTML canonical=og:url=/s/<id>、其余五标签回归 R432 文案；
  水合页 CanonicalSync/usePageMeta（R435）不变；/s/bogus 仍 404+noindex/no-store 且 canonical 保持 shell 原样；
  SPA 路由 /builder 原始 HTML R429/R430 回归；删净分享 404、基线字节还原、零 console 错误。
