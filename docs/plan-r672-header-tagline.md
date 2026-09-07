# R672 — 页头品牌副标「by Zalize」在桌面导航出现的那一档让位（768–1023 / builder 1024–1279）

## 背景与生产取证（2026-09-06，index-DMBnqyNn.js，qa/r672-hdr.cjs、qa/r672-hdr768.cjs、qa/r672-hdr768b.cjs）

R671 让品牌 `Link` 可收缩（`min-w-0` + 字样 `truncate`），目的是 375 加大字距时不把「Menu」推出视口。把同一页头放到桌面导航刚出现的宽度实测：

- 768 默认排版（无任何用户覆盖）：`/` 品牌 16–149、nav 149–605、右组 605–737——三段首尾相接，说明容器内宽 721 已被占满、品牌处于被压缩状态。字样 span `clientWidth` 46 < `scrollWidth` 50 → 显示「Rez…」；副标「by Zalize」折成两行；nav「ATS Checker」也折成两行（`qa/shots/r672/01-hdr768-768.png`）。/jobs 更紧：字样 43。
- 同页在浏览器里去掉 `min-w-0`/`truncate` 复现 R670 版（`01-hdr768-r670eq-768.png`）：字样完整 48–98，「by Zalize」两行，「ATS Checker」两行——即 R670 时品牌靠副标折行收缩（嵌套 flex 的 min-content = 各项 min-content 之和，「by Zalize」可折行、「RezUp」不可），R671 之后字样也一起被压 → **R671 在 768–≈800 默认排版引入「Rez…」回归**。
- 800 默认：字样 49.8/50（/jobs 48.8）刚好；900 起宽松。
- 加 1.4.12 间距后 768：品牌被压到 16–67（51px），nav 67–595、右组 595–737；1024 /builder（navAt=lg，nav 在 1024 才出现）默认 品牌 16–155 与 nav 155–633 相接、加间距后 16–106。
- 整页均无横向滚动（768/1024/1280 全部 `scrollWidth === clientWidth`）；问题是页头内部挤压，不是 1.4.10。

根因：桌面 nav（6 项、`gap-5`，自然宽 484）在它出现的第一档断点宽度里，与品牌（logo + RezUp + 「by Zalize」= 141）和右组（132–140，/builder 360）之和超过容器内宽（768：721；builder 1024：977）。

## 方案（最小改动）

`src/components/Layout.tsx` 品牌副标 span：`hidden sm:inline` → 在桌面 nav 出现的那一档隐藏、下一档恢复，随 `navAt` 走：

```tsx
<span className={`text-muted-foreground hidden text-xs font-normal sm:inline ${navAt === 'lg' ? 'lg:hidden xl:inline' : 'md:hidden lg:inline'}`}>by Zalize</span>
```

预期（默认排版）：768 `/`：82 + 484 + 132 = 698 ≤ 721 → 字样完整、「ATS Checker」回到一行、「by Zalize」不再折行（隐藏）；1024 /builder：82 + 478 + 360 = 920 ≤ 977。640–767 nav 隐藏、副标照常显示；≥1024（md 页）/ ≥1280（builder）副标恢复，与现状相同。

加间距后：768 `/` 92 + 528 + 142 = 762 > 721 → 字样以省略号收缩 41px（logo 与可访问名不变，nav 全部可见、无重叠）；这是 R671 设计的兜底，比 R670 版「字样溢出压到 nav 上」好。

不改：nav 的 `gap-5`/字号（桌面观感不动）；右组内容。

## 验收

- 本地：`npx tsc -b`、eslint 改动文件、`git diff --check`、`npm run build`、`node scripts/verify-dist.mjs`。
- 生产 `qa/r672-hdr768.cjs`：768 / 800 `/`、/jobs 字样 `clientWidth === scrollWidth`（完整），「ATS Checker」高度单行（nav 子项高度 = 行高，非 40）；`qa/r672-hdr.cjs` 768/1024/1280 默认与加间距后三段不重叠（`brand.right ≤ nav.left ≤ nav.right ≤ grp.left`）；`qa/r671-textspacing.cjs 375/768/1280` 与 `qa/r671-hdr.cjs` 结果与 R671 相同；`qa/r670-verify.cjs` 48 组与 R671 快照逐项一致（320/375 副标本就隐藏；1280 时 md 页 `lg:inline`、builder `xl:inline`（媒体查询宽度含滚动条 = 1280 ≥ xl）均恢复显示，预期零差异）；零 console 错误；存储回基线。
- 如实未验证：真机；1024–1279 builder 副标隐藏是取舍（该档 builder 右组 360px 已占容器 37%）。

## 结果（index-Bhsgxnfj.js）

- `r672-hdr768.cjs` 768/800/900 `/`、/jobs：字样 50.2/50 完整、副标隐藏、nav 自然宽 484 单行；768 `/` brand 16–98 / nav 110–593 / grp 605–737（修前 16–149 / 149–605 相接）。
- `r672-hdr.cjs`：1024 /builder brand 16–98 / nav 124–608（修前 16–155 / 155–633 相接）；1280 四路由默认与加间距后几何与 R671 逐项相同。加间距后 768 brand 16–67 / nav 67–595 / grp 595–737 不重叠。
- `r670-verify.cjs` 48 组对 R671 快照 0 差异；`r671-textspacing.cjs` 375 十路由 360/360、新裁切 0；零 console 错误；存储回基线。
