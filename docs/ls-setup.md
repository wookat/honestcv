# Lemon Squeezy setup runbook (HonestCV)

Lemon Squeezy is HonestCV's sole payment provider (Paddle was removed — AUP
restrictions blocked onboarding). Checkout activates once all `LS_*` secrets
below are set and `CHECKOUT_ENABLED=true`.

Store: **rankedby** (id `442392`, https://rankedby.lemonsqueezy.com)

## 1. Products to create (dashboard only — the API is read-only for products)

In https://app.lemonsqueezy.com/products → New product, under store `rankedby`:

| Product | Price | Type | Notes |
| --- | --- | --- | --- |
| HonestCV Single Resume | $9.99 | Single payment | Unlimited AI rewrites + PDF/DOCX download for one resume |
| HonestCV Career Bundle | $19.99 | Single payment | Everything in Single Resume + AI cover letter + interview prep |

For each product:
- Pricing: **Single payment** (one-time; NOT subscription).
- Generate license keys: **off** (HonestCV issues its own `CV-XXXX-...` keys).
- Confirmation/receipt text (optional): "Return to the HonestCV tab — your
  download unlocks automatically. Keep this email: the order number can restore
  your license anytime."

After creating each product, copy its **variant id** (Product → the default
variant → id is shown in the URL, or `GET /v1/variants?filter[product_id]=...`).

## 2. Worker secrets

```sh
export CLOUDFLARE_API_TOKEN=$CLOUDFLARE_WORKERS_API_TOKEN
echo -n "<api key>"      | npx wrangler secret put LEMONSQUEEZY_API_KEY
echo -n "<32-char rand>" | npx wrangler secret put LEMONSQUEEZY_WEBHOOK_SECRET
echo -n "442392"         | npx wrangler secret put LS_STORE_ID
echo -n "<variant id>"   | npx wrangler secret put LS_VARIANT_RESUME_ID
echo -n "<variant id>"   | npx wrangler secret put LS_VARIANT_BUNDLE_ID
```

Already set (2026-08-05): `LEMONSQUEEZY_API_KEY` (test-mode key),
`LEMONSQUEEZY_WEBHOOK_SECRET`, `LS_STORE_ID`. Missing: the two variant ids.

## 3. Webhook

Created via API (id `124269` deleted; active one is `124270`):
- URL: `https://cv.zalize.com/api/billing/ls-webhook`
- Events: `order_created`
- Secret: value of `LEMONSQUEEZY_WEBHOOK_SECRET` (6–40 chars — the API rejects longer)
- Signature: `X-Signature` header, HMAC-SHA256 hex of the raw body.

Note: a webhook created with a test-mode API key is `test_mode: true` and only
receives test-mode orders. When switching to live payments, create a second
webhook with a live-mode key (same URL/secret is fine).

## 4. Payment flow

1. Frontend `POST /api/billing/checkout {plan}` → worker creates an LS checkout
   (`checkout_data.custom = {plan, client_id}`) and returns the hosted URL.
2. Frontend opens it as an overlay via `lemon.js` (`LemonSqueezy.Url.Open`).
3. On `Checkout.Success` the frontend claims `POST /api/license/claim
   {transactionId: <numeric LS order id>}`.
4. Claim resolves the plan from the webhook KV record (`lsorder:<id>`), or
   falls back to `GET /v1/orders/<id>` (status must be `paid`), then issues a
   `CV-XXXX-XXXX-XXXX-XXXX` license + signed token.

Order ids are Lemon Squeezy numeric order ids.

## 5. Test-mode end-to-end check

With test-mode key + variant ids set and `CHECKOUT_ENABLED=true`:
1. `GET /api/billing/status` → `{"checkoutEnabled":true,"provider":"lemonsqueezy"}`.
2. Buy on https://cv.zalize.com/builder with test card `4242 4242 4242 4242`
   (any future expiry / any CVC).
3. Confirm download unlocks and `Checkout.Success → claim` returns a license.

## 6. Going live (blocked on owner)

- Store activation (payouts) requires owner identity verification — reported.
- Generate a **live-mode** API key, re-run the secret commands, create the
  live webhook, and re-test with a real card + refund.
