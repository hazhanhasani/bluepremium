# BluePremium Storefront V6 — Isolated Design Lab

This folder contains the **standalone React + TypeScript implementation** of the original, editable MagicPath design. It is an exploration and a browser-testable implementation—not a replacement for the payment system.

## Status & scope

- Source: MagicPath project `462487314254401536`, component `462487380176277504`, revision `462487380176277505`.
- UX target: compact hero, four product-specific illustrated service cards, five-tab RTL navigation, accessible dialogs, responsive viewport.
- **Preview only:** No authentication, live prices, checkout calls, Telegram tokens, payments, D1 bindings or real customer data.
- Existing production code in `src/parts/`, `wrangler.jsonc`, and database migrations remains unchanged.
- Do **not** deploy this experiment in place of the production Worker.

## Start locally

```bash
cd experiments/storefront-v6
npm install
npm run dev
```

Vite runs at `http://127.0.0.1:4173`.

## Validate

```bash
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright tests Chrome at 320px, 390px and desktop widths, capture screenshots, verify tab navigation and modal dismissal, and prohibit real payment/API requests. Screenshots and reports are uploaded as GitHub Actions artifacts.

## Real-data read mode (opt-in, no writes)

The live read-only adapter is deliberately disabled in all ordinary previews.
For a **future same-origin Worker integration only**, build with:

```bash
VITE_ENABLE_LIVE_READS=true VITE_API_ORIGIN=https://your-actual-worker-domain.example npm run build
```

Two conditions must hold before the browser uses any authenticated endpoint:
- `VITE_ENABLE_LIVE_READS` is explicitly `true`.
- `VITE_API_ORIGIN` must be `https:` and exactly match `window.location.origin`.

The adapter only calls `GET /api/plans`, `GET /api/market/catalog?kind=stars`, `GET /api/me`, and `GET /api/market/my-orders`. It uses Telegram's `initData` only in the `X-Telegram-Init-Data` header, only on that same origin; it is never written to storage or sent to an external preview. Wallet and order data are hidden when joining required channels has not been verified. No write endpoint exists in this lab.

The "Continue in original store" control intentionally redirects back to the trusted existing homepage and **does not carry order details or create any transaction**. Users must reselect products in the original checkout. Do not enable live read mode on a public third-party preview; actual serving from the Worker origin and authenticated Telegram testing are required first.

Run `npm run test:api` to verify origin restrictions, token forwarding, real price validation, mandatory-join gate, guest state, and read-only method constraints.

## Verified QA (2026-10-18)

- TypeScript/Vite build: passed.
- Playwright responsive and interaction checks: passed for 320px, 390px, and desktop.
- Same-origin API/Telegram privacy contract tests: passed.
- MagicPath revision updated with the original **BluePremium** logo retrieved from the official `/brandmark.webp?v=8` route and accessible dialog keyboard handling.
- Production `bluepremium` Worker, D1 data, webhooks and payment flows: **unchanged**.
- Real authenticated Telegram purchase end-to-end: not performed; requires a dedicated staging setup.

## Visual comparison & known gaps

The user-supplied EsalaT Gift screenshot is a **composition benchmark**, not an asset source.

| Criterion | Reference | Prototype | Status |
| --- | --- | --- | --- |
| Home composition | wallet header → hero → 2×2 product cards | same narrative | Implemented |
| 4 cards | category-specific artwork and direct actions | original SVG illustrations and action buttons | Implemented, art polish still needed |
| Navigation | five compact tabs with active indicator | five semantic buttons with selected state | Implemented |
| Product checkout | live commerce | **explicitly disabled demo** | By design |
| Account | authenticated wallet | anonymous placeholder | By design |
| Typography | Persian RTL hierarchy | Vazirmatn and mobile-safe responsive CSS | Implemented |
| Safe area | Telegram WebView-specific | CSS safe-area insets | Needs device QA |

**Before integrating production:** Use approved brandmark resource and verify render on mobile; fetch verified provider catalog/price data; add separate secure authentication and API adapters; accessibility review (dialog focus trap); actual Telegram WebView & server-side checkout integration tests; CI preview URLs and release approvals.

## Not a production deployment

This experiment deliberately remains under `experiments/`, and its CI workflow only builds/tests. Release requires a separate reviewed implementation PR.
