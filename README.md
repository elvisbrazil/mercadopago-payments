# mercadopago-payments

A small Next.js store that takes payments through the Mercado Pago API: Pix with a QR code and status polling, Checkout Pro with redirect and return pages, and a signed webhook that keeps orders in sync.

## Running

Requires Node 22 and pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
pnpm test
```

Put a test access token (`TEST-...`) from your Mercado Pago developer panel in `MP_ACCESS_TOKEN` and the webhook secret in `MP_WEBHOOK_SECRET`. Tests mock every call to the API, so they run without credentials.

Mercado Pago only calls back to public HTTPS URLs. To receive webhooks and use the return pages locally, expose the dev server with a tunnel (ngrok, cloudflared) and set `APP_URL` to the tunnel URL. When `APP_URL` is not HTTPS the app leaves `notification_url` out of the requests and relies on polling.

Other scripts: `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm build`.

## How it works

- `POST /api/pix` creates an order and a Pix payment (`payment_method_id: "pix"`) with a 30 minute expiration. The page shows the QR code image, the copy-paste code and a countdown, and polls `GET /api/orders/:id` until the order is paid or expired.
- `POST /api/checkout` creates a Checkout Pro preference and answers with a 303 redirect to `init_point`. Mercado Pago sends the buyer back to `/checkout/success`, `/checkout/pending` or `/checkout/failure`.
- `POST /api/webhooks/mercadopago` validates `x-signature`, then fetches the payment by id and updates the order.

## Design notes

- Plain `fetch` against `api.mercadopago.com` instead of the official SDK. Only three endpoints are used, the request bodies stay visible in the code, and MSW can intercept them in tests without mocking SDK internals.
- Money is kept in integer cents everywhere and only converted to a decimal `transaction_amount` / `unit_price` at the API boundary. Display goes through `Intl.NumberFormat("pt-BR", { currency: "BRL" })`.
- The webhook body is never trusted for status. It only provides the payment id, which is covered by the signature; the status comes from `GET /v1/payments/:id`.
- Signature check: HMAC-SHA256 of `id:{data.id};request-id:{x-request-id};ts:{ts};`, compared with `timingSafeEqual`. Timestamps older than 5 minutes are rejected to limit replays.
- Each order gets its own `X-Idempotency-Key`, so retrying the same Pix request cannot create a second charge.
- Order updates are idempotent: a repeated notification is a no-op and a paid order cannot go back to pending. A failed lookup returns 502 so Mercado Pago retries.
- Orders live in an in-memory map. It is enough for a demo, but it resets on restart and is not shared between server instances; a real deployment needs a database.
- The Pix page polls the order route rather than holding a connection open. The order route asks Mercado Pago for the latest status, so polling still works locally where webhooks cannot reach the app.
