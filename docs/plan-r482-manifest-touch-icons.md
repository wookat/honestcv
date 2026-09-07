# R482 — Web manifest + 家庭屏图标（apple-touch-icon / PNG icons）

## 一手证据（生产 + 竞品）
- `curl -w %{http_code} https://cv.zalize.com/manifest.webmanifest` → 404；`/apple-touch-icon.png` → 404。全站唯一图标是 `favicon.svg`。
- 后果：iOS「添加到主屏幕」拿不到 apple-touch-icon（Safari 不认 SVG favicon 作 touch icon），回退为页面截图缩略；Android Chrome 没有 manifest 完全无法以应用形态安装，收藏/主屏图标质量差。R481 刚补的 theme-color 只管铬件配色，安装面仍缺。
- 竞品：`rezi.ai` 首页 head 带 `rel="apple-touch-icon"`（一手 curl 实证）。
- 老板验收硬指标含「移动端适配与现代视觉」；manifest+icons 是现代移动 Web 基线（web.dev installability）。

## 方案（最小）
1. 从既有 `public/favicon.svg`（96×96 rounded-rect 品牌图）用本机 sharp 一次性栅格化生成并入库：
   - `public/icon-192.png`、`public/icon-512.png`（manifest 用）
   - `public/apple-touch-icon.png`（180×180，iOS 约定路径 + 显式 link）
2. `public/manifest.webmanifest`：name/short_name RezUp、start_url `/`、display `standalone`、theme_color `#fbfcfd`、background_color `#fbfcfd`、icons 192/512（purpose any）。
3. `index.html` 与 `scripts/build-seo.mjs` 的 11 处静态模板 head 加：
   - `<link rel="manifest" href="/manifest.webmanifest" />`
   - `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`
4. CSP 无需改（`default-src 'self'` 覆盖 manifest 与图标请求）。

## 非目标
- 不做 Service Worker / 离线（PWA 完整体验另一轮）；
- 不做 maskable 变体（favicon 自带白底圆角安全边距，先验证默认形态）。

## 验证
- 本地：tsc/eslint/build/verify-dist；dist 存在 manifest 与 3 个 PNG；PNG 尺寸正确。
- 生产 QA：/manifest.webmanifest 200 且 JSON 合法、图标 200 且 Content-Type 正确；4 类页面 raw HTML 含两条 link；CDP Page.getAppManifest / installability 无错误；375 光暗零回归、零 console 错误。
- 部署照旧如实记录：上传成功、Workers Routes auth code 10000。
