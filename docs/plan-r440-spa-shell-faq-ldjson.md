# R440 — SPA shell 去掉主页 FAQPage 结构化数据（FAQ 内容只在主页可见）

## 一手生产实证（2026-09-05, cv.zalize.com）

curl /builder（raw HTML）包含两个 ld+json 块——WebApplication 与 **FAQPage**（
"Will my resume pass ATS systems?" 等主页 FAQ）。同一 spa.html shell 服务全部
非 '/' SPA 路由（/builder /ats-checker /dashboard /documents /samples /jobs，
六个可索引 200 路由）以及 /s/ 与 404。

但 FAQ 内容只在 Landing（'/'）渲染（src/pages/Landing.tsx，"Will my resume pass
ATS" 仅此一处）；/builder 等页面上用户根本看不到这些问答。Google 结构化数据规范
明确要求 FAQPage 标记的问答必须在该页面对用户可见——不可见即违规标记，可招致
富结果失效乃至手动处罚。R429/R430 已把 shell 的 canonical/四标签按路由重写诚实化，
JSON-LD 是同族残留：六个路由仍向爬虫自称主页 FAQ 页。

WebApplication 块是站点级实体（name/url 指站点本身），各路由保留合理，不动。

## 方案（最小修复，仅 scripts/prerender.mjs）

生成 spaShell 时剥掉 FAQPage 块（index.html 主页保留不动）：

```js
const spaShell = shell
  .replace(/[^\S\n]*<script type="application\/ld\+json">\s*\{[^]*?"@type":\s*"FAQPage"[^]*?<\/script>\n?/, '')
  .replace('</head>', …modulepreload…)
  .replace(marker, …skeleton…)
```

- index.html（'/'，FAQ 可见）字节不变。
- spa.html 仅少一个 script 块；worker 重写逻辑、SPA_META、404/share 分支全不动。
- 若剥除后 spa.html 仍含 FAQPage 则构建报错（防回归断言）。

## QA 清单

1. curl /builder /jobs /ats-checker：raw HTML 零 FAQPage，WebApplication 保留，R430 四标签回归。
2. curl /：FAQPage + WebApplication 双双保留（主页不动），FAQ 内容在页面可见。
3. curl /nope-xyz 与 /s/bogus：零 FAQPage，404+noindex（R437/R438）回归。
4. CDP 水合 /builder：正常渲染零 console 错误；R439 canonical 回归。
5. 375 光暗零溢出、localStorage 基线字节还原、零逃逸。
