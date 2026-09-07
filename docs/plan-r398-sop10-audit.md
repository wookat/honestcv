# R398 — SOP-10 four-dimension audit + interview-prep doc naming fallback

## Audit (production, R397 revision, 2026-08-31)

Independent QA drove four dimensions on cv.zalize.com (CDP, all sensitive traffic mocked pre-dispatch, baseline restored byte-exact):

1. **Operations console** — folders create/rename/remove, bulk move/delete with Undo (storage restored byte-identical), share scoping per copy/draft: all state-consistent. No P0–P2.
2. **Feature depth** — paste import → ATS → Fix deep links chain end-to-end; all four exports content-verified (TXT/MD text, %PDF / PK zip magic, margin change alters PDF bytes) behind the mocked free-download email gate; interview prep brief generated and saved. No P0–P2.
3. **Landing/static UI** — /, /pricing, /templates, /examples, /guides at 375/768/1440 light+dark: no user-visible overflow (visualViewport/scrollX assertions), all 40 internal links from / return 200, no blank renders.
4. **Architecture probes** — malformed seeds for resumeHistory/summaryLibrary/shareLinks/activeVersionId, bogus deep links (incl. script-injection param — no XSS), zero-headroom probes on ATS checker and import, slow+failed mocked AI: zero uncaught exceptions.

### Findings triage

- **"P2: AI error shows raw server body" — not a product bug.** The QA mock returned a 500 with `{"error":"mocked failure"}` and the Builder displayed that string. Source verification: `postJson` (src/lib/api.ts) prefers `data.error` and this is intentional — every `{error}` body the Worker sends (worker/index.ts: quota, 413, validation, `callLlm` upstream mapping) is already user-worded, and non-JSON 5xx bodies (Hono default "Internal Server Error", edge HTML) fail JSON parse and fall back to the friendly 500 message. A body like "mocked failure" cannot be produced by the real Worker; suppressing `data.error` on 5xx would instead hide the real, friendly upstream-unavailable messages.
- **P3 (fixed this round):** interview prep docs save as `Untitled — Interview prep` when `targetRole` is empty. Source: Builder tool-dialog `docTitle` — interview branch is `` `${resume.targetRole || 'Untitled'} — Interview prep` ``, with no further fallback, while the resume-copy fallback (R378) is targetRole → fullName → Untitled.
- **P3 (banked, verify first):** dashboard folder group headings may not be semantic heading elements (unconfirmed hypothesis from a heading probe; no user-visible defect).

## Fix: interview-prep doc naming fallback

`src/pages/Builder.tsx` docTitle, interview branch only:

```tsx
- : `${resume.targetRole || 'Untitled'} — Interview prep`
+ : `${resume.targetRole || resume.contact.fullName || 'Untitled'} — Interview prep`
```

Matches the R378 copy-name fallback chain (targetRole → fullName → Untitled). Cover keeps company → targetRole → Untitled (company is a first-class input there); resignation keeps company (required by validation before generate).

## Non-goals

Reworking the tool dialog, adding a title input, cover/resignation naming changes, folder-heading semantics (banked).

## Verification

- Local: `npx tsc -b`, `npm run lint`, `npm run build`.
- Production QA: interview prep save with empty targetRole but a contact name → doc titled `<name> — Interview prep`; with targetRole set → unchanged; both fields empty → `Untitled — Interview prep`; regression on cover/resignation titles; zero console errors; baseline restored.
