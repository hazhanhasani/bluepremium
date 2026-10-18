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

**Before integrating production:** Replace temporary prototype logo with approved asset; fetch verified provider catalog/price data; add separate secure authentication and API adapters; accessibility review (dialog focus trap); actual Telegram WebView & server-side checkout integration tests; CI preview URLs and release approvals.

## Not a production deployment

This experiment deliberately remains under `experiments/`, and its CI workflow only builds/tests. Release requires a separate reviewed implementation PR.
