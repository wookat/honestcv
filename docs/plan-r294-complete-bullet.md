# R294 — Complete a half-written bullet with AI（对标 Rezi「Complete Bullet」）

## 一手证据（Rezi 公开面）
- Rezi 博客 how-to-use-the-rezi-resume-builder / AI Bullet Points 文档：经验编辑器提供
  **Complete Bullet** —— 用户写了半句 bullet，AI 把它补完成一条完整 bullet（区别于
  Rewrite / 从零 Suggest / Quantify）。
- Rezi real-time-content-analysis：写作过程中的即时可操作反馈。

## 我方现状（缺口）
- 已有：Suggest a bullet（从零草一条，R206/R284）、…with key numbers、整条 rewrite
  （R282/R283）、逐行 Fix line N（lint 触发的改写）、keyword bullet。
- 没有任何「补完我写到一半的 bullet」路径：半句 bullet 只能被 lint 报「too short /
  no punctuation」，Fix line 是**改写**（丢用户措辞倾向），Suggest 是**另起**一条。

## 方案（窄切片）
1. `worker/prompts.ts` `buildSuggestBulletMessages` 尾部新增可选 `draft = ''`：
   非空时 draftLine 换成「Complete the user's partially written bullet into exactly ONE
   finished bullet. Keep the user's words, facts and intent — extend and polish, do not
   replace…」，user 消息在 existing bullets 前加
   `Partially written bullet to complete: "<draft>"`；`draft` 为空时提示词**字节级不变**
   （oracle 验证）。key-numbers/占位/grounding 规则不变；existing bullets 由调用方剔除
   draft 行本身。
2. `worker/index.ts` `/api/ai/suggest-bullet`：白名单解析 `body.draft`（string、trim、
   cap 300），透传。配额/entitlement 逻辑不动。
3. `src/lib/api.ts` `aiSuggestBullet` 新可选 `draft`。
4. `Builder.tsx`：
   - 新纯 helper `unfinishedBulletLine(lines)`：最后一个非空行若「1–80 字符且不以
     .?! 结尾」→ 返回其（filtered）行号，否则 null。
   - exp/proj/inv 的 AI 按钮行在存在 unfinished 行时追加
     「Complete line N」按钮（同 aiButton 语义、同 not-ready reason）。
   - `runSuggestBullet` 增可选 `{draft, lineIndex}`；tag `${kind}-${id}-complete`；
     `bulletSuggest` 增可选 `draft`/`lineIndex`，Apply 时 lineIndex!=null 走
     `replaceLine`（filtered 行数组按 index 替换后写回），Regenerate 复传同 draft。
   - suggestTargetFor 增 `replaceLine(index, line)`；existing bullets 传给 API 时剔除
     draft 行。
- 零 schema/评分/导出/持久化改动；无 draft 时全部 payload 与 R285 基线字节级一致。

## QA（生产，测试代理，零 AI 配额）
- 半句行（如 "Improved deploy"）→ 按钮出现、payload 含 draft+剔除该行的 bullets、
  假响应→对话框→Apply 原地替换该行（其余行不动）。
- 完整行（以句号结尾）→ 按钮不渲染；Suggest/key-numbers payload 无 draft 键
  （与 R285 基线一致）。
- proj/inv 同验；缺 role/company reason；Regenerate payload 字节级一致；375px；
  localStorage/主题还原；全部请求拦截于网络前。
