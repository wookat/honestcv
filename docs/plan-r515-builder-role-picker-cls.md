# R515 — /builder 空草稿态：examples.json 到达时角色选择行插入造成布局位移

## 一手证据（生产，2026-08-31）
- Lighthouse /builder（移动仿真、headless）：CLS 0.064，layout-shifts 审计把全部位移归因
  「Getting started」卡与其下按钮区（`div.bg-card`、`div.flex flex-wrap justify-end gap-2`）。
- 限速 CDP（412px、300ms RTT）buffered layout-shift 观测：单次 0.0601 位移 @ ~849ms，
  sources 即上述节点。
- 对照实验：Network.setBlockedURLs 阻断 `*examples.json*` 后同条件重载，CLS = 0。
  ——位移不是 skeleton→Builder 挂载本身，而是 examples.json 异步到达后
  `examples.length > 0` 使空态提示块内插入「Or start from your role:」label + select 一整行，
  把下方 Getting started 卡与操作按钮推下去。

## 修复（最小改动，仅 Builder.tsx）
- 角色选择行从 `examples.length > 0` 门控改为 `!examplesFailed` 门控：首帧即渲染，
  select 在 `examples.length === 0` 时 disabled 且首选项显示 "Loading roles…"，
  数据到达仅换 option 内容，不再改变几何。
- select 加固定宽 `w-48`：避免 option 文本长度决定 select 宽度、加载前后行宽变化导致换行差异。
- 新增 `examplesFailed` 状态：fetch 失败置 true（行隐藏，罕见路径接受一次位移），成功清 false；
  与既有 `exampleLoadFailed`（?example 深链失败警示条）语义互不干扰。

## 非目标
- 不改 skeleton（对照实验证明 skeleton→挂载本身零位移）。
- 不预内联 examples 数据进 HTML（16.7KB，R496 已做 preload，非本轮问题）。

## 验证要求
- tsc/单查 eslint/build/verify-dist 绿。
- 生产限速 CDP：/builder 冷载 buffered layout-shift ≈ 0；数据到达后 select 可用、选择角色照常生效；
  阻断 examples.json 时 select 保持 disabled "Loading roles…"（不消失、无死链接感）。
- Lighthouse /builder CLS → 0；375/1280 零溢出；?example= 深链与 R415/R416 语义回归。
