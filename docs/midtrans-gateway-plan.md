# Midtrans Gateway Activation Plan

> For Hermes: implement this plan task-by-task on this branch only.

Goal: make JagoFarm capable of running a complete Midtrans Snap payment flow while preserving Mayar as the current production provider and keeping provider selection reversible through environment configuration.

Architecture: reuse the existing provider abstraction in `src/lib/payments/types.ts` and the existing Midtrans adapter in `src/lib/payments/midtrans.ts`. New orders select the provider through `PAYMENT_PROVIDER`; existing orders keep the provider stored on `orders.payment_provider`. Midtrans creates a Snap transaction, returns a Snap token/redirect URL, and updates orders through the signed webhook plus server-side status verification.

Tech stack: Next.js 16 App Router, Prisma 5, PostgreSQL/Supabase, Midtrans Snap API, TypeScript, Vercel.

Current baseline:
- `src/lib/payments/midtrans.ts` already implements create transaction, status lookup, Snap configuration, status normalization, and SHA-512 signature verification.
- `src/app/api/payments/create/route.ts` already dispatches through the provider registry.
- `src/app/api/payments/webhook/route.ts` and `/api/payments/webhook/[provider]` already dispatch to Midtrans.
- `src/lib/payments/index.ts` already registers `midtrans` and `mayar`.
- Production currently uses Mayar; do not change production provider while implementing this branch.

---

## Task 1: Validate Midtrans configuration contract

Objective: document and verify every environment variable consumed by the adapter.

Files:
- Inspect: `src/lib/midtrans.ts`
- Inspect: `src/lib/payments/midtrans.ts`
- Modify: `.env.example`
- Create: `docs/midtrans-gateway.md`

Required variables:

```env
PAYMENT_PROVIDER=midtrans
MIDTRANS_SERVER_KEY=...
MIDTRANS_CLIENT_KEY=...
MIDTRANS_IS_PRODUCTION=false
NEXT_PUBLIC_SITE_URL=https://jagofarm-ecommerce.vercel.app
```

Rules:
- Never expose `MIDTRANS_SERVER_KEY` to the browser.
- `MIDTRANS_CLIENT_KEY` may be returned to the client only for Snap.js.
- Use sandbox first; production requires a separate production key pair.
- Keep `PAYMENT_PROVIDER=mayar` in the live Vercel environment until the QA task passes.

Verification:

```bash
npm run build
```

Expected: build succeeds and no Midtrans secret appears in browser bundles.

Commit:

```bash
git add .env.example docs/midtrans-gateway.md
 git commit -m "docs: define Midtrans environment contract"
```

---

## Task 2: Audit the provider adapter against Midtrans Snap

Objective: confirm the adapter sends valid Snap payloads and normalizes every relevant status.

Files:
- Inspect/modify: `src/lib/midtrans.ts`
- Inspect/modify: `src/lib/payments/midtrans.ts`
- Test: `tests/payments/midtrans.test.ts` or the repository's established test location

Test cases:
- Gross amount equals the sum of `item_details`.
- Shipping/discount adjustment is added when line items do not equal order total.
- Product names are truncated to Midtrans limits.
- Missing/invalid server key produces a controlled configuration error.
- `settlement` and `capture` normalize to `paid`.
- `pending` normalizes to `unpaid`.
- `expire` normalizes to `expired`.
- `cancel`, `deny`, and refund statuses do not become paid.
- Invalid webhook signature returns 403.
- Valid webhook signature is accepted.

Verification:

```bash
npm test -- --runInBand
npm run build
```

Commit:

```bash
git add src/lib/midtrans.ts src/lib/payments/midtrans.ts tests/
git commit -m "test: verify Midtrans Snap adapter behavior"
```

---

## Task 3: Verify order-to-payment provider routing

Objective: ensure a new order uses Midtrans only when explicitly selected, while old Mayar orders remain Mayar orders.

Files:
- Inspect: `src/lib/payments/index.ts`
- Inspect: `src/app/api/payments/create/route.ts`
- Inspect: `prisma/schema.prisma`
- Test: `tests/payments/provider-routing.test.ts`

Acceptance criteria:
- `PAYMENT_PROVIDER=midtrans` selects `midtrans` for new orders.
- An order with `paymentProvider=mayar` continues using Mayar even if the environment later changes.
- An order with `midtransToken` or `midtransOrderId` continues using Midtrans.
- Payment creation stores `payment_provider`, `payment_ref`, and `payment_url`.
- A paid order cannot create another payment.

Verification:

```bash
npm run build
```

Commit:

```bash
git add src/lib/payments/index.ts src/app/api/payments/create/route.ts tests/
git commit -m "test: preserve payment provider routing"
```

