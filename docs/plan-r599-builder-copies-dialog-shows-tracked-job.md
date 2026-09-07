# R599 — Builder「Resume copies」行显示目标职位/链接状态（与 dashboard 同源）（2026-09-06）

## 证据（生产 index-BvSP89EA.js，真实职位 2091088 / 1185979，qa/r599-evidence.cjs rows，零 AI）
seed：Copy A（链接职位 A）、Copy A (2)（同职位 A 的复制品，未链接）、Copy B（职位 B 已不跟踪的孤儿）、General resume。
/builder → Copies 弹窗四行 meta 完全同质：
```
Copy A      | 9/6/2026 · Job applications · ATS 8/100 | Open | Delete
Copy A (2)  | 9/6/2026 · Job applications · ATS 8/100 | Open | Delete
Copy B      | 9/6/2026 · Job applications · ATS 8/100 | Open | Delete
```
看不出哪一份是 tracked 职位正在用的、哪一份是重复、哪一份的职位已不再跟踪，也没有回到职位的链接。
同一批副本在 /dashboard（R593/R594）已显示 `for <Title at Company>` / `targeted at … · tracked job uses another copy` /
`targeted at … · job no longer tracked — find it again`。Copies 弹窗是编辑器内切换每职位副本的主入口，R596/R597 已让其
Delete/Open 与 dashboard 对齐，但**选哪一份**所需的信息仍缺位——用户只能靠命名猜测，容易打开/删除错的副本。

## 方案
- 把 Dashboard 内联的 `targetNote(v)` 提为共享组件 `src/components/CopyTargetNote.tsx`：
  `<CopyTargetNote version pipeline />`，逻辑不变（链接 → for + Link；未链接有 targetRole → targeted at … + 三态）。
- Dashboard 改为渲染该组件（行为零变化）。
- Builder：Copies 弹窗打开/副本变化时 `listPipeline()` 一次（`useMemo([versions, versionsOpen])`），每行 meta 追加
  `<CopyTargetNote>`；Link 在 Radix Dialog 内可点，导航离开 /builder 时弹窗随路由卸载。
- 不改数据、不改匹配规则（复用 `copyTargetsJob`）。

## 验收
- rows：Copy A 行含 `for <Title> at <Company>`（→ /jobs?job=A）；Copy A (2) 行含 `tracked job uses another copy`（→ /jobs?job=A）；
  Copy B 行含 `job no longer tracked — find it again`（→ /jobs?q=title）；General resume 行无追加。
- link：点击 Copy A 行链接 → 落 /jobs?job=A，详情为该职位。
- /dashboard 同 seed 文案不回归；375 弹窗不撑宽、无页面溢出；存储回基线；零 console 错误。
