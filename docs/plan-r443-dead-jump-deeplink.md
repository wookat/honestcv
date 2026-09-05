# R443 — SOP-10 审计 + 死 ?jump= 深链诚实反馈（/builder 不再静默无视）

## 一手生产实证（2026-09-05, cv.zalize.com）

SOP-10 四维扫描：11 个 SPA/静态 hub 页标题/h1/alt/alert 全净；15 页 375×812 全零横向溢出；
安全响应头（CSP/HSTS/nosniff/XFO/referrer/permissions）齐备——本轮唯一确证缺陷：

CDP 直载 `/builder?jump=bogus-r443`：参数被剥、零提示，页面静默渲染普通 Builder
（唯一 status 是 "Saved"）；`/builder?jump=skills` 照常滚动到 Skills 区。?jump= 来自
/ats-checker 每条 priority fix 的 "Fix →" 深链——旧标签页/收藏的链接在 anchor 更名后
点开即静默失效。R425（?example）/R426（?template）/R441（?job）/R442（?doc）
死深链同族的最后一个静默面。

## 方案（最小修复，仅 src/pages/Builder.tsx）

- 新增 `jumpNotFound` state：挂载初始化器一次性校验 `?jump=` 是否在 `JUMP_ANCHORS`
  （纯本地零 fetch 零 effect；既有 jump effect 的参数剥离与有效跳转字节不变）。
- R427 底部堆叠容器内新增 role=alert 条（R425/R426 同款样式）：
  "That fix link points to a section that doesn't exist — it may be out of date." + Dismiss。
- 有效 ?jump=、无参 /builder、其余状态条全部字节不变。

## QA 清单（生产）

1. `/builder?jump=<bogus>`：alert 条精确文案 + Dismiss 只清条；参数照旧被剥。
2. `/builder?jump=skills`：无条，照常跳转 Skills。
3. 无参 `/builder`：无条。
4. 375 光暗零溢出、零 console 错误、基线字节还原、零逃逸。
