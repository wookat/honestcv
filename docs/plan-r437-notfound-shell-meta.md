# R437 — 未知路由 404 的原始 HTML 不再自称主页

## 生产实证（curl，2026-08-31）
- /nope-xyz：HTTP 404，但原始 HTML title/description/og:title/og:description 是主页营销文案、
  canonical/og:url 指向 https://cv.zalize.com/ ——404 页 head 自称主页（R429–R436 同族）；
  水合后 NotFound 的 usePageMeta 才改成 "Page not found — RezUp"，分享 unfurl/爬虫看不到。
- /s/bogus 同理拿未改写主页 shell（R436 QA 亦确认），水合后 gone 卡 + usePageMeta 回退
  "Shared resume | RezUp"。

## 方案（最小修复，仅 worker/index.ts 新增 404 分支）
- notFound 里非 live-share、非 SPA_ROUTES 路径：
  - 删除 canonical 与 og:url 标签（404 无规范 URL；文案为常量零注入面）；
  - 四标签重写为水合后 usePageMeta 逐字文案：/s/* 用 "Shared resume | RezUp" +
    "A resume shared with you via RezUp."，其余用 "Page not found — RezUp" + NotFound 描述句。
- live share、SPA_ROUTES、'/' 分支字节不变；404/noindex/no-store 语义不变。

## QA（生产，测试代理）
- curl /nope-xyz：404、四标签=NotFound 文案、无 canonical/og:url 标签；
- curl /s/bogus：404+noindex/no-store、四标签=Shared resume 回退文案、无 canonical/og:url、gone 卡照常；
- 回归：live 分享页 R432/R436 六标签、/builder R429/R430、'/' 不变；水合 NotFound 页零 console 错误；
  特批分享删净 404、基线字节还原。
