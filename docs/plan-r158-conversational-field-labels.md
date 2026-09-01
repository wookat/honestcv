# R158 — Conversational, entity-personalized field labels on Experience/Education cards

## 一手观察（2026-08-31，app.rezi.ai /experience 与 /education 编辑页 DOM）
- Rezi 每个编辑表单字段都有对话式提问标签，并把实体名实时代入：
  「WHAT WAS YOUR **ROLE** AT ACME CORP?」「FOR WHICH **COMPANY** DID YOU WORK?」
  「HOW LONG WERE YOU WITH ACME CORP?」「WHERE WAS ACME CORP LOCATED?」
  「WHAT DID YOU DO AT ACME CORP?」；Education 同风格（degree/institution/
  located/when/minor/GPA/open field 七问）。公司名改动即标签实时更新。
- 我方 Experience/Education 卡片字段只有 placeholder（"Job title"/"Company"/
  "Location"…），无可见 label，也无 label↔input 关联（placeholder 输入后即消失，
  用户失去字段说明；屏幕阅读器只有 placeholder 可依赖）。
- 本轮复审计其余发现：Rezi「Generate bullet with key numbers」我方已有
  （runSuggestBullet variant）；share 弹窗 can view/no access 我方已有
  revokeShareLink；Download .DOCX/Save to Drive——DOCX 已有、Drive 第三方集成缓做。

## 方案（Builder.tsx 唯一改动，零 schema 零存储零依赖；文案自研不照抄 Rezi）
1. Experience 展开卡字段加 Label（htmlFor/id 关联，id=`exp-{id}-{field}`），
   公司名非空时代入实体、实时更新：
   - role: `Your role at {company}` / 无公司名 `Your role`
   - company: `Which company was this?`
   - location: `Where was {company} based?` / `Where was this?`
   - dates(共用一个 Label): `When were you at {company}?` / `When was this?`
   - bullets: `What did you achieve at {company}?` / `What did you achieve?`
2. Education 展开卡同样处理（school 代入）：
   - degree: `Degree and major`，school: `Where did you study?`
   - location: `Where is {school} located?` / `Where is it located?`
   - dates: `When did you graduate?`，minor/GPA/details: 静态短标签（optional 后缀）
3. Label 样式与 Contact 卡一致（text-xs muted 行高紧凑），placeholder 保留为示例。
4. 折叠态/预览/导出/评分/AI 零改动。

## 不做
- Projects 及其余 8 个 section 的问句标签（先验证两大主节的密度/滚动影响，反馈好再扩展）。
- Rezi 的「Is this correct? Confirm for better AI results」公司确认交互（绑定其 AI 后端语义）。
- Save to Drive 第三方集成（缓做）。

## 验证
- 本地 tsc/lint/build 全绿；部署后 1600+375：标签随公司名实时代入、htmlFor 点击聚焦、
  placeholder 仍在、折叠/展开与 R126/R148 audit chip 无回归、375 无横向溢出。
