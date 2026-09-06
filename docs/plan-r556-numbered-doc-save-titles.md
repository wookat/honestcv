# R556 — 保存文档重名时自动编号

## 一手生产证据（2026-08-31，CDP，1280×900）
- /documents 对同一份「Software Engineer · Cover letter」示例点两次「Use this example」，列表出现两张完全相同的「Software Engineer cover letter」卡片（标题、meta、徽标全同），无法区分。
- 代码实证：saveCareerDoc 直接用调用方标题落库，从不查重；三条保存路径全部经过它——示例「Use this example」、Builder「Save to My resumes」（标题按 role 生成，同 role 必撞）、「Import a cover letter」（兜底标题 'Imported cover letter' 必撞）。
- 对比：简历副本早已编号（R358/R369），文档 Duplicate 也已编号（duplicateCareerDoc "base (2)"），唯独新保存路径缺失。

## 缺口
同名保存的文档在列表面完全不可区分，与产品其余命名语义不一致。

## 最小方案
仅 src/lib/documents.ts：提取 numberedDocTitle(title, docs)（标题被占用时剥 " (copy|N)" 尾缀后从 (2) 起找空位，与 duplicateCareerDoc 现有逻辑同款），saveCareerDoc 落库前套用；duplicateCareerDoc 改用同一 helper（行为不变）。调用方零改动。

## 非目标
Rename 不查重（用户主动命名，尊重原样）；updateCareerDoc/restoreCareerDoc 零改动；导出/徽标/查重 UI 零改动。

## 验证
npx tsc -b、npx eslint src/lib/documents.ts、npm run build、npm run verify-dist；wrangler deploy（Routes code 10000 已知）；生产 CDP QA 1280×900 与 375×812：同一示例连存两次 → 第二张为「… (2)」、Builder 保存撞名同款、Duplicate 回归编号、零溢出零 console 错误；QA 后存储回六键基线。
