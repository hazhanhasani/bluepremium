# BluePremium V6 — Unified Storefront & Checkout

Production route: `/?from=telegram`. Legacy rollback route: `/?legacy=1`.

## Architecture

The V6 interface is a React/TypeScript frontend bundled into the existing Cloudflare Worker through `scripts/pack-worker-ui.mjs` and `src/parts/030.part`. The established D1 database, Telegram bot and provider/payment backend are unchanged.

V6 now handles four product journeys **without redirecting to the V5 interface**:

- Telegram Premium: select a valid server-priced plan, enter recipient username and register the order.
- Telegram Stars: select an active server-priced package, enter recipient username and register the order.
- Telegram Gifts: fetch the live `gift` catalog, select a product and submit its destination.
- Digital Catalog: browse/search real `catalog` products and submit eligible orders.

Checkout routes use **only the established backend**, over HTTPS on the same origin:

| Action | API |
| --- | --- |
| Premium card transfer | `POST /api/orders` |
| Premium wallet | `POST /api/me/wallet/purchase` |
| Stars/Gifts/Catalog card or wallet | `POST /api/market/orders` |

The backend remains authoritative for prices, eligibility, required-channel checks, wallet balance and invoice payment instructions. The new UI does not call a payment provider directly and does not expose a redirect to the provider website. It renders returned invoice card/amount information and order code inside the same V6 screen. A purchase request is sent **only following an explicit user form submission**. Submitting requests during testing against production may create real charges/orders.

## Safety gates

- `VITE_ENABLE_LIVE_READS=true` plus `VITE_API_ORIGIN` exactly equal to HTTPS `window.location.origin` is mandatory for live read and write actions.
- Telegram `initData` is attached only to same-origin backend requests. A wallet purchase is blocked client-side without Telegram data and independently verified server-side.
- Empty or invalid provider pricing never enables a purchase.
- UI prevents duplicate user clicks while a transaction is in progress; it does not implement financial idempotency in the browser. Investigate the last order before retrying after network errors.
- Production backend revalidates the current price and can return `price_changed`, `join_required`, or `payment_details_unavailable`.
- No transaction data or authentication data is put in localStorage. Card payment instructions exist only in the rendered current-session order response.
- Older checkout remains available at `/?legacy=1` for emergency fallback; it is **not** the normal V6 navigation route.

## Development

```bash
cd experiments/storefront-v6
npm install
npm run dev
npm run build
npm run test:api
npm run test:checkout
npx playwright install chromium
npm run test:e2e:ci
```

Ordinary Vite development has no live API access. To build specifically for same-origin Cloudflare production:

```bash
VITE_ENABLE_LIVE_READS=true VITE_API_ORIGIN=https://bluepremium.hazhanhasani4268-0f9.workers.dev npm run build
```

Production CI re-generates `src/parts/030.part` from the exact checked-out source, runs API and browser tests, and only deploys if explicitly enabled via the documented GitHub Actions variable/secret.

## Validation

- TypeScript build, browser navigation at 320/390/1280px, preview no-network assertions.
- Native checkout contract tests with **mocked** responses verify real endpoint selection, signed Telegram headers, wallet denial for guests, read-only catalog, and price/error rejection.
- Production financial transactions were **not** performed during automated QA. Final signed-in Telegram WebView and real provider/card reconciliation still require supervised acceptance testing.

See [Production Deployment](../../docs/PRODUCTION_DEPLOYMENT.md) for rollout controls and rollback.
