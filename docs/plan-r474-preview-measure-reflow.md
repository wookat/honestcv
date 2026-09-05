# R474 — 预览测量 effect 不再每次按键强制同步 reflow

## 一手证据（生产 cv.zalize.com，2026-08-31）

- Lighthouse /builder 移动：perf 0.52、TBT 1250ms、forced-reflow-insight 第一名指向
  `index-Cr8gLVNa.js` L14 C28684（47.9ms 累计强制回流）。
- sourcemap 反解（本地 `vite build --sourcemap` 同哈希入口）：该位置是
  `src/components/ResumePreview.tsx` 的 `PaginatedPages.measure()`（L480–481 的
  `frame.clientWidth` / `content.scrollHeight` 读取）。
- CDP 4x CPU 采样 profile（12s 冷加载 /builder）：`measure` 所在帧是应用代码里
  非 idle 的第一名（~0.21s），高于 react-dom 提交本身。

## 根因

`PaginatedPages` 与 `FlowPage` 的测量 effect 依赖数组里都带着整个 `resume`
对象（effect 体内并未使用它）。Builder 每次按键都会产生新的 `resume` 引用，于是
每次按键：ResizeObserver disconnect → 同步 `measure()`（React 提交后立刻读
layout → 强制同步 reflow）→ 重新 observe 两个元素。而两个 RO 本就分别监听
frame 与 content 的尺寸变化——内容高度变化时 RO 会在布局完成后异步回调
measure（无强制回流），effect 重跑完全多余。

## 方案（最小 diff）

两个 effect 的依赖数组去掉 `resume`，保留 `[baseW, windowH]`：

```diff
-  }, [resume, baseW, windowH])
+  }, [baseW, windowH])
```

- `baseW`/`windowH` 覆盖 pageSize 与 margins 变化（它们是 resume 派生值）。
- frame 宽度变化由 RO(frame) 覆盖；内容高度变化由 RO(content) 覆盖。
- 首次挂载仍有同步 measure()（首帧 scale 就位，避免闪烁），行为不变。

## 非目标

- 不拆 Builder 组件、不改分页/Flow 的渲染结构。
- 不动 R472 的 PDF 测量调度。

## 验证

- `npx tsc -b`、eslint（exhaustive-deps 不应报缺依赖——effect 体未用 resume）、
  `npm run build`、`node scripts/verify-dist.mjs`。
- 生产 QA：键入时不再出现 effect 重跑的强制同步 reflow（CDP 断言）；分页数、
  缩放、pageSize/margins 切换、窗口 resize、Flow 视图分页标记全回归；
  375 光暗零溢出零 console 错误；存储字节还原。
