# TG Tools Digital Products

## Release

The BluePremium Worker on Cloudflare includes a dedicated catalog and checkout for TG Tools products. The live Stars API returns supported package quantities and wholesale TON prices. The storefront converts TON to Toman using the existing price-sync exchange rate, with a separate profit percentage for each product family.

Current configuration and contracts:
- **Stars:** enabled; dynamic package prices from `/api/purchase/prices` and successful delivered order observed.
- **Telegram gifts:** enabled with sold-out filtering, confirmation-only failure refunding and TGTools purchase polling. A prior wallet purchase that returned "gift sold out" was refunded (52,000 Toman).
- **Gift cards/game top-ups:** enabled; searches the provider's giftcards/topups catalog, shows exact denomination-level variants and re-quotes `/api/catalog/item?key=` by product ID before checkout. Provider delivery confirmation is still required before marking delivered.
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

Public endpoints: `GET /api/market/catalog?kind=stars|gift|catalog|smm`, `GET /api/market/catalog?kind=catalog&q=Amazon`, `GET /api/market/quote?kind=steam&sku=RUB:100`, `GET /api/market/quote?kind=nft&sku=<address>`, and `GET /api/market/nft-listings`. Signed Telegram Mini App profile/history remains separate.

The price sync continues using the existing Cloudflare cron and TON/Toman setting.

## Safety and operating constraints

**Do not treat a passing CI test as a successful real-world payment.** A live customer test must separately validate the first BluePal invoice, the wallet balance, provider delivery and order reconciliation. Test accounts must use legitimate provider order destinations; do not submit an actual paid order merely as a smoke test.

Products with unavailable rates are not displayed. Missing provider confirmation puts orders into `provider_uncertain`, not `delivered`. Never automatically resubmit an uncertain purchase: investigate the provider transaction to avoid duplicate charges. If a provider order outcome is uncertain, an administrator must inspect provider logs before refunding or retrying. For a confirmed sold-out Telegram gift with no provider transaction ID, a wallet debit is automatically refunded with an idempotency key. If an NFT is no longer buyable or Steam quote is too expensive BEFORE provider submission, wallet credit is reversed automatically and a BluePal-funded order is placed into `refund_required` for manual investigation.

To enable additional categories, first confirm the provider's real JSON catalog, quote and order responses, and configure the necessary fulfillment-specific target validation.

## References

- https://tg-tools.shop/api-docs
- https://tg-tools.shop/en/telegram-gift-api
- https://tg-tools.shop/en/gift-card-api
