# TG Tools Digital Products

## Release

The BluePremium Worker on Cloudflare includes a dedicated catalog and checkout for TG Tools products. The live Stars API returns supported package quantities and wholesale TON prices. The storefront converts TON to Toman using the existing price-sync exchange rate, with a separate profit percentage for each product family.

Current initial enablement:
- **Stars:** enabled (dynamic 50+ Stars packages from `/api/purchase/prices`).
- **Telegram gifts, SMM bundles, digital catalog:** implemented as separate catalog/fulfillment integrations, but disabled until their price fields, endpoint response contracts and delivery can be verified end-to-end against the active TG Tools account.
- **NFT gifts, Steam top-ups:** held disabled because they need recipient-/listing-specific quotes, not cached package pricing.

## Customer experience

In the Telegram bot use `/stars` or `/products`, choose a package, specify the delivery target and choose wallet or BluePal card transfer.

In the storefront open the **فروشگاه خدمات دیجیتال** section. The store displays a category switcher, price cards, target fields, payment choice and a token-protected order status check.

For BluePal card transfer, only the destination card number and exact payable amount are displayed in the app; no BluePal branding/link is presented to the buyer. Payment is independently verified with the gateway API before fulfillment. A wallet debit is recorded atomically in the wallet ledger along with the market order.

## Administration

In `/admin` choose **محصولات TG Tools** to configure each category's margin and enabled flag independently, and inspect up to 100 recent market orders. Admin endpoints:
- `GET/PATCH /api/admin/market/settings`
- `GET /api/admin/market/orders`

Public catalog: `GET /api/market/catalog?kind=stars`. Signed Telegram Mini App profile/history remains separate.

The price sync continues using the existing Cloudflare cron and TON/Toman setting.

## Safety and operating constraints

**Do not treat a passing CI test as a successful real-world payment.** A live customer test must separately validate the first BluePal invoice, the wallet balance, provider delivery and order reconciliation. Test accounts must use legitimate provider order destinations; do not submit an actual paid order merely as a smoke test.

Products with unavailable rates are not displayed. Missing provider confirmation puts orders into `provider_uncertain`, not `delivered`. Never automatically resubmit an uncertain purchase: investigate the provider transaction to avoid duplicate charges. Failed wallet orders require an administrator to inspect delivery before crediting any refund.

To enable additional categories, first confirm the provider's real JSON catalog, quote and order responses, and configure the necessary fulfillment-specific target validation.

## References

- https://tg-tools.shop/api-docs
- https://tg-tools.shop/en/telegram-gift-api
- https://tg-tools.shop/en/gift-card-api
