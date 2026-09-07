# R511 — Finish session / End early must not silently overwrite an edited prep brief

## 一手证据（生产 CDP，2026-08-31）
- /builder?doc=interview →「Start from a template」生成 906 字符 brief → 编辑（追加 "MY IMPORTANT EDITS"）→「Instant questions」→「Practice all 2」→「Next question」→「Finish session」：零确认，textarea 内容被替换为 "Practice session — your target job…"，编辑过的 brief 被静默销毁。
- 对照：同一编辑状态下点「Start from a template」或「Regenerate」会弹 R508 的「Replace your edited draft?」确认——finishSession 是 ToolDialog 里唯一绕过该护栏的 result 覆盖路径（「End early」同路径同问题）。

## 根因
`finishSession()` 直接 `setResult(report)`，未经 `requestOverwrite`；且用 `setResult` 而非 `applyResult`，会话报告本身也不被记为程序化输出。

## 修复（仅 Builder.tsx ToolDialog）
1. `overwriteWarn` 联合类型加 `'finish'`。
2. `runOverwriteAction('finish')`：`if (session) finishSession(session, sessionEntries(session))`（确认时重新取当前 session/answer/feedback）。
3. 「End early」按钮与 `advanceSession` 的最后一题分支改走 `requestOverwrite('finish')`；未编辑时行为不变（直接完成）。
4. `finishSession` 用 `applyResult` 写报告，使报告成为新的 autoResult 基线。
5. 确认弹窗 finish 文案：完成会话将用练习报告替换你的编辑。

## 非目标
不改会话/计分逻辑、AI 路径、信件分支、R507/R509/R510 护栏、导出与存储。

## 验证
npx tsc -b --noEmit；npx eslint src/pages/Builder.tsx；npm run build；npm run verify-dist。

## 生产 QA 矩阵
1. 模板 brief→编辑→Practice all→Finish session：弹「Replace your edited draft?」；Keep my draft 保留编辑与会话。
2. 同场景 Replace draft：报告替换、会话结束。
3. 编辑→End early：同弹确认。
4. 未编辑 brief（或空 result）→Finish session：零弹窗直接出报告（回归）。
5. 报告出来后立即「Start from a template」：零弹窗（applyResult 基线，回归 R508 语义）。
6. 375px：确认弹窗零溢出；QA 后清理存储。
