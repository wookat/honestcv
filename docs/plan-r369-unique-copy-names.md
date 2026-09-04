# R369 — 保存副本自动去重命名（"Untitled copy" 不再无限重名）

## 一手证据（2026-08-31，生产 index-DRybDTYD.js，独立 QA 实测）
- /dashboard「Save as copy」在草稿无 targetRole 也无姓名时立刻创建名为 "Untitled copy" 的副本——无命名提示、无对话框；再点一次得到第二个同名 "Untitled copy"，仅时间戳可区分（截图 r369_untitled_copy.png）。
- Builder Copies 对话框有命名输入框，但留空同样落 "Untitled copy"，可与 dashboard 路径产生两个不可区分的同名条目（截图 r369_builder_copies_nameinput.png）。
- 「Save draft as copy, then open」确认按钮（Dashboard 两处）同一 fallback。
- 对照：career documents 自 R365 起复制即有编号命名（"base (n)" 取最小空闲）；副本 duplicate 自 R358 起同规。Rezi 每份简历必有独立名称，不出现批量同名。

## 定级
P3（真实易踩的纸割：多份 "Untitled copy"/同名 targeted copy 无法区分，重命名/删除/批量操作全都靠时间戳猜）。同轮候选中 promo 弹窗（一次性、标准模态）降为 informational 放弃；导入后 target 区块实为展开只是低于首屏，留作候选。

## 方案（最小闭环）
resume.ts：新增 uniqueName 检查——saveResumeVersion 与 createResumeVersion 在持久化前若名称与现有副本重名，则复用 R358 duplicateName 编号规则取最小空闲 "base (n)"（n≥2）：
```ts
const taken = new Set(existing.map((v) => v.name))
if (taken.has(name)) name = duplicateName(name, taken)
```
- 不重名时字节不变（含用户自己输入的任何名称）。
- 覆盖全部新建路径：Builder Copies 保存（含留空 fallback）、Dashboard Save as copy / Save draft as copy then open / import as new copy、Jobs targeted copies（同职位二次 target 得 "Title — Company (2)"）。
- rename/updateResumeVersion 有意不动：改名是用户显式行为，允许重名。
- duplicateName 剥一层尾部 " (copy)"/" (n)" 后编号，与 R358/R365 完全一致。

## 验证
- oracle .tmp-smoke/r369_oracle.ts：不重名原样、重名得 (2)/(3)、gap-fill、"name (2)" 冲突续号、createResumeVersion 同规、rename 不受影响。
- 本地 tsc/eslint/build；部署后独立生产 QA（mock 全部敏感请求、基线还原）。
