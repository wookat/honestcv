# R502 — /jobs 搜索结果计数状态行（WCAG 4.1.3）

## 一手证据（生产 2026-08-31）
- `https://cv.zalize.com/jobs?q=engineer`：结果列 9 条 `li`，`main` 内正则 `\d+ jobs?` 零命中——界面任何位置都不显示结果数量。
- 结果列内 `[role=status]/[aria-live]/[role=alert]` 共 0 个（loading 骨架的 sr-only 与错误卡不在结果呈现路径）：搜索/筛选完成后，读屏用户得不到任何"结果已更新、共 N 条"的状态消息（WCAG 4.1.3 Status Messages）。
- 明眼用户同样无从判断筛选是否生效、命中多少（R500 后查询真实过滤，计数才有意义且诚实）。
- 竞品参照：主流职位板（LinkedIn/Indeed/Rezi jobs）搜索结果均带结果计数。

## 方案（仅 Jobs.tsx）
- all 标签且非 loading/error 时，在列表上方渲染一行 `role="status"` 计数：`{shown.length} job(s) found`。0 条时同样渲染（"0 jobs found"），保证读屏在零结果时也收到状态更新——空态文案与 R501 按钮仍在其下方，视觉上计数行即列表页眉。
- tracked/status 标签不加（已有 tab 标签计数）。
- 不改 worker、不改匹配语义、不加分页。

## 非目标
- 不做 "of N total"（上游总量不可知，虚构总数不诚实）。
- 不动 loading 骨架与错误卡。

## 验证
- 本地：tsc、eslint（changed file）、build、verify-dist。
- 生产：?q=engineer 显示 "9 jobs found"；空查询 15；不可命中查询 0 条走空态+R501 按钮；筛选变化计数跟随；375px 零溢出；零 console 错误。
