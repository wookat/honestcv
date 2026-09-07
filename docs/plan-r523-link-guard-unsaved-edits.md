# R523 — 应用内 SPA 链接导航不再静默丢弃未保存编辑

## 一手生产证据（2026-08-31，cv.zalize.com，CDP）
- /documents 打开 QA 文档 → Edit → 追加 ` EDITED-R523` → 点击页头「Jobs」SPA 链接：
  - URL 直接变为 /jobs，编辑器 dialog unmount，零确认弹窗；
  - localStorage `honestcv.careerDocs` 仍为原文（编辑静默丢弃）。
- 路径矩阵：应用内关闭/Escape（R364/R333 系确认✓）、硬导航（R521 beforeunload✓）、浏览器 Back/Forward（R522 popstate 哨兵✓）、**应用内链接点击（pushState）✗ ——最后一条未覆盖的丢失路径**。
- 原因：react-router `<Link>` 走 pushState，既不触发 beforeunload 也不触发 popstate。

## 方案
扩展 `src/lib/useHistoryGuard.ts`：active 时额外挂一个 **capture 阶段 document click 监听**：
- 命中条件：事件目标最近的 `a[href]` 是同源站内链接（href 以 `/` 开头解析同 origin）、无 `target`/`download`、非修饰键（ctrl/meta/shift/alt）、主键点击；
- 命中即 `preventDefault()+stopPropagation()` 并调用 `onBlocked()`（弹既有样式化确认）；
- 干净态零监听；外链/新标签/下载链接不拦截。
行为与 R522 已备案限界一致：确认 Discard 后停留当前路由，用户再次点击链接完成导航。

## 非目标
- 不迁移 data router / useBlocker；不加自动保存；不替换既有确认 UI；不记忆并重放被拦截的目标链接（保持与 R522 同限界，备案）。

## 验证
- 本地：tsc -b、eslint（改动文件）、npm run build、npm run verify-dist。
- 生产 QA：脏文档编辑器点「Jobs」链接→弹「Discard unsaved changes?」且 URL 停留 /documents；Keep editing 保留；Discard 关闭且不持久化；干净态点链接正常导航；Builder cover 脏草稿点 nav 链接→弹「Close without saving?」；外链（target=_blank）不拦截；375px 零溢出；console 零错误；QA 后清理合成存储。
