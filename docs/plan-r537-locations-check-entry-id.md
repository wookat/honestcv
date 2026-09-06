# R537 — Locations 检查的 Fix 直达违规条目卡（entryId）

## 审计与一手证据
- Rezi changelog（2026-08 Week 4）无新项；上周已对照。
- 生产 CDP（375×812，R536 QA 期间取证）：两条 experience、第二条缺 location 时，「Locations on each entry」hint 如实点名第二条（"…at Cardinal Apps"式），点 Fix → 仅跳 Experience 区顶并聚焦 **Role 1**（探针输出 `T2 exp focus: Experience Sort by dateRole 1— Software Engineer I`）。文字比导航更精确——R534 已为 bullet-count 检查建立 entryId→jumpToEntry 直达先例，locations 检查是结构化路径里仍停留在区级的检查。
- involvement/education 条目卡目前**没有** `data-entry-id`，即使 ats.ts 发出 entryId，jumpToEntry 也找不到目标——两侧都要补。

## 根因
- `entryLocationsCheck(entries)` 的 entries 无 id 字段，返回值不带 `entryId`；Builder score 卡的 `c.entryId ? jumpToEntry : jumpToSection` 优先级（R534）因此永远走区级。
- Builder.tsx 只有 experience 卡有 `data-entry-id` + flash ring；education/involvement 卡缺失。

## 方案（最小）
1. `src/lib/ats.ts`：
   - entries 类型加 `id?: string`；返回值加 `entryId: offender?.id`。
   - 结构化路径三段 map 各加 `id: e.id` / `id: i.id`。
   - 文本路径（/ats-checker 粘贴）无条目 id，不加——自动回退区锚点（R536 行为保持）。
2. `src/pages/Builder.tsx`：education 与 involvement 条目卡容器补 `data-entry-id` 与 `flashEntryId === id` ring（照抄 experience 卡写法）。

## 不做
- 不改 jumpToEntry / score 卡优先级（R534 已就位）。
- 不动其他检查、不动文本导入解析。

## QA（生产）
- 375px：experience 第 2 条缺 location → Fix 聚焦该卡（非 Role 1）；involvement 缺 → 聚焦该 involvement 卡；education 第 2 条缺 → 聚焦该 education 卡。
- /ats-checker 粘贴路径：locations 检查 Fix in builder 深链仍为区级且可用。
- 1280px 同验 involvement 直达；两视口零溢出零 console 错误；QA 后存储回基线键。

## 本地检查
`npx tsc -b`、`npx eslint src/lib/ats.ts src/pages/Builder.tsx`、`npm run build`、`npm run verify-dist`。
