# R536 — Locations 检查的 Fix 对 involvement 违规条目跳错区

## 审计（一手证据）
- Rezi changelog（rezi.ai/rezi-changelog）无新的可落地公开项（Week 4 August 2026 与 R535 时相同）。
- 生产 CDP（375×812，cv.zalize.com/builder，software-engineer 示例）：
  - 全部 experience/education 条目补上 location，新增一条无 location 的 involvement 条目（Volunteer Mentor at Code Club）。
  - Score 卡「Locations on each entry」如实点名 "Volunteer Mentor at Code Club" has no location。
  - 点 Fix → 焦点落在 **Experience 区（Role 1 — Software Engineer II, Brightpath）**，Involvement 区不在视口内 —— 跳到了完全错误的区。

## 根因
`src/lib/ats.ts` builder 路径 `entryLocationsCheck` 的 involvement 条目写死 `anchor: 'experience'`（education 条目是正确的 `'education'`）。`SectionAnchor` 联合类型里没有 `'involvement'`，当年只能借用 experience。而 Builder 的 jump 目标列表（JUMP_ANCHORS 含 OPTIONAL_SECTION_KEYS）早已支持 `involvement`，`jumpToSection` 还会自动把可选区加入 addedSections——接收端一直就绪，只是评分端从不发这个 anchor。

## 方案（最小修复）
1. `SectionAnchor` 联合类型加 `'involvement'`。
2. builder 路径 `entryLocationsCheck` 的 involvement 条目改为 `anchor: 'involvement' as const`。
- 文本路径（textEntryLocations，/ats-checker 粘贴）只解析 experience 块，零改动。
- education/experience 条目、其他检查、guidance.ts 透传（anchor 直接进 priority fixes 深链）零改动。

## QA 计划
1. 375px：involvement 条目缺 location → Fix → 落在 Involvement 区（不再是 Experience）。
2. experience 条目缺 location → Fix → 照常落 Experience（回归）。
3. education 条目缺 location → Fix → 照常落 Education（回归）。
4. involvement 区未展开时点 Fix → 自动加入 addedSections 并跳达。
5. 1280px 桌面同款直达；?jump=involvement 深链可用。
6. 零溢出、零 console 错误、QA 后存储回基线键。

## 本地检查
npx tsc -b && npx eslint src/lib/ats.ts && npm run build && npm run verify-dist
