# R16 调研与架构论证：Job Search（决策文档，不含实现）

状态：待决策（重大方向，按 CHARTER 需老板/跨角色评审后才实施；本文档只做一手调研与方案论证）。

## 一手证据（2026-08-29 登录实测 app.rezi.ai/dashboard/job-search，截图 ~/audit-r1/shots-r16/）
- 双栏职位板：左侧职位列表（搜索框 job title + location + FILTER，排序 BEST MATCH），右侧职位详情（About the Role/Responsibilities 全文）。
- 申请管线标签：ALL JOBS / SAVED (0) / MATCHED (0) / APPLIED (0) / INTERVIEWING (0) / REJECTED (0)；每个职位卡有 Add to Saved / Change status。
- 详情页操作：APPLY NOW（跳转外部）+ TARGET RESUME（与简历编辑器打通——把 JD 喂给 tailoring）。
- 营销口径：「+2M jobs sourced from career pages」（Rezi 自建抓取管线，来自企业 career pages）。
- 免费账号即可用（数据是获客钩子，变现在 tailoring/订阅）。

## RezUp 现状
- 无任何职位发现功能；JD 只能手动粘贴到 Target job。
- 架构 local-first：无账号、无用户数据库；Worker + KV 只存 license/quota/leads。
- 已有可复用资产：JD 解析 + ATS 评分 + Tailor/关键词 AI 全链路（职位详情 → 一键填入 targetRole/jobDescription 即可打通）。

## 可选方案
### A. 现阶段不做
成本为零，聚焦简历核心与变现。但 Job Search 是 Rezi 免费获客钩子与「操作台完整性」的最大剩余差距。

### B. 轻量集成成熟职位 API（推荐论证对象）
- 数据源候选（现成托管服务，符合技术选型原则，不自建爬虫）：Adzuna API（有免费层，配额以 developer.adzuna.com 为准，多国）、Jooble API（免费申请）、JSearch/RapidAPI（聚合 Google for Jobs）、USAJobs（美国联邦岗位，免费）、Remotive（remote 岗位，免 key JSON，2026-08-29 实测 remotive.com/api/remote-jobs 可用；条款注明用于开发用途，正式集成前需核对展示要求）。
- 架构：Worker `GET /api/jobs/search?q=&loc=` 代理外部 API + KV 缓存（1h TTL，控配额）；前端 dashboard 加 Jobs 视图（双栏列表+详情）；「Target this job」一键把 JD 填入 builder 打通既有 tailoring；Saved/Applied/Interviewing/Rejected 管线状态存 localStorage（`honestcv.jobPipeline`）——不引入账号/云端用户数据，local-first 不破。
- 资源缺口（立项时一次性申报）：外部 API key（Adzuna/Jooble 免费注册，需老板或授权注册的邮箱）；到位前可用 Remotive 免 key 源先做 remote 岗位 MVP。
- 风险：外部源覆盖/质量不及 Rezi 自建 +2M（如实标注来源，不夸大）；免费配额限制（KV 缓存 + 防抖缓解）；API 条款需逐个核对允许展示+外链申请。
- 工作量：1–2 个短周期（Worker 代理+缓存 1 批；前端双栏+管线+Target 打通 1 批）。

### C. 自建 career-pages 抓取（Rezi 同级）
需要爬虫集群、去重/刷新管线、独立存储（D1/R2）与持续运营；company-os 备注 jobs 后端生产机仅 2GB 内存/磁盘 ~81%。成本与运营负担远超当前阶段收益，不建议。

## 建议
按 B 立项（先 Remotive 免 key MVP → 决策后补 Adzuna/Jooble key 扩覆盖），C 否决，A 作为默认兜底。属重大功能方向：待老板/跨角色评审确认后进入实现循环；确认前继续其他小批差距收敛。
