# R46 方案：职位板「排除已跟踪职位」筛选（对标 Rezi Filter → Exclude jobs）

## 一手证据（~/audit-r1/shots-r46/）

- Rezi 375px `/dashboard/job-search`（本轮实测确认 R45 遗留边界：resumes 页
  Job Search 卡真实路由即 `/dashboard/job-search`，AI Resume Agent 卡路由为
  `/dashboard/agent/new`）。
- Rezi 职位板顶部有「FILTER」按钮，弹出 Filter 面板（r46-rezi-filter.png），
  包含：Skills 搜索、Workplace Type（Remote）、Visa Sponsorship、Job Type
  （WayUp）、**Exclude jobs（Saved/Applied/Interviewing/Rejected 四个复选）**。
- 我方 /jobs（r46-ours-jobs-375.png）：All jobs 列表始终显示所有搜索结果，
  已 Saved/Applied 的职位反复出现在浏览列表里，无法排除——重度使用管线后
  浏览新职位的效率随管线增长而下降。

## 差距定级

- P1：All jobs 无法排除已在管线中的职位（Rezi Filter 的 Exclude jobs）。
- 刻意不做（诚实边界）：
  - Skills 筛选——Remotive 返回的 tags 字段覆盖不稳定，未验证数据质量前不上；
  - Visa Sponsorship / Workplace Type——Remotive 全部为 remote 岗且无签证数据，
    展示这些筛选是造假；
  - WayUp Job Type——Rezi 专属合作源，与我方无关。

## 设计

- 位置：All jobs 标签页搜索表单下方新增一行「Hide:」pill 复选组
  （aria-pressed 切换按钮，与既有状态标签 pill 同视觉语言）。
- 状态：`excluded: Set<JobStatus>`（React state，会话内生效；不持久化——
  这是浏览过滤器不是设置，刷新回到全量视图）。
- 过滤逻辑：`tab === 'all'` 时 `base.filter(j => { const s = statusOf.get(j.id);
  return !(s && excluded.has(s)) })`，在 location 过滤之前应用。
- 计数徽标：每个 pill 显示该状态当前命中的隐藏数量，零管线时整行隐藏
  （无可排除项时不显示控件）。
- 触摸目标 ≥40px（min-h-10，sm:min-h-8 桌面收紧，与既有 pill 一致）。
- 无新端点/存储/AI 调用；纯客户端过滤。

## QA 计划

- 1440px + 375px：勾选 Hide Saved 后已保存职位从 All jobs 消失、取消恢复；
  Saved 标签页不受影响；管线为空时 Hide 行不显示；触摸目标 ≥40px；
  无横向溢出；console clean；localStorage 字节级还原。
