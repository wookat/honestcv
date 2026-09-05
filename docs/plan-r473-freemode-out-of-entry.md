# R473 — 把 useFreeMode 移出 Paywall，让整个付费墙栈离开入口块

## 一手证据（生产 + 本地 sourcemap，2026-08-31）

- R473 SOP-10 审计（`~/audit-r1/r473_audit.py`）：7 条 SPA 路由 × 375/1440 双视口，
  零 console 错误、零未捕获异常、零横向溢出——四维中「操作台健康」全净。
- R472 备案的最大余项：/builder 入口块脚本执行 ~2.5s（Lighthouse TBT 主导成本）。
- 本地 sourcemap（`source-map-explorer`，/tmp/r473_sme.json）入口块 index-*.js 325,767B 构成：
  - react-dom 178,684B（不可动）
  - Landing.tsx 36,044B（静态引入是水合设计——lazy 会让预渲染首页闪骨架，驳回）
  - ResumePreview 24,707B（Landing hero 真用，Builder/Dashboard 复用，留在入口合理）
  - **Paywall.tsx 9,275B + checkout.ts 2,332B + license.ts 1,111B**：进入口的唯一原因是
    Landing.tsx 只 import 了 `useFreeMode`（一个 20 行、只依赖 react 的 fetch 标志 hook），
    却把整个 Paywall 模块（CheckoutButton/LeadDialog/FreeDownloadDialog/UpgradeDialog/
    ActivateForm）连同 checkout/license 拖进了每个路由都要付费的入口块。
  - Paywall 还是入口里 Dialog 栈（ui/dialog 2,458B + @radix-ui/react-dialog 4,211B +
    react-remove-scroll 5,695B + dismissable-layer 5,270B + focus-scope 3,629B +
    presence/portal/focus-guards/… 合计 ~20KB）的入口侧消费者之一——Landing 本身不用 Dialog。

## 差距与方案

**差距**：homepage 以外的每条路由（尤其 /builder，本就是 TBT 重灾区）在启动关键窗口
解析执行一段只有付费面才需要的代码；付费面组件真正渲染处（Builder/Dashboard 的
路由块）本可以自带。

**最小修复**：
1. 新建 `src/lib/freeMode.ts`：原样搬 `useFreeMode()`（行为零改动）。
2. `Landing.tsx` 改从 `@/lib/freeMode` 导入。
3. `Paywall.tsx` 删除本地定义，改为 `import` + `export { useFreeMode }` 再导出——
   Builder/Dashboard 的既有 `from '@/components/Paywall'` 导入零改动。

Rolldown 据此把 Paywall+checkout+license（以及若无其他入口消费者的 Dialog 栈部分）
从入口挪进 Builder/Dashboard 路由块。

## 非目标

- 不 lazy Landing（预渲染水合会闪骨架）。
- 不拆 Builder.tsx（246KB 单文件是后续轮候选，本轮不动）。
- 不改任何付费/下载/license 行为。

## 验证

- 本地：tsc -b、eslint、npm run build、verify-dist；重建 sourcemap 断言入口不再含
  Paywall/checkout/license。
- 生产 QA：入口字节零 Paywall 代码；/builder 下载 gate（FreeDownloadDialog）照常弹出
  且订阅态放行；Dashboard PlanCard/Upgrade 面照常；首页 free-mode 标志照常生效
  （/api/billing/status 请求仍在）；R468 Ctrl+S、R469 Ctrl+/ 回归；375 光暗零溢出；
  基线 localStorage 字节还原。
