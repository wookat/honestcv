# R481 — 浏览器 UI 主题色（theme-color meta）随站点主题

## 一手证据（生产）
- `curl -s https://cv.zalize.com/ | grep -io '<meta name="theme-color'` → 无匹配：全站（SPA shell 与 ~120 静态页共用同一 head 模板）没有任何 `theme-color` meta，也没有 web manifest。
- 后果：移动端浏览器（Android Chrome 地址栏/工具栏、iOS Safari 15+ 顶栏）对本站一律回退默认白色。暗色主题下（R187 三态主题 + R451 pre-paint 已在首绘前把 `html.dark` 置好、页面近黑 `oklch(0.16 0.015 260)`），浏览器铬件仍是白色——移动端暗色体验的可见断层。老板验收硬指标明确包含"移动端适配与现代视觉"。
- 本轮审计其余线索均驳回/无法落地：
  - Lighthouse /jobs（移动模拟）perf 0.75，LCP 元素为静态引导段、render delay 589ms，主导成本是入口块执行，R478 已证入口到地板；
  - Lighthouse inspector-issues 报的 CSP 问题在真实浏览器 CDP `Audits.enable` 全程零 `ContentSecurityPolicyIssue`（新 context 实测 `[]`），判定为 Lighthouse 运行环境产物，非站点缺陷；
  - image/cache insight 指向 remotive.com 第三方 logo 的体积与缓存头，非我方可控（引代理服务超出一轮范围）；
  - Rezi 首页 head 同样无 theme-color，不构成反例，但 theme-color 是现代移动 Web 的标准做法（MDN/web.dev 基线）。

## 方案（最小）
1. `index.html`（SPA shell 与全部静态预渲染页共用模板）加一对带 media 的静态 meta，覆盖 JS 前首绘的系统偏好：
   - `<meta name="theme-color" media="(prefers-color-scheme: light)" content="#fbfcfd" />`
   - `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#090d14" />`
   - 颜色 = `--background` 两个 oklch token 的精确 sRGB 换算（#fbfcfd / #090d14，oklab 正变换手算校验）。meta 用 hex 保证 Safari 兼容。
2. `src/lib/theme.ts` `applyThemePref()`：切换 `html.dark` 后把两个 theme-color meta 的 content 一并改为当前生效色——覆盖用户显式 light/dark 选择与 OS 偏好不一致的情形（Chrome 取第一个 media 匹配的 meta，两个都改写就无歧义）。
3. `scripts/build-seo.mjs` 的 ~120 静态 SEO 页 head 模板（11 处）加同一对 meta——实施中发现静态页不共用 `index.html`，必须单独加。
4. pre-paint 内联脚本（`index.html` + `build-seo.mjs` `THEME_INLINE` 双份 + worker CSP hash 三处，由既有 drift guard 保一致）扩展：读到显式 `honestcv.theme`（light/dark）时首绘前就把两个 meta 改写为生效色——否则静态页（无 theme.ts）上显式偏好与 OS 相反时铬件颜色错。脚本改动 = 新 sha256（`N/UQmAIyFzhi3Hmx8pQOPRHy6bKhEKOZ7DC6QVyuIpc=`）同步进 `worker/index.ts` CSP，build-seo 的 drift guard 构建期校验。

## 非目标
- 不加 web manifest / PWA（另一整轮的范围）；
- （修订）原计划不动 pre-paint 脚本；实施中因静态页需要显式偏好覆盖而扩展了它，CSP hash 随之同步更新并有构建期 drift guard 兜底；
- 不代理 remotive 第三方 logo。

## 验证
- 本地（已过）：`npx tsc -b`、`npx eslint src/lib/theme.ts scripts/build-seo.mjs worker/index.ts`、`npm run build`、`node scripts/verify-dist.mjs`；dist 抽查 index.html/spa.html/about/guides 各含 3 个 theme-color（2 meta + 脚本内引用），dist 内联脚本 sha256 与 worker CSP 严格相等。
- 生产 QA：raw HTML 含两个 meta（SPA shell + 任一静态页）；CDP 实测 light/system/dark 三态下 meta content 与 `html.dark` 一致，主题切换按钮实点后 meta 跟随；375 光暗零回归。
- 部署照旧如实记录：资产上传成功、Workers Routes API auth code 10000。
