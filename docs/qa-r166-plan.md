# R166 QA plan — custom share-link slug (bundles index-GPtTFr7X.js / Builder-ffntLZuA.js)

Code evidence (commit c9b0a5f):
- Builder.tsx ~6807: share dialog select (No access/Can view). On 'view': if slug non-empty and !SHARE_SLUG_RE.test → setShareError('Custom links use 3–40 lowercase letters, numbers and hyphens.') and RETURN (no fetch). Else createShareLink(shown, slug||undefined).
- Custom block shown only when !shareLink && !shareBusy: label "Custom link (optional)", prefix span "cv.zalize.com/s/", Input#share-custom-slug placeholder "jordan-reyes", onChange lowercases + spaces→hyphens; helper "Pick a memorable address…3–40 lowercase letters, numbers and hyphens."
- share.ts: SHARE_SLUG_RE=/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/; POST body sends {slug} only when no prev link (localStorage honestcv.shareLink).
- worker/index.ts: slug branch → 400 'Custom links use 3–40…' invalid; 409 'That custom link is already taken — try another.' when KV share:<slug> exists; GET/DELETE/notFound accept slugs (validShareId).

Fixture: minimal resume (name + role) seeded so shared page shows content. Share dialog opens from toolbar button title "Get a read-only link anyone can open — no signup needed" (Share link).

## L1 Bundles
Cache-busted fresh load → exactly index-GPtTFr7X.js + Builder-ffntLZuA.js; baseline storage clean.

## L2 Regression — blank slug → random link (1440)
Open Share dialog, leave Custom link empty, select "Can view". PASS iff: link shown is cv.zalize.com/s/<random ≥10 chars, not a chosen word>; Copy button works (clipboard/copied state); opening /s/<id> in new tab renders the read-only resume (fixture name visible); custom-link input no longer rendered while link active.

## L3 Custom slug happy path
Select "No access" (revoke), custom input reappears. Type slug `qa-r166-<rand>` → select "Can view". PASS iff link displayed = cv.zalize.com/s/qa-r166-<rand> exactly; new tab /s/<slug> renders read-only resume.
Normalization sub-check: typing "QA R166 Test" renders in input as "qa-r166-test" (lowercase, hyphens) — verify input value visually before clearing.

## L4 Invalid slug → client error, no request
After revoking (No access), type "ab" → Can view. PASS iff error text exactly 'Custom links use 3–40 lowercase letters, numbers and hyphens.' appears, no link created (honestcv.shareLink absent, no /api/share POST — verify via Network domain or performance entries), select stays/reverts without link. Repeat quick check with "bad_slug!" (underscore invalid).

## L5 Duplicate slug → 409 text
Create link with fresh slug S. Then remove localStorage honestcv.shareLink (simulating another client), reload builder, open Share dialog, type same S → Can view. PASS iff visible error exactly 'That custom link is already taken — try another.' (server 409) and no link shown.

## L6 Revoke → 404 and slug reusable
Restore honestcv.shareLink? (gone) — instead: from the still-live KV entry, verify /s/S loads; then re-create the original link state is lost, so revoke via a fresh link: create new slug T, revoke via "No access". PASS iff /s/T then shows the 404/not-found page (screenshot). Then re-claim T succeeds (Can view with slug T creates link again) proving slug freed. Finally revoke T again.
Also clean up S: cannot revoke without token (honestcv.shareLink removed) — instead keep S's shareLink JSON saved BEFORE removing it in L5, and restore it afterward to revoke properly.

## L7 Mobile 375
Unshared dialog at 375: custom input + prefix + helper within viewport (scrollWidth ≤375), input rect right ≤375, height ≥36; screenshot.

Cleanup: all created share links revoked (verify /s/<each> 404 via fetch status), localStorage exactly ["honestcv.clientId","honestcv.qa"], fresh desktop tab innerWidth 1600. Share-link creation allowed this round; no payment/AI/export/deletion.
