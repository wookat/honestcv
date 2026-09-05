# R435 — 分享页客户端导航后 head 不再自相矛盾

## 生产实证（CDP，2026-09-05，特批临时分享、验毕删净 404）
- 冷加载 /s/<id>：R432 shell 重写正确（"QA R435 Candidate — Staff Engineer | RezUp"）。
- 点 "Build your own free resume" → /builder → 浏览器 Back 回 /s/<id>：
  - canonical/og:url 已被 CanonicalSync 更新为 /s/<id>（正确）；
  - 但 title/description/og:title/og:description 仍是 "Resume Builder — RezUp" —— head 自相矛盾，
    标签页丢掉候选人姓名（R431 同族缺陷：SharedResume 是唯一不调 usePageMeta 的路由页）。

## 方案（最小修复，仅 SharedResume.tsx）
- 顶部调用 usePageMeta，文案与 worker R432 重写逐字一致：
  ready 态 "<fullName> — <contact.title> | RezUp"（无名回退 "Shared resume"）、
  "<fullName>'s resume, shared with you via RezUp."；loading/error/gone 用通用回退句。
- 其余分支与 R433/R434 行为字节不变。

## QA（生产，测试代理）
- 特批一条临时分享：冷加载 title 正确 → CTA 去 /builder → Back → title/desc/og:title/og:description
  恢复候选人文案且与 canonical/og:url 一致；R434 Reload 恢复、R433 下载、/s/bogus 404 回归；
  375 光暗零溢出、零 console 错误；删净分享 404、基线字节还原。
