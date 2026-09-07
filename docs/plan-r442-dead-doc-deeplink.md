# R442 — 死 ?doc= 深链诚实反馈（/documents 不再静默无视）

## 一手生产实证（2026-09-05, cv.zalize.com）

CDP 直载 `/documents?doc=bogus-r442-xyz`：零 alert、零 dialog，页面静默渲染普通
文档列表并把死参数从 URL 剥掉——用户点开 /jobs 行的 "Cover letter: … Open"
深链或收藏的文档链接（文档已删除）时，得不到任何"没找到"提示。
R425（?example）/R426（?template）/R441（?job）同族缺口的最后一个死深链面。

## 方案（最小修复，仅 src/pages/Dashboard.tsx）

- 新增 `docLinkNotFound` state：挂载初始化器一次性校验 `docSeedParams.get('doc')`
  是否在 `listCareerDocs()` 中（纯本地读取，零 fetch 零 effect）。
- 文档 section 副标题下渲染 role=alert 卡（R417/R441 同款 destructive 样式）：
  "The document in that link wasn't found — it may have been deleted." + Dismiss。
- 有效 ?doc=（照常开 viewer）、无参 /documents、kind 过滤、既有 URL 参数
  清理 effect 全部字节不变。

## QA 清单（生产）

1. `/documents?doc=<bogus>`：alert 卡精确文案 + Dismiss 清卡；死参数照旧被剥。
2. `/documents?doc=<有效 id>`：无卡，viewer 照常打开。
3. 无参 `/documents` 与 `?kind=` 过滤：无卡，行为不变。
4. 375 光暗零溢出、零 console 错误、基线字节还原、零逃逸。
