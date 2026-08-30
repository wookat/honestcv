# R36 方案：已存副本卡片级「Retarget」设置（对标 Rezi 卡片 Settings / Update your resume）

## 研究样本（一手证据，2026-08-30 登录实测）
- `~/audit-r1/shots-r36/r36-card-settings.png`：Rezi resumes 卡片 ⋮ → Settings 弹「Update your resume」——Resume name、Experience 下拉、重新导入、Language、**Target your resume 开关（Job title / Company name / Job description）**，无需打开编辑器即可改一份简历的定向职位。
- `~/audit-r1/shots-r36/r36-card-history.png`：⋮ → History 子菜单为 Undo/Redo/Versions（我方 R28 builder History 已覆盖对应能力）。
- `~/audit-r1/shots-r36/r36-list-view.png`：列表视图切换（Name/Created/Edited 列）——P2，本轮不做。
- `~/audit-r1/shots-r36/r36-finishup.png`：Finish Up 工具条与 AI Keyword Targeting 我方已在 R1/R15/R18 覆盖。

## 现状（cv.zalize.com /dashboard）
- 版本卡显示 ATS 分（按该副本的 jobDescription 计算），但要修改一份副本的名称以外任何内容（目标职位/JD）必须 Open——把它换成当前草稿、去 /builder 改、再存回，三步且有草稿被替换的心智负担。
- Rename 仅改名字，不能改定向。产品哲学是「one copy per job」，副本的定向信息恰恰是最该在卡片级可编辑的。
- 分级：P1（核心工作区流程差距，能力已存在只缺入口）。

## 方案
- 版本卡 Rename（铅笔）升级为 Settings 弹窗（保留铅笔图标与无障碍标签）：字段 Name、Target role（`data.targetRole`）、Job description（`data.jobDescription`，textarea）。保存 → 新增 `updateResumeVersion(id, { name, data })`（lib/resume.ts，模式同 renameResumeVersion，刷新 updatedAt）→ 卡片 ATS 分与相对时间即时更新。
- 现有内联 rename 表单被弹窗替代（行为超集）；`renameResumeVersion` 保留（他处可能引用则不动，若无引用可留作 API）。
- 不做：Experience 下拉（无诚实行为支撑）、卡片内重新导入（R24 导入磁贴已覆盖）、Language、列表视图、Move/文件夹。
- 零新 API / AI / 存储 key（仍写 honestcv.resumeVersions）。

## 验证
lint / tsc -b / build → deploy → 生产 QA（桌面+375px）：改 Name+Target role+JD 后卡片 ATS 分变化且持久化、当前草稿不受影响、Open/Duplicate/Delete/下载回归、375px 弹窗可用触摸 ≥40px、console clean、localStorage 仅 resumeVersions 预期变更且 QA 后字节级还原。
