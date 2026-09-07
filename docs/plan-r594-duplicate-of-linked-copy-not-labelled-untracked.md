# R594 — 复制已链接副本后，副本不得被标成「job no longer tracked」（2026-09-06）

## 一手证据（生产 index-3R7pVACX.js 含 R593，真实职位 1185979，零 AI，qa/r594-evidence.cjs）
在 /dashboard 对已链接副本「Freelance Writer — IAPWE」点 Duplicate：
```
["Freelance Writer — IAPWE (2)","… · targeted at Freelance Writer at IAPWE · job no longer tracked — find it again",["/jobs?q=Freelance%20Writer"]]
["Freelance Writer — IAPWE","… · Open in the editor · for Freelance Writer at IAPWE",["/jobs?job=1185979"]]
```
副本 (2) 无 pipeline 链接但其目标职位仍在跟踪（由原副本链接）。R593 的注记「job no longer tracked」在此为假陈述，且「find it again」把用户引到搜索而非该已跟踪职位。

## 方案
- `src/lib/jobs.ts` 新增共享判定 `copyTargetsJob(data: Pick<Resume,'targetRole'|'targetCompany'|'jobDescription'>, job: JobListing)`：公司名一致 &&（职位名一致 || 非空 JD 逐字一致）——即 R592 `orphanTargetedCopy` 的匹配规则，Jobs.tsx 改为复用。
- `Dashboard.tsx` `targetNote(v)` 无链接分支：先在 pipeline 中找 `copyTargetsJob(v.data, e.job)` 的条目：
  - 找到 → `· targeted at role at company · <Link /jobs?job=id>tracked job uses another copy</Link>`；
  - 未找到且 JD 非空 → 保持 R593「job no longer tracked — find it again」；
  - 其余 → 仅「targeted at …」。

## 验证
- tsc/eslint(Jobs.tsx, Dashboard.tsx, lib/jobs.ts)/build/verify-dist。
- 生产 1280+375：Duplicate 后 (2) 行显示「tracked job uses another copy」→ /jobs?job=1185979；原副本行不变；R593 孤儿场景（qa/r593-evidence.cjs）仍显示「job no longer tracked — find it again」；R592 editedrole 重连不回归；375 无页面溢出；存储回基线；零 console 错误。
