# RezUp 验收包（2026-08-05）

线上地址：https://cv.zalize.com ｜ 仓库：https://github.com/wookat/honestcv

## 1. 验收标准逐条对照

| 标准 | 状态 | 证据 |
| --- | --- | --- |
| 线上可用（zalize.com 子域，Cloudflare） | ✅ | Worker `honestcv` 部署于 cv.zalize.com，/api/health `{"ok":true,"llmConfigured":true}` |
| 移动端适配 | ✅ | 390px 实测无横向溢出，编辑区/预览堆叠布局（test-report.md，录屏） |
| 付费端到端可跑 | ⏳ 阻塞外部资源 | Paddle：live 账号 onboarding 未完成（transaction_checkout_not_enabled）；LemonSqueezy：通道代码+webhook 已上线，等 store 内建品后的 variant ID（docs/ls-setup.md），test-mode 即可打通 |
| 导出质量优于 WolfResume 同价位 | ✅ | 真文本 PDF（pdf-lib，可选中/可解析）+ 真 Word DOCX（docx 库）；WolfResume 同为单栏 ATS 导出但无 DOCX 生成的 AI 定向改写与 ATS 匹配分组合（见 §3） |
| 四道把关 | ✅（付费流除外） | §2 |

## 2. 四道把关记录

1. **QA 功能测试**：测试代理录屏实测 12 项流程（编辑、4 模板、ATS 分、AI 改写、免费额度、paywall、license 激活、PDF/DOCX、SEO 页、移动端、控制台无报错）。初测 10/12，两项失败中 AI 524 超时已修复（grok-composer-2.5-fast + max_tokens 1200，复测 65–85s 通过）；Paddle checkout 失败定位为账号 onboarding，已切 LS 通道。证据：test-report.md、PR #1 评论（截图）。
2. **UX 体验走查**：包含在录屏实测中 —— 首页 CTA→builder→示例简历→编辑→模板切换→导出全路径走查；发现的 ATS 关键词标点问题已修复（tokenizer 去尾部标点）。
3. **内部交叉测试**：API 层独立复测（health/billing status/rewrite 402 额度路径/license activate/claim 幂等/cover-letter/interview-brief），与 UI 层结果交叉一致。
4. **合规与安全审计**：
   - 仓库无任何密钥提交（git grep 复核）；secrets 全部走 `wrangler secret put`；`.dev.vars` 在 .gitignore。
   - webhook 双通道均验签（Paddle ts+h1 HMAC、LS X-Signature HMAC）+ 事件幂等（KV 去重）。
   - license 为 HMAC 签名 token，服务器端校验 plan/exp；下载解锁不可伪造（导出在客户端但 AI/权益接口需有效 token）。
   - 隐私：简历仅存 localStorage，无账号系统，无广告追踪；/privacy、/terms（14 天无理由退款）已上线。
   - 已知限制：免费额度按 x-client-id 计数可被清除绕过（上限 5 次/30 天，损失有限，主付费墙为下载解锁，风险可接受）。

## 3. 竞品对照（同价位）

| | RezUp $9.99/$19.99 一次性 | WolfResume $7.99 | Resumello $19.99 lifetime | Zety ~$24.95/月 |
| --- | --- | --- | --- | --- |
| 订阅陷阱 | 无 | 无 | 无 | 有（品类最高频投诉） |
| 免费 ATS 匹配分（按 JD） | ✅ 付费前免费展示 | ✗ | ✗ | 部分（诱导付费） |
| AI 定向改写（禁止编造事实） | ✅ | 基础 | 基础 | ✅ |
| 真文本 PDF | ✅ | ✅ | ✅ | ✅ |
| DOCX 导出 | ✅ 真 Word 文档 | ✗/有限 | ✗ | ✅ |
| Cover letter + 面试要点 | ✅（bundle） | ✗ | ✗ | 需另付 |
| 无需注册、数据不出浏览器 | ✅ | ✗ | ✗ | ✗（强制账号） |

## 4. 已知问题与待办

- 付费端到端：等 LS variant ID（runbook：docs/ls-setup.md）；真实收款另需 store activation + live key（已上报老板）。
- Bundle AI 生成 65–85s，可用但偏慢；后续可加流式输出。
- Paddle 通道代码保留，账号 onboarding 完成后可一键切回（清空 LS_* 即回退）。
