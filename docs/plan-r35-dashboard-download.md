# R35 方案：操作台简历卡片直接下载 PDF/DOCX（对标 Rezi 卡片 Download 菜单）

## 研究样本（一手证据，2026-08-30 登录实测）
- `~/audit-r1/shots-r35/r35-kebab.png`：Rezi resumes 工作区每张简历卡的 ⋮ 菜单含 Settings / History / Duplicate / Review / Move / **Download** / Delete——无需进编辑器即可导出任意一份简历。
- `~/audit-r1/shots-r35/r35-editor-open.png`：其编辑器 URL 结构 `/dashboard/resume/<id>/contact`，编辑器内亦有导出，Download 在卡片级是并列入口。

## 现状（cv.zalize.com /dashboard）
- 卡片操作仅 Open/Duplicate/Rename/Delete（`src/pages/Dashboard.tsx` 头注释即如此声明）。
- 要导出某份已存副本，必须先 Open（把它换成当前草稿）再去 /builder 下载——多一步且有「当前草稿被替换」的心智负担；导出后还要手动换回。
- 差距分级：P1（核心工作区效率 + 与 Rezi 卡片操作集差一项；导出能力本身已存在，只缺入口）。

## 方案
- Dashboard 的草稿卡与每张版本卡新增 PDF / DOCX 下载按钮（与既有小按钮同排风格），调用既有 `downloadResumePdf` / `downloadResumeDocx`（动态 import，同 Builder），文件名沿用 Builder 规则 `<full-name>-resume.pdf`。
- 门控与 Builder `download()` 完全一致：`unlocked` 直接下载；`!freeMode` 时弹既有 `UpgradeDialog`；freeMode 且未过 email 门（`!hasSubscribed() && !honestcv.shared`）时弹既有 `FreeDownloadDialog`，通过后继续下载；成功后设置 `honestcv.shared`（与 Builder 一致，不弹 share 弹窗）。
- 不做 Builder 的 final-check 弹窗（那是编辑器编辑流的一部分；卡片下载是拿已定稿副本）。
- 零新 API / 存储 key / AI 调用；纯前端。

## 验证
本地 lint / tsc -b / build → wrangler deploy → 生产 QA（1440+375）：草稿卡与版本卡 PDF/DOCX 真实下载且内容对应该副本（非当前草稿）、门控三分支、既有 Open/Duplicate/Rename/Delete 回归、375px 触摸 ≥40px 无溢出、console clean、localStorage 除 honestcv.shared 外不变。

## 刻意不做
- Move/文件夹（无多文件夹概念）、卡片级 Settings、付费人工 Review、TXT/MD 卡片导出（低频，Builder 已有）。
