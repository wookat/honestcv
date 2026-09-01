# R166 — Custom share link slug (memorable /s/ URL)

## 一手观察（2026-09-01，app.rezi.ai Finish Up → Share）
- Rezi「Share this resume」弹窗：`Anyone with the link — can view` 下拉（no access / can view），
  链接为 `app.rezi.ai/s/<随机串>`（readonly input + copy icon）。
- 弹窗内有「Custom link」开关，标注 **PRO**——付费用户可以把随机串换成自选 slug，
  得到一条可记忆的个人链接（放在申请表/邮件签名里）。
- 截图：~/screenshots/ss_0b852042.png。

## 我方现状（gap）
- `/api/share` 只发随机 id（`randomB64url(16)`，22 字符）；`/s/<id>` 不可读不可记。
- 分享/撤销/重发（同 id 覆盖）与 180 天 TTL、token 撤销能力均已具备（R59 起）。
- 没有任何方式获得 `cv.zalize.com/s/jordan-reyes` 这类可记忆链接。

## 方案（additive，零 schema 零评分零配额改动）
Worker（worker/index.ts）：
- 新增 `SHARE_SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/`（3–40，小写字母数字连字符，
  不以连字符开头/结尾）。
- `POST /api/share` body 增加可选 `slug?: string`：trim+lowercase 后校验，非法 400；
  KV `share:<slug>` 已存在且 tokenHash 不匹配请求 token → 409「already taken」；
  合法且可用 → id=slug，其余流程（tokenHash、TTL、限频）不变。
- `GET/DELETE /api/share/:id` 与 POST 的 re-share 分支放宽 id 校验为
  `SHARE_ID_RE.test(id) || SHARE_SLUG_RE.test(id)`。
- 随机 id 空间（22 字符 base64url 含大写/下划线）与 slug 空间重叠概率可忽略，互不影响。

前端（share.ts + Builder.tsx 分享弹窗）：
- `createShareLink(resume, slug?)` 透传 slug；仅在当前无 active link 时提供输入
  （改 slug = 先 No access 撤销再重建，复用既有流程）。
- 弹窗在未分享状态下新增「Custom link (optional)」输入：前缀展示 `cv.zalize.com/s/`，
  输入自动小写、客户端同 regex 预校验，helper 文案说明规则；服务端 400/409 走既有
  shareError 槽。免费提供（Rezi 是 PRO 专属）。

## 非目标
- 不做 slug 改名迁移/占用管理后台；不做 can-edit 权限档；不改 TTL/限频/大小上限。

## 验证
- 本地 lint/typecheck/build 全绿；部署生产。
- 生产 QA（1440+375）：默认留空仍得随机链接；填 slug 建链 → /s/<slug> 可打开只读简历；
  重复 slug 二次建链 409 文案可见；非法 slug 客户端拦截；No access 撤销后 slug 立即 404
  且可被重新占用；375 无溢出、40px 触点。
