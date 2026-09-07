# R498 — 超长职位描述被静默截断：词边界收口 + 诚实截断提示

## 一手证据（生产，2026-08-31）

- Rezi changelog 2026-08 Week 4:"Improved Job Description Visibility: more reliable full job description" —— 职位描述完整可见是竞品当期迭代方向。
- 生产 API 实测:`/api/jobs/search`（默认与 engineer/designer/marketing/sales/product manager 五个查询）每批 15 条中均有 1 条 description 长度恰为 8000（= worker `JOBS_MAX_DESCRIPTION` 上限）。
- 截断样本(garden3d Head of Marketing & Communications)结尾为 `…experimental media bran`——**词中间硬切**,详情面板尾段就此戛然而止,无任何提示。
- 代码核对:`worker/index.ts` `htmlToText(...).slice(0, 8000)` 纯字符切;`Jobs.tsx` 直接渲染 `selected.description`,客户端无从得知被截断;同一 description 还喂给 matchScore/matchReport/tailoring(`jobDescription`),尾部关键词静默丢失。

## 问题定级

P2:用户在详情面板读到词中断裂的描述会认为是产品 bug;tailoring/匹配分对超长 JD 少读尾部内容且无披露,违反"诚实失败"产品姿态。

## 方案(最小)

1. `worker/index.ts`:
   - 截断改为词边界:超限时在 8000 内最后一个空白处切,避免词中硬切;
   - payload 每条 job 增加 `descriptionTruncated: boolean`;
   - KV 缓存键 `jobs:v4` → `jobs:v5`(payload 形状变更)。
2. `src/lib/jobs.ts`:`JobListing` 增加可选 `descriptionTruncated?: boolean`(旧 pipeline 存量条目无此字段,语义=未知,不显示提示)。
3. `src/pages/Jobs.tsx`:详情面板 description 之后,当 `selected.descriptionTruncated` 时渲染一行提示:"Description shortened — read the full posting on the original site"(链接 `selected.url`,复用既有外链样式)。

## 非目标

- 不提高/取消 8000 上限(KV 值体积与 tailoring 输入规模控制不变);
- 不改 tailoring/matchScore 算法;
- 不代理/抓取原站完整 JD。

## 验证

- 本地:tsc / eslint / build / verify-dist。
- 生产 QA:API 实测超长条目 `descriptionTruncated: true` 且结尾为完整词;详情面板出现提示行并外链正确;正常长度条目无提示;缓存键收敛后旧 v4 条目自然过期。
