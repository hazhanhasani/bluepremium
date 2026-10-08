# TG Tools Digital Products

## Release

The BluePremium Worker on Cloudflare includes a dedicated catalog and checkout for TG Tools products. The live Stars API returns supported package quantities and wholesale TON prices. The storefront converts TON to Toman using the existing price-sync exchange rate, with a separate profit percentage for each product family.

Current configuration and contracts:
- **Stars:** enabled; dynamic package prices from `/api/purchase/prices` and successful delivered order observed.
- **Telegram gifts:** enabled with sold-out filtering, confirmation-only failure refunding and TGTools purchase polling. The live list returned 11 currently sellable gifts. A prior wallet purchase that returned "gift sold out" was refunded (52,000 Toman).
- **Gift cards/game top-ups:** enabled; searches provider giftcards/topups with brand search, lists individual denomination variants and re-quotes `/api/catalog/item?key=` by product ID before checkout. A live example (Amazon `productId=225`, `giftcards:amazon`) returned a matching wholesale TON quote. Provider delivery confirmation is still required before marking delivered.
- **Steam direct top-up:** enabled following a successful live quote on `RUB:100`. Supported currencies and amounts are quoted against `/api/steam-topup/quote`; `/check-login` validates the destination before `/buy`. Order polling uses `/api/fazer/orders/{id}`.
- **Collectible gift NFTs:** quote-on-demand enabled. A customer supplies the exact NFT address and receiving TON address; `/api/marketplace/quote` must return `canBuy:true` and `totalPriceTon`. The marketplace browse feed may be empty, in which case manual address quoting remains available. Purchase uses a deterministic `clientOrderId`.
- **SMM:** enabled in configuration but live bundle discovery has not produced a verified sellable catalog; empty/invalid responses produce no purchasable items.

*Production caution:* only the Stars delivered transaction and Steam quote have been observed live during this rollout. The other categories' paid fulfillment paths have automated contract tests but have not been proved by a real completed purchase.

## Customer experience

In the Telegram bot use `/stars` or `/products`, choose a package, specify the delivery target and choose wallet or BluePal card transfer.

In the storefront open the **فروشگاه خدمات دیجیتال** section. The store displays a category switcher, price cards, target fields, payment choice and a token-protected order status check.

For BluePal card transfer, only the destination card number and exact payable amount are displayed in the app; no BluePal branding/link is presented to the buyer. Payment is independently verified with the gateway API before fulfillment. A wallet debit is recorded atomically in the wallet ledger along with the market order.

## Administration

In `/admin` choose **محصولات TG Tools** to configure each category's margin and enabled flag independently, and inspect up to 100 recent market orders. Admin endpoints:
- `GET/PATCH /api/admin/market/settings`
- `GET /api/admin/market/orders`

Public endpoints: `GET /api/market/catalog?kind=stars|gift|catalog|smm`, `GET /api/market/catalog?kind=catalog&q=Amazon`, `GET /api/market/catalog/quote?sku=225&catalog_key=giftcards:amazon`, `GET /api/market/quote?kind=steam&sku=RUB:100`, `GET /api/market/quote?kind=nft&sku=<address>`, and `GET /api/market/nft-listings`. Signed Telegram Mini App profile/history remains separate.

The price sync continues using the existing Cloudflare cron and TON/Toman setting.

## Safety and operating constraints

**Do not treat a passing CI test as a successful real-world payment.** A live customer test must separately validate the first BluePal invoice, the wallet balance, provider delivery and order reconciliation. Test accounts must use legitimate provider order destinations; do not submit an actual paid order merely as a smoke test.

Products with unavailable rates are not displayed. Missing provider confirmation puts orders into `provider_uncertain`, not `delivered`. Never automatically resubmit an uncertain purchase: investigate the provider transaction to avoid duplicate charges. If a provider order outcome is uncertain, an administrator must inspect provider logs before refunding or retrying. For a confirmed sold-out Telegram gift with no provider transaction ID, a wallet debit is automatically refunded with an idempotency key. If an NFT is no longer buyable or Steam quote is too expensive BEFORE provider submission, wallet credit is reversed automatically and a BluePal-funded order is placed into `refund_required` for manual investigation.

To enable additional categories, first confirm the provider's real JSON catalog, quote and order responses, and configure the necessary fulfillment-specific target validation.

## References

- https://tg-tools.shop/api-docs
- https://tg-tools.shop/en/telegram-gift-api
- https://tg-tools.shop/en/gift-card-api

## Financial reconciliation and administrator diagnostics

The market worker executes the TGTools purchase **only once** for a paid order. If its execution is interrupted while `provider_submitting`, the scheduled job marks the order `provider_uncertain` after 15 minutes; it never blindly retries the purchase. Pending provider orders with a transaction ID continue to be polled. The admin **محصولات TG Tools** page shows API health, failed/uncertain orders and provider errors.

The `GET /api/admin/market/health` API is admin-authenticated and returns status counts and sanitized SMM connectivity diagnostics. It never returns the TGTools API key. A zero-product SMM catalog or provider authorization failure is an upstream availability issue, not proof of a sellable product.

An administrator can refund a **wallet-funded**, definitively failed or `refund_required` market order only after independently confirming it was not delivered. Refunds are forbidden for orders with an assigned provider transaction ID, pending or uncertain orders, and card-funded payments. Refunds are ledger-backed and idempotent; the UI requires an explicit non-delivery confirmation and reason.

For a gift card, a completed provider order without a delivery code is not considered delivered if the customer bought a code product (rather than a player-ID top-up). Steam and NFT require fresh item-specific pricing; failed preflight checks automatically release wallet funds before provider submission.
