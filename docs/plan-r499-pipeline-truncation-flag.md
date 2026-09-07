# R499 — 保存/跟踪职位后诚实截断提示丢失（sanitizeEntry 丢弃 descriptionTruncated）

## 调查（一手证据，2026-08-31）

- Rezi changelog 2026-08：“Improved Job Description Visibility: More reliable full job
  description viewing for tracked roles.” —— 明确指向 tracked roles 的描述可见性。
- 生产 API `GET /api/jobs/search?q=engineer`：job 2091068 返回
  `descriptionTruncated: true`（7995 字符，R498 上线正确）。
- 生产 CDP 实测（audit-r1/r499c.py）：
  1. 打开 `/jobs?q=engineer&job=2091068`，详情面板显示 R498 截断提示（note: true）。
  2. 点击详情面板 Save 保存该职位。
  3. 立刻读 `localStorage['honestcv.jobPipeline']`：该条目 `descriptionTruncated`
     **MISSING**（len 仍 7995）。
  4. 刷新后从 Saved 标签打开该职位详情：截断提示消失（note: false）。
- 根因：`src/lib/jobs.ts` `sanitizeEntry()` 重建存储条目时只复制 `logo`/`tags`
  等可选字段，未复制 `descriptionTruncated`。保存流程
  `upsertPipeline(job,'saved')` → `prepareTargetedCopy` → `setPipelineVersion()`
  会立即经 `listPipeline()`（逐条 sanitizeEntry）重写整个 pipeline，标志当场被剥掉；
  之后任何 pipeline 写路径同样剥掉。

## 影响

被保存/跟踪的截断职位在刷新或任何 pipeline 写操作后失去诚实截断披露；用户在
tracked 详情里看到的不完整描述被当成全文（并继续喂裁剪/匹配），与 R498 的
诚实披露目标相悖，也正是 Rezi “tracked roles” 措辞针对的场景。

## 方案（最小修复）

`sanitizeEntry()` 增加一行：

```ts
if (j.descriptionTruncated === true) job.descriptionTruncated = true
```

仅在存储值严格为 `true` 时保留（旧条目无此键 → 维持 undefined，兼容不变）。

## 非目标

- 不改 worker、不改 Jobs.tsx UI（R498 披露组件已按 `selected.descriptionTruncated` 渲染）。
- 不迁移/回填旧 pipeline 条目（无法可靠推断历史截断，如实保持 undefined）。
- 不动 8000 上限、匹配/裁剪算法。

## 验证

- 本地：`npx tsc -b --noEmit`、针对性 eslint、`npm run build`、`npm run verify-dist`。
- 生产 QA：保存 2091068 → localStorage 标志为 true → 刷新后 tracked 详情仍显示
  截断提示与原帖外链；普通职位保存后无提示；QA 后清理 pipeline。
