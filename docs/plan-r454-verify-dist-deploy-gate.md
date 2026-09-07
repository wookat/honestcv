# R454 — 修复生产静态页全 404 事故 + 部署完整性门禁

## 一手实证（2026-09-05，生产 curl）

R453 QA 银行项 `/examples/examples.json` 404 追查升级为生产事故：

- `https://cv.zalize.com/pricing/` → 404（返回 SPA 404 shell）
- `https://cv.zalize.com/examples/`、`/examples/accountant/`、`/templates/`、`/guides/` → 全部 404
- 即 R453 部署（2026-08-31）后，全部 ~120 个静态预渲染页 + examples.json 从生产 asset manifest 消失，仅 SPA shell 与 assets/ 在线。

根因（推断，与证据一致）：`vite build` 会清空 dist/client；R453 部署时 dist/client 只含 vite 产物
（prerender.mjs / build-seo.mjs 未生效即执行了 `npx wrangler deploy`），wrangler 按 dist 现状
整体替换 asset manifest（当时日志 "Uploaded 47 files" 即部分集）。

## 已完成的恢复（同日）

`npm run build && npx wrangler deploy`（299 files）→ 全部路由复验：静态页 200、
examples.json 200、/nope-xyz 404。事故复盘已记入 docs/handoff-context.md。

## 修复（窄）

1. 新增 `scripts/verify-dist.mjs`：sitemap 驱动的部署前门禁——
   - `index.html` / `spa.html` / `sitemap.xml` / `examples/examples.json` 必须存在；
   - sitemap `<loc>` 数 ≥100（部分构建即拒绝）；
   - 每个非 SPA 路由的 sitemap URL 必须有对应 `index.html`。
2. `package.json`：`deploy` 改为 `npm run build && node scripts/verify-dist.mjs && wrangler deploy`；
   另加 `verify-dist` 独立脚本。

已验证 wrangler.jsonc `build.command` 钩子在本仓库不可行：Cloudflare vite 插件生成的
redirected config（dist/honestcv/wrangler.json）会剥掉 `build` 键，wrangler deploy 不执行它
（负例实测：缺 examples.json 时 `wrangler deploy --dry-run` 照常通过）。故门禁放在 npm 脚本，
并立规：部署只走 `npm run deploy`，禁止直接 `wrangler deploy`。

## 验收

- 负例：vite-only dist 上 `node scripts/verify-dist.mjs` 退出码 1（实测 "missing spa.html"）。
- 正例：完整 `npm run build` 后退出码 0（"123 sitemap URLs"）。
- tsc/eslint/build 绿；`npm run deploy` 全链成功（route auth code 10000 照旧如实上报）。
- 生产 QA：静态页/SPA/404/examples.json 全回归。

## 不做

- 不改 worker 路由、不改 build 步骤顺序、不动 .assetsignore、不弱化任何权限。
