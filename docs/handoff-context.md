# 交接上下文（Handoff Context）

> 按 company-os/templates/handoff-context.md 维护，每次里程碑后更新。

## 项目目标
RezUp——面向海外求职者的英文简历产品（ATS 友好、诚实简历理念），属「Zalize」求职校招线，保留海外独立品牌（part of Zalize 背书）。当前阶段：上线运营（FREE_MODE 开启，付费待 Lemon Squeezy 全配置）。

## 代码与数据位置
- 仓库：`https://github.com/wookat/honestcv`（默认分支 `main`）
- 本地路径：`/home/ubuntu/repos/honestcv`
- 关键子目录：`src/`（React 19 SPA）、`worker/index.ts`（Hono Worker：API+资产+安全头+IndexNow cron）、`scripts/`（prerender/build-seo）、`docs/`（调研/验收/测试计划）
- 数据存储：Cloudflare KV（binding `KV`，namespace HONESTCV_KV）——licenses / free quotas / leads

## 技术栈
React 19 + Vite + Tailwind + Radix / Hono on Cloudflare Workers（assets run_worker_first）/ KV / 每周一 IndexNow cron / docx+pdf-lib 导出

## 当前实时服务状态
- 线上地址：https://cv.zalize.com（wrangler custom_domain 路由）
- 部署：`npm run deploy`（= tsc -b + vite build + prerender + build-seo + wrangler deploy）
- 本地验证：`npm run lint`、`npm run build`

## 当前数据概况
- KV 存 license/免费额度/邮件 leads；无关系型数据库
- 已消费简历中心 ResumeProfile v1（/share/ 链接导入，PR #199/#200；注意 CSP connect-src 需包含简历中心 API 域）

## Rezi 对标循环（2026-08-29 起，R1–R10 已完成）
- 一手审计：docs/audit-2026-08-29-rezi-r1.md（R8 复审计截图 ~/audit-r1/shots-r8/）；各轮方案 docs/plan-r1..r10-*.md
- R1 评分深度+AI keyword bullet（PR #214）、R2 落地页 showcase+导航（#215）、R3 逐行 AI 修复（#216）、R4 多页实时预览（#217）、R5 简历操作台 /dashboard（#218，含 SPA_ROUTES 补 /dashboard 修 404）、R6 可保存 cover letter/interview 文档进 dashboard（#219）、R7 Auto-fit 一键排版（#220，真实 PDF 计页选最可读组合）、R8 dashboard 内 Sample library（#221，搜索+行业筛选，复用 examples.json）、R9 移动端汉堡导航（#222，React header + 静态页零 JS details 菜单）、R10 LinkedIn「Save to PDF」档案导入（#223，extractPdf 双栏检测+LinkedIn 专用解析：公司在前/时长括注/多角色公司/侧栏 Contact·Top Skills）
- PR 为累积链（R2 基于 R1 分支…R10 基于 R9），生产已部署最新版（worker 754aca7b）；PR 均未合并，合并时按链顺序
- 剩余候选差距（R8 复审计确认）：Rezi Job Search（+2M 职位+申请管线，重后端，架构差异待决策）、付费人工 Review（商业模式差异）、导航下拉信息架构（P2-9）、落地页信任背书继续加深（P1-8 残余）
- QA 备注（P2，非本轮引入）：React 页 console 偶发 [Report Only] CSP 违规日志（疑似平台注入，无拦截）；/builder 偶发 GET /api/za/session 401 console 报错（未登录时的会话探测，建议静默处理），待查
- R7 QA 备注（可选优化，非 P0/P1）：Auto-fit 在已最优页数时仍会把设置升到更可读组合；表单控件 id/name 信息性提示已在 dashboard 修复、builder 其余字段未处理
- 生产复验标准：1440+375 双视口、无横向溢出、触摸目标≥40px、console clean、文档路由 200

## 进行中/待办任务（按优先级）
1. 付费通道：Lemon Squeezy 配置完成后关 FREE_MODE，回归 checkout 全流程
2. 品牌：遵循 @zalize/brand 版本化包（治理批次 GV-2）
3. 「上岸承诺」条使用英文版且不承诺 free（有付费下载路径）——见 PR #201

## 已知坑与注意事项
- wrangler.jsonc `run_worker_first: true`：所有静态资产也走 Worker（安全/缓存头统一），改 Worker 需回归静态资源
- CSP 在 worker 下发，新增外部 API 域必须同步 connect-src（曾拦截简历中心导入，#200 修复）
- 预渲染在 build 内（scripts/prerender.mjs），SEO 页由 build-seo.mjs 生成，跳过会丢 SEO
- AI 功能走 LLM relay，欠费/不可用时诚实降级，不得伪造 AI 输出

## 资源与凭证索引
- wrangler secrets（名称）：LLM_RELAY_BASE_URL / LLM_RELAY_API_KEY / LEMONSQUEEZY_API_KEY / LEMONSQUEEZY_WEBHOOK_SECRET / LS_STORE_ID / LS_VARIANT_*_ID / LICENSE_SIGNING_SECRET
- vars：LLM_MODEL=glm-5.2、CHECKOUT_ENABLED、FREE_MODE
- Cloudflare 账号：wookat520（Workers 部署）

## Zalize 统一账号接入（UA 项目收口 2026-08-27）

- UA-P2 一键导入主简历（PR #210 已合并）：Worker /api/za/session|primary 服务端代理中心会话与 resume 主简历出口（no-store，不暴露中心凭证）；Builder 导入弹窗登录态显示「导入我的主简历」。简历数据仍只存 localStorage，不做云备份；shareId/文件/文本旧导入路径不变。
- 中心站 account.zalize.com（get-session / token / jwks，Cookie Domain=.zalize.com）；30 天双轨到期日 2026-09-26（到期前旧登录/旧 token 持续有效）；总方案与全阶段 PR 索引见 company-os projects/unified-account/plan.md。
