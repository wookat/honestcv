# R674 — 弹窗在矮视口（横屏手机 667×375）超出屏幕且不可滚动

## 取证（生产 index-Be73VzZf.js，`~/qa/r674-dialogs-landscape.cjs 667`，H=375）

R665 之后所有弹窗审计都在 812px 高的视口跑；从未量过横屏手机 / 矮窗口。9 个可无数据打开的弹窗在 667×375：

| 弹窗 | 默认排版 | 加 WCAG 1.4.12 间距后 |
| --- | --- | --- |
| dashboard「Start a new resume」 | **top −43 / bottom 419**（视口 375），弹窗自身无滚动 | −78 / 454 |
| dashboard「Import your LinkedIn profile」 | 28 / 348 | **−5 / 381**，无滚动 |
| builder「Resume copies」 | 35 / 341 | **−55 / 431**，无滚动 |
| Resume settings（R620）/ Health / History / 样例预览 / 信件示例 | 均在视口内或自身可滚动 | 同 |

Radix Dialog 打开时锁定 body 滚动，弹窗又是 `fixed top-1/2 translate-y-1/2` 居中且无 `max-h`，所以一旦内容比视口高，顶部的「Close ×」与底部的操作按钮同时被截掉，鼠标/触控都无法到达——只能靠 Esc（触控键盘没有）或点遮罩关闭。R620 只给 Resume settings 单独加过 `max-h-[90vh] overflow-y-auto`；仓内 51 个 `<DialogContent>` 中 36 个没有任何 max-h。

## 方案

在共享原语 `src/components/ui/dialog.tsx` 的 `DialogContent` 默认 className 中加入

```
max-h-[calc(100dvh-2rem)] overflow-y-auto
```

- 与现有 `max-w-[calc(100%-2rem)]` 对称：上下各留 1rem。
- 已自带 `max-h-[85vh]/[90vh]` 的 15 个弹窗经 `cn`（tailwind-merge）覆盖，行为不变。
- `flex flex-col max-h-[85vh]` 且内部自带滚动区的两个弹窗（样例预览、信件示例）：外层 `overflow-y-auto` 在内容已被内层限高时不产生滚动条，几何不变。
- 内容比视口矮时（812 高的既有 QA 视口）`max-h` 不生效，所有弹窗几何应逐项不变。
- Radix Select/Tooltip 等弹层走 portal，不受外层 overflow 影响。

## 验证

- 本地：`npx tsc -b`、`npx eslint src/components/ui/dialog.tsx`、`git diff --check`、`npm run build`、`node scripts/verify-dist.mjs`。
- 生产：`r674-dialogs-landscape.cjs 667`（H=375）9 弹窗默认与 1.4.12 间距下 top ≥ 0、bottom ≤ 375、超出即 `dlgScroll true`，Close × 与最后一个按钮可 `scrollIntoView` 后 `elementFromPoint` 命中；`r674-dialogs-spacing.cjs 375/1280`（812 高）top/bottom 与修前逐项相同；`r670-verify.cjs` 48 组对 R673 快照 0 差异；零 console 错误；存储回基线。

## 结果（index-DeqeoDPH.js）

- 667×375 默认 + 1.4.12 间距：9 弹窗 top ≥ 16、bottom ≤ 359，超高者 `dlgScroll true`（new-resume 16..359、linkedin-import 16..359、copies 16..359、history 28..347）；每个弹窗 Close × 与最后一个操作按钮 `scrollIntoView` 后 `elementFromPoint` 均命中（history 无操作按钮，仅 Close）。
- 812 高视口 375/1280：9 弹窗 top/bottom 默认与间距下逐项与修前相同（如 new-resume 375 65..747 / 40..772，1280 140..672）。
- `r670-verify.cjs` 48 组对 R673 快照 0 差异；零 console 错误；存储回基线。
- 首次复验脚本崩溃留下 seed 数据使 `/builder?example=` 弹出替换确认遮罩，清理存储后重跑，未把该遮罩当产品缺口。
