# I7+I8 生产回归测试报告（cv.zalize.com，main 239d644）

录屏浏览器实测生产环境，QA 客户端（`honestcv.qa=1`，clientId `qa-i4-u69s31cr14`），仅 1 次 AI 调用（按预算）。**全部通过，无新问题。**

## I7

### ① Builder 配额提示（JD 粘贴后显示在 Tailor 旁）
- 未粘贴 JD：显示旧提示 "Paste a job description to enable tailoring"，Tailor 禁用。
- 粘贴 JD 后：Tailor 旁即显示 **"12 free AI uses left"**（锁定用户）。✅

| 无 JD | 有 JD |
|---|---|
| ![no JD](https://app.devin.ai/attachments/2412dc2c-83e4-4176-bb75-1c9793783e74/ss_zoom_56c18396.png) | ![with JD](https://app.devin.ai/attachments/ce592e26-d197-4fec-ab41-fc3c24f1e1e6/ss_zoom_1550d3f6.png) |

### ② 新的 AI 故障文案（1 次 Tailor 尝试，配额不变）
- `/api/ai/quota` 前后均为 `{"freeRemaining":12}`。
- 对话框中逐字显示：**"The AI service is temporarily unavailable (503) — please retry in a minute. None of your free AI uses were spent."** ✅

![503 copy](https://app.devin.ai/attachments/55dfc0dd-00d4-46f9-b0a6-79211b46a899/ss_zoom_be4a2104.png)

### ③ 375px /ats-checker 标签/上传按钮行换行
- flex-wrap 生效：label（y368–382）与 Upload 按钮（y390–418）分两行，无重叠；`scrollWidth = 375` 无横向溢出。✅

| 🔴 修复前（I4 轮） | 🟢 修复后 |
|---|---|
| ![before](https://app.devin.ai/attachments/82c6abeb-de94-425b-97ca-a8c69b77dce3/i4-375-ats.png) | ![after](https://app.devin.ai/attachments/e30c373c-7edf-4a74-bd02-eb5fb4f90a73/ss_02f1ec8e.png) |

## I8 /examples/

- 页脚新增 "Resume examples" 链接（/builder 页面点击验证）→ `/examples/`。✅
- Hub：`Resume examples by role` 标题 + 全部 8 个角色链接。✅
- 角色页（software-engineer、data-analyst 桌面 + teacher 375px）：角色标题、示例简历卡（Summary/Experience/Skills/Education）、虚构声明、3 条角色建议、CTA、相关示例、页脚。✅
- 内链：related example（sweng→data-analyst）与 CTA "Start my resume" → /builder 均正常。✅
- 375px：hub 与 teacher `scrollWidth = 375`，内容完整可读。✅
- axe A/AA（4.10.2）：hub/角色页 桌面+375px 共 4 次扫描 **0 违规**。✅
- 控制台：仅 Cloudflare beacon `ERR_BLOCKED_BY_CLIENT`（已知误报），无产品错误。✅
- sitemap 86 个 URL（curl 验证）。✅

| Hub 桌面 | 角色页桌面 | Teacher 375px |
|---|---|---|
| ![hub](https://app.devin.ai/attachments/a87f90c5-b19d-4f33-b087-ae2ac84462f1/ss_e8dc24c6.png) | ![sweng](https://app.devin.ai/attachments/daac372f-7b86-4767-8108-316120846701/ss_9253ec1b.png) | ![teacher375](https://app.devin.ai/attachments/fcc90dfa-3b95-47a5-9e61-4cd571e771fc/ss_0b3eccd6.png) |

## 未测项
- Cover-letter 成功冒烟：按指示跳过（relay 仍宕机）。
