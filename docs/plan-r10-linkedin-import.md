# R10 设计方案：LinkedIn 档案导入（对标 Rezi LinkedIn Import，P2-7）

一手证据：Rezi 支持从 LinkedIn 导入建简历（R1 审计）。LinkedIn 官方「Profile → More → Save to PDF」导出格式经实证核对（参考成熟开源专用解析器 firedigger/linkedin-resume-parser 的确定性布局规则，与其对 pdfplumber 坐标的处理一致）：
- 双栏布局：左侧栏 Contact / Top Skills / Languages / Certifications / Honors-Awards，右侧主栏 姓名/headline/location/Summary/Experience/Education；两栏 x 起点间有 ≥80pt 的空档。
- Experience 条目为「公司在前」：Company → Role → `Month Year - Present (X years Y months)` 日期行（带时长括注）→ Location → 描述行（无 bullet 符号）；同公司多角色时公司行下是独立时长行（如 `2 years 3 months`）。
- 每页有 `Page N of M` 页脚；侧栏 LinkedIn 链接形如 `handle (LinkedIn)`。

RezUp 现状（代码核对）：已有浏览器端 PDF/DOCX/TXT 导入（extractFile.ts + importText.ts 启发式解析），但 (a) extractPdf 按 y 合行会把 LinkedIn 双栏内容交错；(b) parseResumeText 假定「Role 在前」且不识别 Top Skills/Contact/时长括注——LinkedIn 导出会解析错乱。差距分级：P1（功能深度——Rezi 一键 LinkedIn 起步，我们导入即坏）。

## 方案（架构决策，纯前端、零新依赖）
1. extractFile.ts：extractPdf 增加双栏检测（行起点 x 的最大间隙 ≥80pt 且两侧行数均足够）→ 命中时按「主栏（右）在前、侧栏（左）在后」逐页输出，消除交错；单栏文档行为不变。
2. importText.ts：新增 LinkedIn 检测（`(LinkedIn)` 手柄行 / `Top Skills` 标题 / `Page N of M` + linkedin.com）→ 走 LinkedIn 专用解析：剔除页脚、剥离日期行时长括注、Top Skills→skills、Contact 块只取联系方式、Experience 按「公司在前」两行头 + 日期 + 地点 + 描述行成 bullet，同公司多角色沿用上一公司；非 LinkedIn 文本仍走原 parseResumeText 路径。
3. Builder 导入弹窗文案标注支持 LinkedIn PDF（Profile → More → Save to PDF），成为显性入口。

## 验证
- 本地：以 LinkedIn 导出同构的合成样本（含双栏、时长括注、多角色公司）跑解析脚本核对字段；lint/tsc/build 全绿。
- 生产：独立 PR（基于 R9 分支）→ 部署 → 测试代理用 LinkedIn 格式文本/PDF 走导入全流程（1440+375）。

如无异议按此执行。
