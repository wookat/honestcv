# R40 方案：Resume Assistant MVP（对标 Rezi AI Resume Agent，按 R39 决策文档执行）

## 依据
- R39 一手审计（~/audit-r1/shots-r39/）：Rezi「AI RESUME AGENT」是全屏聊天工作台（快捷任务按钮 + 自由文本 + 会话历史），免费层走 AI 额度池；我方 AI 全是按钮式单任务，无自由文本入口（P1 架构级差距）。
- 决策：docs/plan-r39-ai-agent-research.md ——先做 Builder 内聊天抽屉 MVP，写操作留待后续轮的用户显式确认「Apply」。

## 交互规格
- /builder 头部新增「Assistant」按钮（Sparkles 图标）→ 右侧滑出面板（桌面 420px 抽屉，<sm 全宽），不遮编辑器主体。
- 空态：标题 + 3 个快捷任务按钮（Improve my ATS score / Draft my summary / Suggest skills）——点击即以预置 prompt 作为用户消息发送。
- 消息流：用户消息右对齐、助手左对齐；发送中 loading；错误内联显示（402 引导 Upgrade 弹窗复用既有 PaymentRequiredError 处理模式）。
- 会话历史存 localStorage `honestcv.assistantChat`（单会话，上限 40 条，超出裁旧）；「Clear chat」清空。
- 上下文注入（每次请求，服务端拼 system prompt）：resumeToPlainText(draft)（≤6000 字符）+ target role + 目标 JD（≤4000）。助手输出建议文本 + 指引用户去对应工具，不直接改简历。

## 架构
- Worker 新端点 POST /api/ai/assistant：
  - body: { turns: {role:'user'|'assistant', content}[] ≤12 条、每条 ≤2000 字符; resumeText; role; jobDescription }
  - 门控与 interview-brief 相同：bundle 计划或 free mode 共享免费额度池；解析失败/上游失败不扣额度；沿用 /api/ai/* 既有 IP 日限/全局限流中间件。
  - prompts.ts 新 buildAssistantMessages：SYSTEM 声明「只依据简历事实、不发明经历、简洁回答、指引到编辑器内既有工具（Tailor/Health/Summary draft/Skills suggest/Cover letter…）」。
- 前端：src/lib/api.ts 新 aiAssistant()；新组件 src/components/AssistantPanel.tsx；Builder 头部按钮 + 面板挂载。
- 零新路由；1 个新 localStorage key（honestcv.assistantChat）；1 个新 API 端点。

## 刻意不做（本轮）
- Agent 直接写简历（后续轮做用户确认式 Apply）。
- 服务端会话持久化 / 多会话列表 / 附件上传。
- 流式输出（relay 支持后再加）。

## 验证
- 本地：npm run lint / npx tsc -b / npm run build 全绿。
- 生产（testing agent）：空态快捷按钮、自由提问基于真实草稿内容回答且不捏造、额度每条用户消息 -1、402 路径不重测（沿用既有结论）、刷新后历史恢复、Clear chat、375px 全宽面板 40px 触控无溢出、console clean、localStorage 字节级还原。
