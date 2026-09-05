# R378 — SOP-10 four-dimension production audit + descriptive Builder copy-name fallback

## Audit scope (production cv.zalize.com, main + R377, index-BWHM0tmz.js / Jobs-Bgv8i70q.js)
- D1 操作台: fresh-user golden path (wizard → builder edits → copies/folders/search/bulk → PDF/DOCX/TXT export → mocked share create/revoke).
- D2 功能深度: edit-history checkpoints/restore (R345/R346), ATS checker real-PDF upload + scanned/garbage errors, R377 reminders × R372 follow-up drafts interplay.
- D3 落地页: /, /pricing, /ai, guide, example, letter-example pages at 375/768/1440 light+dark; links; console; CLS.
- D4 架构: deep links (?attention=1, /documents?kind, /samples?sector, /ats-checker draft), malformed careerDocs/shareLinks seeds, storage-quota pressure, 8s-slow mocked AI.

## Result: zero confirmed P0–P2. Two initial findings were retracted on verification:
- "Silent data loss at storage quota" — FALSE POSITIVE. Re-run at 1440 confirmed the R351/R352
  header alert ("Not saved — storage full", span[role=alert]) fires on the exact repro, persists
  across further failing saves, and recovery persists all pending edits. The original probe used an
  innerText regex that matched landing copy ("Full health report") instead of querying role=alert.
- "Assistant silently no-ops on malformed AI response" — contradicted by source: AssistantPanel
  throws on empty/non-string reply and renders the error (`setError`, visible <p role/text>); the
  probe likely suffered the same innerText-assertion weakness. Not actioned without a verified repro.

## Fix shipped this round (depth-gap #4, deterministic, one expression)
Builder "Save current as copy" with a blank name fell back to a non-descriptive "Untitled copy",
while the Dashboard save-as-copy path already derives `targetRole || contact.fullName || 'Untitled copy'`.
Builder now uses the same fallback chain (trimmed); R369 uniqueVersionName still numbers collisions.

## Banked depth-gap candidates for R379+
1. Export friction: beta email gate + final-check dialog = two interstitials per download (Rezi: one click post-unlock).
2. Reminder TZ display (P3, by design): fixed-epoch remindAt shifts calendar day across timezones; would need storing the calendar date.
3. /documents filter param is `kind`, not `type` (docs nit, no code change needed).
