# R38 方案：操作台 Career documents 直建入口（对标 Rezi 工作区 Create new Cover/Resignation Letter 磁贴）

## 一手证据（2026-08-30，登录实测 app.rezi.ai）
- 截图：~/audit-r1/shots-r38/r38-coverletters.png、r38-resignationletters.png。
- Rezi 工作区顶部 RESUMES / COVER LETTERS / RESIGNATION LETTERS 三标签，各自页面有虚线「Create new Cover Letter」「Create new Resignation Letter」直建磁贴——文档新建是工作台一等入口。

## RezUp 现状
- /dashboard「Career documents」只列出已保存文档；空态仅一句文字链去 editor。无论空态还是有文档，都没有「新建 cover letter / interview prep / resignation letter」入口——用户必须进 /builder 自己找到工具按钮。
- Builder 已支持 ?doc=cover|interview|resignation 深链（R33 引入，mount 即打开对应工具弹窗并清理 URL）。

## 差距分级
- P1：操作台无文档直建入口（工作流断层，Rezi 为一等入口）。

## 方案
- Career documents 标题区下新增三个直建按钮（New cover letter / New interview prep / New resignation letter），Link 到 /builder?doc=cover|interview|resignation，复用既有深链。空态与非空态都显示；空态文案保留。
- 入口本身零 AI 调用（打开工具弹窗后仍需显式点 Generate 才扣额度）。零新 API/存储/路由。
- 不做：Rezi 式独立 COVER LETTERS/RESIGNATION LETTERS 标签页（我方单页 dashboard + R23 类型筛选已覆盖浏览侧）、文档级排序/视图切换（列表短）。

## 验证
- 本地 lint/tsc/build → 部署 → 生产 QA：三入口分别落地 /builder 并自动打开对应工具、URL 清理、无 AI 调用、375px 40px 无溢出、R23 筛选与文档操作回归、localStorage 还原。
