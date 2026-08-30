# R17 设计方案：Job Search MVP（方案 B，免 key）

依据：docs/research-r16-job-search-architecture.md（一手实测 Rezi job-search，截图 ~/audit-r1/shots-r16/）。按 CHARTER「提议即默认方案」推进免 key MVP；Adzuna/Jooble key 到位后仅需在 Worker 侧增加数据源。

## 架构（不破 local-first，无新依赖）
1. Worker `GET /api/jobs/search?q=`：代理 Remotive 公共 API（remotive.com/api/remote-jobs?search=&limit=50，2026-08-29 实测可用），KV 缓存 1h（key `jobs:v1:<q>`）控上游频率；服务端剥离 description HTML 为纯文本（截断 8k 字符）后回传精简字段（id/title/company/location/type/date/salary/url/description）。
2. `src/lib/jobs.ts`：`searchJobs(q)` fetch 封装 + 申请管线存 localStorage `honestcv.jobPipeline`（{job, status: saved|applied|interviewing|rejected, updatedAt}），提供 list/upsert/remove。
3. `src/pages/Jobs.tsx` 新路由 `/jobs`（对标 Rezi 双栏职位板）：
   - 顶部状态标签 All / Saved / Applied / Interviewing / Rejected（带计数）；
   - 搜索框（默认加载空搜索=最新职位）；来源如实标注「Remote jobs via Remotive」，不夸大覆盖；
   - 左列表（title/company/location/date）+ 右详情（描述全文、salary/type）；移动端单栏列表→详情切换；
   - 详情操作：Save、状态切换、Apply（外链 job.url，rel=noopener）、**Target my resume**：把职位 title/描述写入当前草稿 targetRole/jobDescription（覆盖前确认）→ 跳 /builder 打通既有 tailoring/ATS 全链路；
   - 管线职位持久保存（含 JD 文本），上游下架后仍可用。
4. 接线：App.tsx 路由 + React header 导航加 Jobs（桌面+移动菜单）+ worker SPA_ROUTES 加 '/jobs'。

## 边界
- 不做账号/云端同步；不做多源聚合（key 到位后续批）；不抓取企业 career pages；不伪造匹配度分数（BEST MATCH 排序不做，按发布时间）。

## 验证
本地 lint/tsc/build 全绿 → PR（基于 R16 分支）→ 部署 → 生产复验：搜索/详情/管线状态/Target 打通/外链、移动 375px 单栏、console clean、/jobs 路由 200。
