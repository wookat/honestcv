# R39 调研轮：Rezi「AI Resume Agent」一手实测与 RezUp 对策决策（不写码）

## 一手证据（2026-08-30，登录实测 app.rezi.ai/dashboard/agent）
- 截图：~/audit-r1/shots-r39/r39-agent-home.png、r39-agent-reply.png（含 body 文本抓取 .txt）。
- 形态：侧栏一等入口「AI RESUME AGENT (NEW)」→ 全屏聊天工作台（/dashboard/agent/new）。
  - 空态标题「How can AI Resume Agent help with your resume and job search?」+ 三个快捷任务按钮：IMPROVE MY REZI SCORE / TARGET MY RESUME / FIND JOBS。
  - 输入框支持自由文本 + 「ATTACH A RESUME」附件；发送后创建会话（/dashboard/agent/chat/<id>），有 RECENT CHATS 历史与 NEW CHAT。
  - 实测发送「Improve my resume summary」：Agent 识别会话内无简历，回复要求粘贴简历全文「…I'll bring it into your Rezi workspace so we can work on your summary」——即 Agent 能写入工作区（有真实工具执行能力，不只是问答）。
  - 回复下方有「SUGGESTIONS」建议回复 chips（如「I will paste my resume now…」）。
  - 免费层可用（消耗 AI GENERATIONS 额度池，实测 2/10）。

## RezUp 现状
- 我方 AI 能力全部是「按钮式单任务」：rewrite/tailor/summary-draft/skill-suggest/cover-letter/interview-* 等十余个端点，各自独立弹窗/按钮，无自由文本入口、无多轮上下文、无跨功能编排。
- 架构底座已具备：OpenAI-compatible relay（Worker /api/ai/*）、免费额度池、localStorage 简历数据（浏览器内可注入 prompt 上下文）。

## 差距分级
- P1（架构级）：无对话式 AI 工作台——Rezi 把它标为「Our most powerful AI resume tool」一等入口；用户意图无法用自由文本表达，只能自己找按钮。

## 决策（如无异议将按此执行）
分两步收敛，不一次做满：
1. **R40：Resume Assistant MVP（推荐先做）**——/builder 内抽屉式聊天面板：
   - 上下文注入：当前草稿 JSON + ATS 分解 + 目标 JD（全部本地已有，零新存储后端）。
   - 单 Worker 新端点 /api/ai/assistant（messages[] 透传 relay，同额度门控；会话历史存 localStorage 新 key honestcv.assistantChats，上限 N 条）。
   - 快捷任务按钮映射既有能力：Improve my ATS score（引导到 Health/Tailor）、Draft my summary、Suggest skills——按钮先注入预置 prompt，不做服务端工具执行。
   - 诚实边界：MVP 不做「Agent 直接改简历」的写操作（Rezi 能写工作区）；助手输出建议文本 + 深链到对应工具，避免未经确认篡改用户数据。
2. **后续轮**：结构化「apply」动作（助手提议 → 用户点 Apply → 前端本地写入草稿对应字段），逐步获得 Rezi 式执行能力，仍保持所有写操作用户显式确认。

## 刻意不做
- 服务端会话持久化 / 跨设备同步（local-first 架构决策未变）。
- 附件上传到服务器（我方导入已是纯浏览器解析，聊天内可复用）。
- 语音/视频形态（Rezi AI INTERVIEW 已在 R26 诚实降级为文本练习）。

## 风险与成本
- 额度消耗：多轮聊天比单按钮费额度——MVP 每条用户消息计 1 次额度，system prompt 控制输出长度。
- Prompt 注入：草稿 JSON 注入上下文需 system prompt 声明数据边界；不回显 license/clientId 等敏感 key。
