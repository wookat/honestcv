# R592 — 孤儿目标副本匹配放宽：同公司 + （同职位名 或 同职位描述）（2026-09-06）

## 一手证据（生产 index-D7KLdISK.js 含 R591，真实职位 2091088，零 AI）
编辑器允许用户自由修改副本的 Target role 文本。种入孤儿副本 qa-v1：targetRole=「Sales Jedi (SaaS, EU)」（用户微调过）、targetCompany=Creative Force、jobDescription=该职位原文；再对同一职位点 Saved：
```
versions: [["46r4mkzg","Sales Jedi — Creative Force (2)","Draft resume with content for QA"], ["qa-v1",…,"Tailored for this job"]]
pipeline: [["2091088","saved","46r4mkzg"]]
```
R589 的精确「职位名+公司名」匹配失败，退回 R589 之前的行为：从通用草稿再造「(2)」，定制副本继续孤儿。

## 方案（仅 src/pages/Jobs.tsx，`orphanTargetedCopy`）
```ts
-  v.data.targetRole.trim() === job.title.trim() && company matches
+  company matches && (v.data.targetRole.trim() === job.title.trim() ||
+    (v.data.jobDescription.trim() !== '' && v.data.jobDescription.trim() === job.description.trim()))
```
- 仍要求公司名精确一致、且未被任何 pipeline 条目链接；JD 需非空且逐字相等（JD 由「Target my resume/Saved」写入，用户极少改动）。
- 同公司同 JD 的重复发布（不同 job id）也会重连，符合「同一份定制成果服务同一岗位」的语义。
- 不改任何文案（R589/R590 弹窗已描述「reconnects」）。

## 验证
- tsc/eslint(Jobs.tsx)/build/verify-dist。
- 生产 1280+375：editedrole 场景 → 不再新建「(2)」、pipeline 重指 qa-v1；match/control 场景结果同 R589（重连 / 仍新建）；存储回基线、零 console 错误。
