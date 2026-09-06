# R619 — 把副本链接到另一职位时，forJob 仍停留在它被复制自的职位

## 生产实证（index-BHDQBYdG.js，qa/r619-evidence.cjs 1280）
副本 A 被职位 J（SRE @ Globex）链接；Duplicate 得到 B（继承 `forJob=J`）；在 Resume settings 把 B 改指
K（Platform Engineer @ Initech，已跟踪、无副本）。R618 后 K 的职位卡正确地说「Reconnect targeted copy」。
用户点它 → `setPipelineVersion(K, B)` → K.resumeVersionId = B，**但 B.forJob 仍是 J**：

| 步骤 | 生产实际 |
|---|---|
| Reconnect 前 | B.forJob = J，target = Platform Engineer @ Initech |
| Reconnect 后 | K → B 已链接；B.forJob **= J**（未变） |
| 随后取消跟踪 K | dashboard B 行「targeted at Platform Engineer at Initech · **no tracked job — find it on the jobs board**」，链接 `/jobs?q=Platform%20Engineer`（标题搜索） |

应当：用户亲手把 B 连到 K，B 的职位就是 K；K 取消跟踪后应说「that job is no longer tracked — open it to save it
again →」并按 id 精确回链 `/jobs?q=…&job=qa-j2`（R613/R614 的全部价值所在）。此外 R618 的「同公司内改 role/JD
仍保留来源」宽限也只对真实的 forJob 成立——forJob 是 J（Globex）时，B 在 Initech 内任何改动都会被判成「无来源」。

## 原因
`setPipelineVersion` → `rememberVersionJobs`，而后者是 R614 的**补录**语义：`if (v.forJob) return v`，只给从未
记录职位的旧副本盖章。R615 让它在链接那一刻运行，但对「已有别的 forJob」的副本（Duplicate 继承的）无效。

## 方案
- `lib/resume.ts` 新增 `setVersionJob(id, forJob)`：把该副本的 forJob 写成所链职位（缺失或 id 不同才写；同 id 不写）。
- `lib/jobs.ts` `setPipelineVersion` 改调 `setVersionJob`（链接是用户显式动作，记录它不是静默改链）。
- `rememberLinkedCopyJobs` / `rememberVersionJobs`（页面加载时的补录）**保持只补缺失**：加载时不猜、不改写。
- `duplicateResumeVersion` 继续继承 forJob（R618 已让失效来源不再主导匹配；真实重复仍能凭它重连 R594/R604）。
- forJob 只在链接动作时更新；Resume settings 改目标字段（R616）不动 forJob。

## 验收（生产 1280 + 375）
- Reconnect B → K 后 B.forJob = K（id/title/company）。
- 再取消跟踪 K：dashboard B 行「that job is no longer tracked — open it to save it again →」，链接含 `&job=qa-j2`；
  builder Target job 同源文案。
- 对照：链接一个 forJob 已是该职位的副本（如 R618 control 的 J ← B），forJob 不变、存储不额外写入。
- 无页面级溢出、零 console 错误、零 AI 调用、存储回基线。
