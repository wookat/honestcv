# R475 计划：生产包停止携带 react-router 的 development 构建

## 一手证据（生产实查，2026-08-31）

- Lighthouse /builder（移动模拟，R474 部署后）：perf 0.60、TBT 740ms、unused-javascript 第二名 = 入口 `index-Cy07OTKI.js`（118,571B 传输、46,940B 未用）。
- CDP `Profiler.takePreciseCoverage`（生产 /builder 冷加载）：入口 372,387B 源码中 210,004B 从未执行。
- 本地 `vite build --sourcemap`（同 commit，产物哈希与生产一致 index-Cy07OTKI.js）+ source-map-explorer：入口第二大模块 =
  `node_modules/react-router/dist/development/chunk-62JRHF6Z.mjs`（36,557B）——**development 构建**。
- `diff dist/development/chunk-62JRHF6Z.mjs dist/production/chunk-YBLPXYCV.mjs`：唯一差异
  `ENABLE_DEV_WARNINGS = true`（dev）vs `false`（prod）。生产环境正在运行带 dev 警告路径的 router。
- 根因是上游 bug：react-router ≥7.13 的 package.json `exports` 把所有条件（node/import/module/default）都指向
  `dist/development/*`（实查 7.18.2 与最新 7.18.3 均如此）；remix-run/react-router#14753 确认该问题，
  修复 PR #15059 已关闭未合并。任何 Vite 消费方默认都会把 development 构建打进生产包。

## 方案（最小修复）

`vite.config.ts` 改为 `defineConfig(({ command }) => ...)`，仅在 `command === 'build'` 时加精确别名：

```ts
{ find: /^react-router$/, replacement: 'react-router/dist/production/index.mjs' },
{ find: /^react-router\/dom$/, replacement: 'react-router/dist/production/dom-export.mjs' },
```

- `react-router-dom` 只是薄 re-export（`import ... from "react-router/dom"; export * from "react-router"`），
  别名同样作用于它内部的裸导入，无需单独别名。
- dev server（`vite`）不加别名，保留 development 警告——与上游 `development` 条件的本意一致。
- 仓库直接导入面：11× `react-router-dom`、1× `react-router`（entry-server StaticRouter），无其他子路径。

## 非目标

- 不升级/降级 react-router 版本，不 patch node_modules。
- 不改路由结构、不拆 Builder、不动 R472/R473/R474 的既有优化。

## 验证

1. 本地：`tsc -b`、eslint、`npm run build`、`node scripts/verify-dist.mjs`；
   `vite build --sourcemap` 复查入口 sourcemap 只含 `dist/production/*`，入口体积对比记录。
2. 构建产物 grep：入口不再含 dev 警告字符串（如 `ENABLE_DEV_WARNINGS` 分支特征）。
3. 部署 `npm run deploy`（完整链），路由抽查 200/404。
4. 生产 QA：SPA 全路由导航（Landing/Builder/Dashboard/Jobs/ATS/documents/samples）、深链与 404、
   浏览器前进后退、R474 预览测量回归、375 光暗、零 console 错误、基线字节还原。

## 诚实边界

- 收益主要是入口体积/执行量与去除 dev-only 警告路径；Lighthouse 模拟分数变化可能有限，按实测如实汇报。
