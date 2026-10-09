# BluePremium Visual Identity — Editorial Edition

## Brand direction

This product **does not** reuse the generic blue-gradient dashboard template. It uses a tactile, warm editorial language designed for Persian/RTL mobile commerce. The BluePremium logo remains unchanged while the surrounding interface is intentionally more distinctive.

### Palette

| Token | Hex | Primary usage |
| --- | --- | --- |
| Paper | `#F7F4EE` | App background |
| Charcoal plum | `#30262D` | Hero, navigation, primary actions |
| Persimmon | `#F5D2C3` | Telegram Premium product art card |
| Sage | `#CBDCD0` | Telegram Stars product art card |
| Almond | `#FAEEE0` | Gift cards |
| Lavender | `#F1E9F5` | NFT collection |
| Porcelain | `#FFFDF9` | Checkout, order history, wallet |
| Warm outline | `#E6D9C9` | Form boundaries and dividers |

### Typography

- Primary: **Vazirmatn**, weights 400–900, loaded as a stylesheet in the app shell.
- Fallback: Noto Sans Arabic, Segoe UI, Tahoma, sans-serif.
- Secondary Latin micro-labels: Georgia with restrained letter-spacing.
- RTL on all commerce views; product prices use clear hierarchy and minimum 12px where possible.
- Never rely on emoji glyphs to identify primary navigation, products, or payment methods.

### Graphic system

- Eight authored inline SVG illustrations are defined in `src/parts/024.part`: `premium`, `stars`, `gift`, `catalog`, `nft`, `steam`, `orders`, `account`.
- Product cards are illustrative, not simply containers with a thin icon.
- Collection cards are context-colored: cream, almond, lavender and sage.
- SVGs are decorative (`aria-hidden=true`), while descriptive accessible text remains in the controls.
- Runtime product results receive decorative SVGs through a guarded `MutationObserver`; no provider JSON, price, order status or cart data is modified.

### Layout

The product is a mobile-first tabbed application with six destinations: Home, Premium, Stars, Store, Orders, and Account. Each destination has its own independently visible content area, rather than a long scrolling section stack. Checkout and payment logic remain the existing trusted implementation.

### Quality bar

For future UI changes:
1. Keep brand-specific tokens, not stock SaaS blue gradients.
2. Prefer authored vector illustration or a meaningful product-specific image over emoji.
3. Use Persian typography and RTL spacing intentionally.
4. Never break the payment contract, price verification, membership gate or order persistence for purely cosmetic changes.
5. Test six-tab visibility and mobile overflow in a real browser.
6. Respect `prefers-reduced-motion` and maintain visible focus states.

## Phase one: home, wallet, and unified order history

`src/parts/025.part` is a **presentation-only extension** applied over the existing
six-tab storefront. It must not create new payments, alter order state or write
wallet balances. It reads the following authenticated sources:

- `GET /api/me`: verified Telegram user's balance, latest wallet transactions,
  referral counters, and recent Premium orders.
- `GET /api/market/my-orders`: up to 40 recently placed market orders for
  the same authenticated Telegram user.
- `bp:account-updated`: transient browser event emitted when the existing
  account widget refreshes. Snapshot remains only in memory.

The Home view shows a wallet balance, recent-order count, and latest purchase
only when Telegram Mini App authentication and forced-join conditions pass.
Outside Telegram, it shows a signed-out state; never fake balances or orders.

The Orders view merges recent Premium and digital orders and provides **All**,
**Delivered**, **In progress**, and **Needs review** filters. It preserves the
original authenticated checkout and current-order tracking components; filtering
does not modify server-side status. Status names and dates use Persian locale
and Jalali calendar where supported.

The Account view presents actual wallet ledger entries and balances, with
referral controls left connected to the original implementation. Never show
`initData`, public order tokens, card numbers, or other sensitive payment
metadata in these dashboard summaries. Private histories are not stored in
`localStorage`.

### Acceptance checks

- Signed-out browser: no private account data, usable product navigation.
- Telegram member: real balance, wallet timeline and combined order history.
- Nonmember: show join-required state in the new dashboard.
- API error: explicit retry guidance, never an endless loading indicator.
- Mobile: one active tab, accessible filter controls and no horizontal overflow.
- Existing wallet purchase and BluePal flows remain unchanged.
