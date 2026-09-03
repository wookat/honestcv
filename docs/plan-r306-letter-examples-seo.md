# R306 — 公开 Cover / Resignation Letter Examples 页面（SEO 面）

## 一手证据（Rezi 公开面）
- Rezi 全站页脚/一级导航 Resources 列常驻两个公开获客面：**Cover Letter Examples** 与 **Resignation Letter Examples**（如 ai-skills-explorer 等任意 docs 页页脚均可见），每个示例页提供完整信件正文 + Customize/Download 起步动作。
- 我方 R305 已把 8 封示例信内置进 `/documents`（登录后应用面），但**公开静态面完全没有**：`scripts/build-seo.mjs` 已有 /examples/（30 份简历示例）、/guides/、/templates/、/cover-letter-generator/ 等 SEO 页，唯独没有信件示例页 —— 搜「cover letter example software engineer」等长尾词的访客落不到我们站上。

## 差距
公开面缺 letter examples 获客页；应用内已有的 8 封示例数据无法被爬虫看到。

## 方案（最小实现，零 worker/schema 改动）
1. 单一数据源：`src/lib/letterExamples.ts` 的 8 封信迁到 `src/lib/letterExamples.data.json`（tsconfig 开 `resolveJsonModule`），TS 模块保持原导出接口（app 行为字节不变）；`build-seo.mjs` 直接 `readFileSync` 同一 JSON。
2. `build-seo.mjs` 新增两个静态页：
   - `/cover-letter-examples/`：6 封完整正文（pre-wrap 信纸卡片）+ 每封「Customize this letter」CTA → `/documents`；交叉链接 generator 与 resignation 页。
   - `/resignation-letter-examples/`：2 封同构。
   - 均含 canonical/OG/BreadcrumbList JSON-LD，加入 sitemap.xml、页脚 Resources 列与 header Resources 下拉。
3. 不新增 SPA 路由（静态资产优先于 SPA fallback，与既有 SEO 页同机制）。

## 验收
- 本地 tsc/lint/build 绿；dist 产出两页且正文与 JSON 字节一致。
- 生产直载两 URL 200、正文完整、CTA 链接可达 /documents；sitemap 含两 URL。
- `/documents` 8 chips 行为回归不变（数据源迁移不改渲染）。
