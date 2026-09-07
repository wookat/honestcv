# R655 — 示例简历卡片标题按钮（/samples、/dashboard Samples 区）小屏热区 302×20

## 生产实证（index-BooZ5OSm.js，qa/r655-sweep.cjs 全路由逐 400px 滚动跑 axe，375）
- R648 审计的 axe 只在页顶跑一次；本轮改为逐屏滚动累计违例，暴露页顶看不到的 `target-size` 违例：`/samples` 与 `/dashboard` Samples 区每张卡片的角色名按钮（`<button class="block w-full truncate text-sm">Software Engineer</button>`，点击打开预览弹窗）实测 302×20（1280 为 251×20），axe「should be at least 24px by 24px」——它不是句内文本，故没有 2.5.8 行内豁免，是本仓 axe 首个真正 fail 的目标尺寸。
- 同卡片的 Star 收藏按钮 375 已是 40×40（`size-10 sm:size-8`）；sweep 报它「partially obscured」是滚动步长恰使其压在粘性页头下，居中复测命中正常，非缺口。
- 其他 sweep 结果：`/ats-checker` FAQ `<summary>` 294×20（下一轮）；builder「+ 关键词」芯片 22px（axe 因间距豁免通过，候选）；builder 若干「obscured」同为粘性页头步长伪影。

## 方案（一处 className）
- Dashboard.tsx 角色名按钮：`-my-2.5 py-2.5 sm:my-0 sm:py-0` → 375 盒子 40px，块级负外边距使文字与下方行业行位置不变；≥640px 等于现状。不动 Star / Use this example / 预览弹窗。

## 结果（index-DaRDVKBP.js，qa/r655-verify.cjs before/after，1280+375 ALL PASS）
- 375 两页 ×3 卡片：按钮 20 → 40px、中心命中；文字顶距、行业行顶距、卡片高度（189/209/286）逐一等于修复前；Star 40×40 命中不变。1280 全部等于修复前（251×20、卡 278）。
- 滚到 Samples 区后 main 范围 axe 0（修复前 target-size 9 节点）；无溢出；点标题打开预览弹窗、Esc 关闭后焦点回标题按钮；零 console 错误。
- 部署：资产上传成功，Workers Routes 仍 code 10000。未做：真实读屏实听、真机触控。
