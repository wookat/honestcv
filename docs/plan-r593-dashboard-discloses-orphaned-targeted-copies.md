# R593 — Dashboard 如实标注「目标职位已不再跟踪」的副本，并给回到职位的路径（2026-09-06）

## 一手证据（生产 index-C2sZMszZ.js 含 R592，真实职位 2091088 / 1185979，零 AI，qa/r593-evidence.cjs）
种入三份副本：孤儿目标副本（Sales Jedi — Creative Force，pipeline 无链接）、已链接副本（Freelance Writer — IAPWE，saved→qa-linked）、通用副本（无 targetRole）。/dashboard 「Job applications」分组：
```
["Sales Jedi — Creative Force","Edited today · ATS 8/100 · Job applications",[]]
["Freelance Writer — IAPWE","… · Job applications · Open in the editor · for Freelance Writer at IAPWE",["/jobs?job=1185979"]]
```
孤儿副本与通用副本在卡片/列表上没有任何区别：看不出它是针对某职位定制的、看不出该职位已不再跟踪、也没有回到该职位的路径。而它的 ATS 分仍按已不再跟踪职位的 JD 计算（8/100），用户无从知道分数针对的是什么。R587 取消跟踪弹窗说的「the copy stays under Job applications」在这里落不到可见的事实。

## 方案（仅 src/pages/Dashboard.tsx，卡片与列表共用一个 `targetNote(v)`）
- 有 pipeline 链接：保持现状 `· for <Link>Title at Company</Link>`。
- 无链接但 `targetRole` 非空：`· targeted at {role}{ at company}`；若 `jobDescription` 非空（说明来源是职位帖而非手填目标）再追加 `· job no longer tracked — <Link to="/jobs?q={role}">find it again</Link>`（/jobs 已支持 `?q=` 种入搜索）。
- 不改变 R586 删除弹窗（那里只对仍链接的副本披露）。

## 验证
- tsc/eslint(Dashboard.tsx)/build/verify-dist。
- 生产 1280+375：孤儿副本行显示「targeted at … · job no longer tracked — find it again」，链接落到 /jobs?q=Sales%20Jedi 且搜索框已种入；已链接副本与通用副本文案不变；375 无页面溢出；存储回基线；零 console 错误。
