# Blue Premium — Customer Accounts, Wallet & Referrals

## Customer identity
Customer accounts use the immutable Telegram numeric user ID. The Telegram bot creates an account when a user starts or interacts with the bot. The Telegram Mini App authenticates signed Telegram WebApp `initData` (HMAC-SHA256, 24-hour validity, 5-minute future skew). The normal Android/WebView site does **not** claim an authenticated wallet session: users must open the Mini App through Telegram to manage their wallet.

## Wallet accounting
All balances are in **Toman**. `bp_wallet_ledger` is the source of truth; the `bp_wallet_balances` view derives each balance. The application never accepts wallet balance updates from a client. Admin credits, debits and purchases are guarded SQL `INSERT ... SELECT` statements. Purchase orders and debits are executed in the same D1 transactional batch, with a unique `idempotency_key`. Balances must remain nonnegative.

Administrators can search customers, block/unblock access and make manual credits/debits with a mandatory reason under **Admin → کاربران و کیف پول**. The bot optionally notifies a user when their wallet changes. Wallet payment is available as a payment method during a Telegram Premium checkout; card-transfer payment through BluePal remains the default alternative.

**Important:** A wallet purchase reserves the customer's funds when the order is created. A later provider failure is not automatically refunded. Review the failed order and issue an auditable manual wallet credit after ensuring no delivery occurred.

## Forced membership
Use **Admin → کانال‌ها و زیرمجموعه‌گیری** to define channels. Each entry requires a Telegram chat ID/username, display title and HTTPS `t.me` invite URL. The Blue Premium bot must be a channel administrator with permission to call `getChatMember`.

The bot verifies membership before access to purchasing and other protected commands. The Mini App displays missing channels and enforces membership at checkout. Unverifiable membership fails closed.

## Referrals
Users receive a personal link: `https://t.me/<bot_username>?start=ref_<telegram_id>`. Referrer assignment is one-time, rejects self-referrals and only accepts already-registered referrers. A configurable bonus (default **0 Toman**, disabled until configured) is credited to the inviter's wallet once the referred user's **first paid order is delivered**. Each referral reward has a deterministic unique ledger key; repeated events cannot credit the same referral twice.

## Database
- `migrations/0007_customer_wallet_referrals.sql`: user identities, ledger and derived balance view, forced channels and order ownership.
- `migrations/0008_legacy_bot_customers.sql`: attach existing Telegram bot orders to users.

Production D1 migrations were applied during the October 2026 feature rollout. Avoid applying the `ALTER TABLE orders ADD COLUMN telegram_user_id` statement twice on the same database.

## Operational checks
1. Run `npm test` and check the checkout regression GitHub Action.
2. Confirm `/admin` shows user and channel tabs after authentication.
3. Use `/start`, `/profile`, `/wallet` and `/referrals` in the Telegram bot.
4. Credit a test customer from admin and verify the new balance and ledger.
5. Confirm oversized wallet debits fail and that blocked users cannot buy.
6. Set a forced-join channel and verify it from a user account.
7. Verify that referral rewards are credited only after a delivered order, never before payment confirmation.

Payment and login keys must remain encrypted in D1; do not log raw Telegram initData or BluePal secrets.
