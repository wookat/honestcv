# R497 方案：让示例库 JSON 参与离线缓存（SWR）

## 一手证据
- `public/sw.js` fetch 路由逐条核对：导航 network-first、`/assets/*` cache-first、`STATIC_PATH = /\.(?:woff2|png|svg|webmanifest)$/` SWR、`/api/*` 与 `/s/*` 不拦截——`/examples/examples.json` 不落任何分支，纯网络。
- 生产 CDP 离线验证（见 QA 记录）：SW 受控下离线打开 /samples，shell 正常渲染（R486），但样本列表走网络失败，显示 R415 重试错误卡——对已访问过的用户，这是一份构建期生成、仅随部署变化的静态内容，离线拿不到属能力缺口而非诚实失败。
- R496 刚把该 JSON 提前到 HTML preload，四路由（/builder、/dashboard、/documents、/samples）挂载即依赖它；PWA（R482–R486）定位为可离线应用，示例库是唯一被排除在离线之外的一等静态内容。

## 方案
`public/sw.js` 最小改动：fetch 分派中为 `/examples/` 下的 `.json` 走既有 `staleWhileRevalidate()`（STATIC_CACHE，同 woff2/png/svg/webmanifest）：
- 在线：命中即回缓存，后台刷新（部署后下一次访问收敛到新内容，与字体/图标一致的时效语义）。
- 离线已访问：直接回缓存，/samples 出 9 卡、Builder 示例选择器可用。
- 离线未访问：照旧 fetch 失败 → R415/R416 既有诚实错误路径不变。

## 非目标
- 不动 fetch effect、重试卡、R496 preload、页面/资产缓存策略。
- 不预缓存（保持 runtime-only 原则）；不缓存 /api/*、/s/*。

## 验证
- tsc/eslint/build/verify-dist。
- 生产 CDP：在线访问 /samples 后置 offline 重载 → 9 卡照常、零 console 错误；未访问过（清缓存）离线 → 重试错误卡照旧；恢复在线走网络+后台刷新；R486/R487 回归。
