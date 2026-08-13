# HonestCV

一次性付费简历生成器（英文/海外市场）。反订阅陷阱是品牌主叙事：编辑器、模板、实时预览、
ATS 匹配分全部免费；$9.99 一次性解锁 PDF/DOCX 下载 + 不限次 AI 改写；$19.99 Career Bundle
追加 AI cover letter + 面试准备。免注册，简历数据存 localStorage。

线上域名（部署后）：https://cv.zalize.com

## 技术栈

- React 19 + TypeScript strict + Vite + Tailwind CSS v4 + shadcn/ui 风格组件
- Cloudflare Workers + Hono（静态资产 ASSETS binding，SPA fallback；KV 存 license / 免费额度 / 留资）
- 导出：`pdf-lib` 生成文本型 PDF（非截图），`docx` 生成真 Word 文档，均在浏览器端完成
- ATS 匹配分：纯前端计算（关键词匹配 + 结构检查），简历不出浏览器
- LLM：OpenAI 兼容中转（`LLM_RELAY_BASE_URL` / `LLM_RELAY_API_KEY` / `LLM_MODEL`），
  prompt 明确禁止编造雇主/时间/数据
- 支付：Lemon Squeezy overlay checkout + `/api/license/claim`（幂等）+ webhook 验签；
  `CHECKOUT_ENABLED=false` 时购买按钮降级为邮箱留资（存 KV `lead:*`）

## 本地开发

```bash
npm install
cp .dev.vars.example .dev.vars   # 填入本地 LLM 中转 / Lemon Squeezy 等（已 gitignore）
npm run dev                       # vite dev（含 Worker，@cloudflare/vite-plugin）
npm run lint
npm run build                     # tsc + vite build + scripts/build-seo.mjs
```

## 付费门禁（服务端强制）

- 免费：完整编辑器 + 4 套 ATS 模板 + 实时预览 + ATS 匹配分 + 5 次 AI 改写
  （按匿名 client id + KV 30 天记账）
- 付费（服务端校验 HMAC license token）：
  - `resume`（$9.99）：不限次 AI 改写；前端解锁 PDF/DOCX 下载
  - `bundle`（$19.99）：追加 `/api/ai/cover-letter`、`/api/ai/interview-brief`
- 购买流程：Lemon Squeezy overlay → `Checkout.Success` → `POST /api/license/claim`
  （webhook 记录或 LS API 校验 variant id → plan）→ 下发 `CV-XXXX-…` license key +
  签名 token；跨设备用 `POST /api/license/activate` 重新激活

## 部署

```bash
wrangler kv namespace create KV   # 替换 wrangler.jsonc 中的 REPLACE_KV_ID
wrangler secret put LLM_RELAY_BASE_URL / LLM_RELAY_API_KEY / LEMONSQUEEZY_API_KEY /
  LEMONSQUEEZY_WEBHOOK_SECRET / LS_STORE_ID / LS_VARIANT_RESUME_ID /
  LS_VARIANT_BUNDLE_ID / LICENSE_SIGNING_SECRET
npm run build && npx wrangler deploy
```

## SEO

`scripts/build-seo.mjs` 在构建时输出静态页：`/vs/zety`、`/vs/livecareer`、
`/resume-builder-one-time-payment`、`/free-ats-resume-checker`，以及 sitemap.xml / robots.txt。
