# HonestCV — PR #112 live test report (beta free trial copy reframe)

**Target:** https://cv.zalize.com (production, bundle `assets/index-zY3lc9Oq.js`), PR https://github.com/wookat/honestcv/pull/112
**Method:** Recorded browser run. Setup before recording: `localStorage['honestcv.qa']='1'` set (analytics exclusion) and `honestcv.subscribed` removed so the email gate would appear; hard refresh. Shell pre-check confirmed the live bundle contains "Beta free trial" and zero "Free during launch", `/api/billing/status` → `{"checkoutEnabled":false,"provider":"paddle","freeMode":true}`. No payment flows tested (billing disabled). No AI buttons touched.

**Result: all planned assertions passed.** Environment note: the managed Chrome on this box had died; testing was done in Playwright Chromium relaunched with `--remote-debugging-port=29229`.

## 1. Landing page — ✅ PASS

Hero bold text reads **"We're in beta: every plan is a full free trial"**, CTA "Start your free trial — no sign-up", subline "Beta free trial: editor, templates, ATS score, AI tools and downloads — all included."

![Landing hero with beta free trial copy](https://app.devin.ai/attachments/15c57321-3133-4c59-a0ae-50225f8006fe/ss_0f8a0feb.png)

Pricing section: sub "Pay once, never a subscription. Both plans are in a full free trial while we're in beta.", emerald **"Beta free trial:"** banner, $9.99 / $19.99 "once, forever" cards each with a **"Start free trial"** button, lock note "No payment is collected during the beta trial — no card on file, nothing that renews."

![Pricing section with beta banner and Start free trial buttons](https://app.devin.ai/attachments/4e4d4e46-559f-499b-a771-97acbba745ce/ss_zoom_bcf0a777.png)

FAQ shows **"What does the beta free trial include?"**; footer CTA "Start my free trial". No "free during launch"/"Launch special"/"Start building free" wording anywhere on the page.

![FAQ with updated question and footer CTA](https://app.devin.ai/attachments/6ded5e89-34ef-41bf-8f81-d8c0df304085/ss_a8e1638d.png)

## 2. Builder toolbar badge — ✅ PASS

/builder at desktop width shows the **"Beta free trial"** badge (lock/unlock icon) in the toolbar, next to Saved/undo/PDF/DOCX.

![Builder toolbar badge](https://app.devin.ai/attachments/8006276b-263c-4fa7-9c92-32aaef5828b3/ss_zoom_81764acf.png)

## 3. Download flow (email gate) — ✅ PASS

With subscription state cleared, loading the example resume and clicking PDF opened the dialog titled **"Downloads are included in the beta trial"** with description "…download PDF/DOCX at no charge while we're in beta…" and button **"Unlock downloads"**.

![Beta trial download dialog](https://app.devin.ai/attachments/b90ebff5-1870-4b89-8b29-852f16dd8e14/ss_b11ab567.png)

Entered `qa-beta@zalize.com` → clicked Unlock downloads → dialog closed, `jordan-reyes-resume.pdf` auto-downloaded (Chrome download shelf "Done"), followed by the "Resume downloaded — good luck out there" share dialog. Shell verification: `pdftotext` extracts real text (Jordan Reyes / Software Engineer / contact line).

![Unlocked — PDF downloaded](https://app.devin.ai/attachments/a34580ac-4f4e-4446-a587-0f01c4adeb0d/ss_111884c1.png)

## 4. Static SEO pages CTA — ✅ PASS

/guides/what-is-an-ats/ CTA: "…HonestCV is **in beta with a full free trial**: templates, AI rewrites, ATS score and PDF/DOCX downloads, all included ($9.99 one-time when billing opens, never a subscription)." with button "Start my free trial".

![Guide CTA](https://app.devin.ai/attachments/e7f7ed25-93c8-4647-a272-1c2be1213a65/ss_f1b304f4.png)

/vs/zety/ CTA: "**Beta free trial:** every plan is fully unlocked at no charge while we're in beta… Plans are $9.99/$19.99 one-time when billing opens." with button "Start your free trial".

![vs Zety CTA](https://app.devin.ai/attachments/9a3d07b0-4f50-49fc-ae9a-5e219c2b5e45/ss_cc50012c.png)

## Other
- Console: no errors on any tested page.
- Not tested (out of scope): payment/Paddle (billing disabled), AI tools, DOCX gate re-check.
- Recording: `/home/ubuntu/screencasts/rec-7064a70c-a235-49d5-8a3c-228bbcb7949f/rec-7064a70c-a235-49d5-8a3c-228bbcb7949f-edited.mp4`
