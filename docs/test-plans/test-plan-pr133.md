# PR #133 re-verify — example resume themed template fix (cv.zalize.com, worker c39f69bd)

Code: commit 2f2fb1a, Builder.tsx example loader now `...(resume && resume.templateId !== emptyResume().templateId ? { templateId: resume.templateId } : {})`. Deployed bundle: index-BkwPnwE6.js / Builder-BowRi9MK.js (new hashes vs PR #132's index-B1bON4Xv.js).

## 1. Fresh state → example loads Modern
- Clear `honestcv.resume`, keep `honestcv.qa=1`, reload /builder (empty editor, Classic default).
- Click "Load an example resume" → template chip **Modern** selected (was Classic before the fix), `JSON.parse(localStorage['honestcv.resume']).templateId === 'modern'`, preview shows teal accents. Fail: chip stays Classic / templateId classic.

## 2. Teal PDF export
- Download PDF (gate already unlocked this session or use qa+pr133@example.com).
- `pdftotext` extracts "Jordan Reyes"/SUMMARY AND content stream contains teal ops `0.0588 0.4627 0.4314 rg/RG` (#0f766e). Fail: only gray ops.

## 3. Deliberate template choice preserved
- Clear `honestcv.resume`, reload, click template **Startup** (non-classic) first, then "Load an example resume".
- templateId stays **startup** (chip Startup selected). Fail: switched to modern or classic.

Recording: short addendum, annotate each test.
