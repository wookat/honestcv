# R439 — CanonicalSync 归一化尾斜杠，水合后不再改写 canonical 为 /builder/ 变体

## 一手生产实证（2026-09-05, cv.zalize.com）

curl（raw HTML，正确）：

```
GET /builder/  -> 200
<link rel="canonical" href="https://cv.zalize.com/builder" />
<meta property="og:url" content="https://cv.zalize.com/builder" />
```

worker notFound 已归一化尾斜杠（`path.replace(/\/+$/, '')`），所以 /builder/、/jobs/ 等
带斜杠变体都 200 并自指到无斜杠规范 URL——这是对的。

CDP（水合后，缺陷）：

```
load https://cv.zalize.com/builder/
canonical = https://cv.zalize.com/builder/   ← 被 CanonicalSync 改写
og:url    = https://cv.zalize.com/builder/
```

CanonicalSync 直接用 `useLocation().pathname` 原文拼 URL，未归一化尾斜杠。
后果：直载 /builder/ 的页面在 JS 运行后 canonical/og:url 与 raw shell 自相矛盾，
向支持 JS 渲染的爬虫（Googlebot）声明尾斜杠变体是独立规范 URL——重复内容信号，
与 R429/R431/R436 修掉的同族 raw-vs-hydrated 不一致。

## 方案（最小修复，仅 src/App.tsx）

CanonicalSync 内与 worker 相同的归一化：

```ts
const canonicalPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
const url = `https://cv.zalize.com${canonicalPath}`
```

- 客户端导航路径（React Router Link）从不产生尾斜杠 → 行为字节不变。
- 仅直载带斜杠变体时水合结果改为与 raw shell 一致。
- usePageMeta/worker/SPA_META/404 分支全部不动。

## QA 清单

1. CDP 直载 /builder/：水合后 canonical==og:url==https://cv.zalize.com/builder（无斜杠），与 curl raw shell 一致。
2. CDP 直载 /builder（无斜杠）：canonical/og:url 不变（回归）。
3. 客户端导航 /builder→/jobs→/dashboard：六标签跟随路由（R431 回归）。
4. curl /builder/ 与 /jobs/：raw shell 仍 200+无斜杠 canonical（worker 未动）。
5. /nope-xyz 仍 404+noindex（R437/R438 回归）；/ 直载 canonical=https://cv.zalize.com/。
6. 375 光暗零溢出、零 console 错误、localStorage 基线字节还原。
