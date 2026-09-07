# R531 方案：移动端职位详情层的浏览器 Back 应回到列表而不是离开 /jobs

## 生产实证（2026-08-31，CDP，375px）
- /dashboard SPA 进 /jobs → 点第一行职位 → 全屏详情层打开（列表隐藏）。
- 按浏览器 Back：URL 直接回 /dashboard，/jobs 整页离开——用户想回列表却被踢出职位板。
- 对照 Rezi 2026-08 Week4「Seamless Messaging Navigation: Navigate to messages or refresh the page without losing your place」；移动端通用模式也是 Back 先关详情层。

## 根因
`mobileDetail` 是纯 React state（Jobs.tsx），打开详情层不产生任何历史条目，popstate 自然回到上一路由。

## 方案（最小改动，仅 Jobs.tsx）
仿 useHistoryGuard 的哨兵模式但无需确认弹窗：

```tsx
useEffect(() => {
  if (!mobileDetail) return
  if (!window.matchMedia('(max-width: 767px)').matches) return
  window.history.pushState({ 'hcv-mobile-detail': true }, '')
  const onPop = () => setMobileDetail(false)
  window.addEventListener('popstate', onPop)
  return () => {
    window.removeEventListener('popstate', onPop)
    const s = window.history.state as Record<string, unknown> | null
    if (s && s['hcv-mobile-detail']) window.history.back()
  }
}, [mobileDetail])
```

- 只在移动布局（<md，767px）挂哨兵：桌面点行也会 set mobileDetail(true) 但详情本就常驻，不能污染桌面历史。
- Back 关详情层回列表；再按 Back 才离开 /jobs。
- 应用内「Back to list」按钮/标签切换关闭详情时，清理函数弹掉哨兵（popstate 监听已移除，路由 URL 不变）。
- 不动 URL、不动 selectedId、R407 深链开详情/R441 死链/R528/R529/R530 逻辑零改动。

## QA
- 375px：点行开详情 → Back 回列表（URL 仍 /jobs）→ 再 Back 回 /dashboard。
- 375px：?job= 深链开详情 → Back 回列表。
- 375px：「Back to list」按钮照常，之后 Back 直接离开（哨兵已清）。
- 1280px：点行后 Back 直接回上一路由（无哨兵）。
- 零 console 错误、零溢出、存储仅基线键。
