# R438 — 普通未知路由 404 补 X-Robots-Tag: noindex

## 一手生产实证（2026-09-05，curl）
- `curl -sI https://cv.zalize.com/nope-xyz` → HTTP 404，但响应头**没有** `x-robots-tag`、没有 `cache-control`。
- `curl -sI https://cv.zalize.com/s/bogusid1234` → HTTP 404 且带 `x-robots-tag: noindex` + `cache-control: no-store`。
- 同一 notFound handler 内的头设置只覆盖 `/s/` 前缀（worker/index.ts `if (path.startsWith('/s/'))`），普通未知路由被漏掉。
- R437 QA 独立发现并入银行的同一缺口，本轮以直接 curl 复证后立项。

## 影响
- 已被外链/误链的任意 404 URL（如失效营销链接、拼错路径）可被爬虫抓取并尝试索引；R437 已删 canonical/og:url 把危害降到低，但行业标准（Google 文档）对确定不该进索引的 4xx 页仍建议 noindex 显式声明，与 `/s/` 分支保持一致也消除头部不对称。

## 方案（最小修改，worker/index.ts notFound 一处）
```ts
if (path.startsWith('/s/')) {
  headers['X-Robots-Tag'] = 'noindex'
  headers['Cache-Control'] = 'no-store'
} else if (!SPA_ROUTES.has(path)) {
  headers['X-Robots-Tag'] = 'noindex'
}
```
- 普通未知路由（最终 404）补 `X-Robots-Tag: noindex`；不加 `Cache-Control: no-store`（404 shell 无个体数据，且安全头中间件只给 200 设缓存头，维持现状）。
- `/s/`、SPA_ROUTES、`/`、live share 分支字节不变；body 重写逻辑（R437）不动。

## QA 清单
1. curl /nope-xyz：404 + `x-robots-tag: noindex`，R437 body（NotFound 文案、零 canonical/og:url）回归。
2. curl /s/bogus：404 + noindex + no-store 不变。
3. curl /builder、/：200、无 x-robots-tag、R429/R430 元数据回归。
4. live share：200、noindex/no-store、R432/R436 元数据回归（特批临时分享，验毕删净 404）。
5. 水合 /nope-xyz：NotFound 渲染、零 console 错误。
6. 零逃逸、localStorage 字节还原。