---

## Task 4: Verify the Snap.js customer experience

Objective: make sure the order page opens Midtrans Snap correctly and falls back to the redirect URL when Snap.js cannot load.

Files:
- Inspect/modify: `src/app/(shop)/orders/[orderNumber]/page.tsx`
- Inspect: `src/app/api/payments/create/route.ts`

Acceptance criteria:
- Midtrans response with `token` opens `window.snap.pay`.
- `onSuccess`, `onPending`, `onError`, and `onClose` refresh or preserve order state correctly.
- Missing Snap.js falls back to `redirectUrl`.
- Mayar response with `paymentUrl` still uses the hosted/embedded Mayar panel.
- The UI identifies the provider correctly.

Verification:
- Run the app against Midtrans sandbox.
- Create a test order.
- Open `/orders/<orderNumber>`.
- Confirm Snap modal opens.
- Close the modal and confirm the order remains pending.

Commit:

```bash
git add "src/app/(shop)/orders/[orderNumber]/page.tsx"
git commit -m "test: verify Midtrans Snap checkout UI"
```

---

## Task 5: Configure and verify the Midtrans webhook

Objective: make server-side payment status updates reliable and idempotent.

Files:
- Inspect/modify: `src/lib/payments/midtrans.ts`
- Inspect/modify: `src/lib/payments/index.ts`
- Inspect: `src/app/api/payments/webhook/route.ts`
- Inspect: `src/app/api/payments/webhook/[provider]/route.ts`

Webhook URLs:

```text
https://jagofarm-ecommerce.vercel.app/api/payments/webhook/midtrans
```

Compatibility URL:

```text
https://jagofarm-ecommerce.vercel.app/api/payments/webhook
```

Configure the provider URL in the Midtrans dashboard. Use the same production/sandbox environment as the server key.

Acceptance criteria:
- Signature verification uses the Midtrans server key.
- Gross amount is compared with the order total.
- A notification cannot mark another order paid.
- Repeated notifications are idempotent.
- `paidAt`, `paymentStatus`, and `status` transition consistently.
- Stock is not decremented twice on duplicate notifications.

Verification:
- Send a signed sandbox notification.
- Read the order back from `/api/orders/<orderNumber>`.
- Confirm one transition to `paid` and no duplicate side effect.

Commit:

```bash
git add src/lib/payments/midtrans.ts src/lib/payments/index.ts
 git commit -m "fix: harden Midtrans webhook verification"
```

---

## Task 6: Run sandbox end-to-end QA

Objective: prove the full flow before any production provider switch.

Test matrix:

| Case | Expected |
|---|---|
| QRIS/Snap sandbox | Payment modal opens and remains pending until paid |
| Successful payment | Order becomes `paid` |
| Pending payment | Order remains `pending/unpaid` |
| Expired payment | Order becomes `expired` |
| Cancelled payment | Order becomes `cancelled` or remains unpaid according to adapter policy |
| Invalid signature | Webhook returns 403 |
| Duplicate webhook | No duplicate stock or email side effect |
| Amount mismatch | Order is not marked paid |
| Mayar legacy order | Still uses Mayar status/webhook path |

Required evidence:
- Deployment URL
- Order number
- Midtrans transaction/order reference
- Webhook response status
- Final order status read from the API/database

Commit:

```bash
git commit --allow-empty -m "test: complete Midtrans sandbox QA"
```

---

## Task 7: Production cutover checklist (manual approval required)

Do not change production to Midtrans until the owner explicitly approves the cutover.

Before cutover:
- Production Midtrans server key is set in Vercel Production.
- Production Midtrans client key is set in Vercel Production.
- `MIDTRANS_IS_PRODUCTION=true`.
- `PAYMENT_PROVIDER=midtrans`.
- Midtrans production notification URL is registered.
- Mayar credentials remain available for existing Mayar orders.
- A rollback commit/env change is documented.

Cutover command:

```bash
vercel env rm PAYMENT_PROVIDER production -y
printf '%s\n' midtrans | vercel env add PAYMENT_PROVIDER production
vercel deploy --prod --yes
```

Rollback:

```bash
vercel env rm PAYMENT_PROVIDER production -y
printf '%s\n' mayar | vercel env add PAYMENT_PROVIDER production
vercel deploy --prod --yes
```

---

## Final acceptance criteria

- New Midtrans orders create a valid Snap transaction.
- Customer can complete payment in the Snap sandbox/production environment.
- Webhook verification updates exactly the correct order.
- Duplicate notifications are harmless.
- Existing Mayar orders remain payable through Mayar.
- No payment secret is exposed to the browser.
- `npm run build` succeeds.
- Production provider is not switched without explicit approval.
