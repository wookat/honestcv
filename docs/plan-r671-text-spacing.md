# R671 — WCAG 1.4.12 文字间距（Text Spacing）：用户覆盖行距/字距/词距后不应出现整页横向滚动或内容被裁

## 背景与生产取证（2026-09-06，index-Dgh_olyg.js）

1.4.12 要求：用户把 line-height 设为 1.5、段后距 2em、letter-spacing 0.12em、word-spacing 0.16em 后，「内容不丢失、功能不丢失」（不被裁、不重叠、不被推出视口）。本仓此前所有审计节点（R644–R670）都在默认排版下跑，从未施加过该覆盖；axe 也没有对应规则（只能靠几何测量）。

方法（`qa/r671-textspacing.cjs`）：seed 标准 fixture（2 份副本 + 1 条 applied 职位 + 2 份文档），10 条路由 × 375/1280，先测基线再注入

```css
*{line-height:1.5!important;letter-spacing:0.12em!important;word-spacing:0.16em!important}
p{margin-bottom:2em!important}
```

对比「新出现的裁切」（`overflow:hidden|clip` 且 `scrollHeight/Width > client`，排除 svg / aria-hidden / `text-overflow:ellipsis`）与整页 `scrollWidth > clientWidth`。基线里的 32 处「裁切」全部是 1×1 的 `sr-only` 文本（`qa/r671-textspacing.cjs SHOW_BEFORE=1`），不是缺口。

| 视口 | 路由 | 结果 |
|---|---|---|
| 375 | `/` | 整页 360 → **370**：hero 徽章「AI-powered. ATS-friendly. Free during beta.」（Badge 基类 `whitespace-nowrap`）16 → 370；第二个 CTA「Check my resume's ATS score」（Button 基类 `whitespace-nowrap`）−5 → 365（居中溢出两侧）。定价表 576 在自己的 `overflow-x-auto` 内，允许 |
| 375 | `/builder` | 整页 360 → **366**：品牌字样「RezUp」50 → 60px，右侧固定 250px 的按钮组整体右移，「Menu」326–366，右 6px 在视口外 |
| 375 | 其余 8 条 | 无新裁切、无整页溢出 |
| 1280 | `/` | 新裁切 1 处：hero 装饰性简历预览 `max-h-[420px] overflow-hidden` + 82% 渐隐遮罩，本就是有意裁切的插图（不修，列入候选：该插图未 aria-hidden） |
| 1280 | 其余 9 条 | 无 |

`qa/r671-hdr.cjs`：375 默认 brand 16–98 / 右组 98–348 / Menu 316–356；加间距后 brand 16–108 / 右组 108–358 / Menu 326–366。

## 方案（最小改动，默认排版下 375/1280 几何不变）

1. `src/components/Layout.tsx` 页头：品牌 `Link` 加 `min-w-0`，字样 span 加 `truncate`，右侧按钮组加 `shrink-0`。用户加大字距且宽度不足时，让品牌字样收缩显示省略号，而不是把移动端唯一导航「Menu」推出视口。logo 与链接可访问名（DOM 文本仍为 RezUp）不变。
   - 首版上线后生产实测（index-C1s9V2L_.js）推翻了「默认排版下字样完整」的假设：/builder 375 默认排版下品牌 16–94、字样 46 < 自然宽 50.22 → 显示「Rez…」。原因：R670 版页头内容 82.22（品牌）+ 258（右组 40+4+170+4+40）− 8（Menu `-mr-2`）= 332.2 > 328（容器内宽），此前一直靠右组溢出容器 4px（Menu right 356 > 344）藏在内边距里；`min-w-0` 后这 4px 改由品牌承担。修正：把负外边距从 Menu 按钮移到右组本身并在 `<sm` 收紧——右组 `-mr-3 gap-0.5 sm:-mr-2 sm:gap-1 {md|lg}:mr-0`，Menu 去掉 `-mr-2`。375 默认：82.22 + 254 − 12 = 324.2 ≤ 328，品牌 16–98 完整、Menu 316–356（与 R670 完全相同）；≥sm 与桌面几何不变。
2. `src/pages/Landing.tsx` hero 徽章：`whitespace-normal text-center`（默认 375 单行宽 < 容器，几何不变；加间距时换成两行；默认 320 也换成两行，首屏两个 CTA 因此下移 15px——R670 时该徽章在 320 单行 nowrap 恰好贴边）。
3. `src/pages/Landing.tsx` 第二个 CTA：R670 的 `max-[359px]:*` 放宽为 `max-sm:*`，并用 `min-h-11` 保持 lg 尺寸 44px（默认 375 单行 44px 不变；加间距时两行 64px）。

不改：定价表（允许的二维内容）、builder 内部 `w-max` 段落导航（自带横向滚动）、hero 装饰预览（有意裁切）。

## 验收

- 本地：`npx tsc -b`、eslint 改动文件、`git diff --check`、`npm run build`、`node scripts/verify-dist.mjs` 全绿。
- 生产：`qa/r671-textspacing.cjs 375/1280` 全部路由整页 `scrollWidth === clientWidth`、新裁切仅剩 hero 装饰预览；`qa/r671-hdr.cjs` 加间距后 Menu 右缘 ≤ 360；`qa/r670-verify.cjs` 48 组默认排版几何与 R670 after 快照逐项对比，只允许两类有意差异：(a) `<sm` 各路由 Menu/右组右移 4px（Menu 右缘统一为视口 −4px，即 R670 时 /builder 的位置）；(b) 首页 320 徽章两行使 CTA 下移 15px；零 console 错误；存储回基线。

## 结果（index-DMBnqyNn.js）

- `r671-textspacing.cjs` 375：10 条路由加间距后全部 360/360、新裁切 0；1280：全部 1265/1265，新裁切仅 hero 装饰预览 1 处（与取证时相同，有意）。
- `r671-hdr.cjs` 375 /builder：默认 brand 16–98 / Menu 316–356；加间距后 brand 16–102（字样省略）/ Menu 仍 316–356。
- `r670-verify.cjs` 48 组：50 处差异全部落在上述 (a)(b) 两类（`.grp`/`.menu` 46 处 + 320 首页 `.ctas` 4 处），其余几何逐项一致。
- 零 console 错误；lib 存储键回基线。
- 如实未验证：真实浏览器扩展/用户样式表（用 `addStyleTag` 注入等价 CSS）；真机。
