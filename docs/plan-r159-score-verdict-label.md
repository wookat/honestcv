# R159 — 分数定性档位文案（score verdict label）

## 一手观察（2026-08-31，app.rezi.ai finish-up 右侧栏 DOM/截图）
- Rezi 分数仪表在数字下方给出定性档位：「44 / Needs improvement」（0–100 色弧 gauge）。
  用户无需理解数字含义即可知道自己处于什么水平。
- 我方三处分数展示均为纯数字：R152 粘性健康分 chip（图标+数字）、编辑列 Resume
  strength 卡（`{score}%` + 进度条）、Score breakdown 弹窗标题（ATS x/100 · Writing
  y/100）。色带（emerald/amber/red）传达了档位但无文字，色盲用户与读屏用户拿不到。

## 方案（Builder.tsx 唯一改动，零 schema 零存储零依赖；文案自研）
1. 新增 `scoreVerdict(score)`：≥80 → 'Strong'，≥50 → 'Getting there'，<50 →
   'Needs work'（阈值与既有三档色带完全一致，不引入新档位）。
2. R152 粘性分数 chip：数字后追加档位词（`hidden sm:inline`，375 保持紧凑仅数字），
   aria-label 扩为「Resume health score N out of 100 — {verdict} — open full report」。
3. Resume strength 卡：`{score}%` 后追加 `— {verdict}`（同 muted 样式）。
4. Score breakdown 弹窗标题追加 Writing 档位：`Writing y/100 ({verdict})`（ATS 分数
   已有逐维度分解，不重复标注）。

## 不做
- Rezi 的色弧 gauge 图形（纯视觉，成本高价值低）；百分位/How You Compare（无真实数据，
  既定缓做项）。

## 验证
- 本地 tsc/lint/build 全绿；部署后 1600+375：三档实测（改内容让分数跨 80/50 阈值）、
  chip 375 下不溢出且 aria-label 含档位、弹窗标题带档位、R152/R153/R157 回归。
