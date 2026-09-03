# R307 — 探索性生产审计（R290/R295/R297/R301/R303 同模式）

## 一手证据
- Rezi changelog 2026-08 集中在 Auto Apply / checkout / mobile 打磨，无新增可对标的核心编辑器功能；其 8 月 13 日「Instant Job Match Scores」我方 Jobs 已有（matchOf/tailoredMatchOf 徽章，R188/R251）。
- R303 遗留未覆盖路径：>2MB 大文件的「File size under 2 MB」检查项从未在生产实测（extractFile.ts sizeCheck 为非阻断 fail 项）。
- R300–R306 新面（一等路由、tone、签名、示例信 chips、公开 SEO 两页）尚未做过一次跨面端到端整链走查。

## 审计范围（生产 cv.zalize.com，零 AI 配额）
1. >2MB 上传：自制 >2MB 文本 PDF 经 ats-checker 与 builder 导入，断言 size 检查 fail 文案、其余检查照常、无阻断。
2. 端到端新链：/cover-letter-examples/ → Customize → /documents Use this example → 填占位 → 加签名（R304）→ PDF/DOCX 导出核验签名与正文。
3. 公开面健康：sitemap.xml 全部 URL 200、示例/工具页内链无 404。
4. 375px 与暗色抽查上述触点；localStorage/主题还原。

## 验收
- 发现 P0–P2 当轮修复并复验；P3 视工作量当轮或入候选。
- docs PR（handoff + 本方案 + 修复如有）+ SOP-04（R303–R307）。
