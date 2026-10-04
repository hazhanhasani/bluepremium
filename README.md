# Blue Premium / بلوپرمیوم

Independent Telegram Premium storefront built on Cloudflare Workers + D1 with an Android client.

## Architecture

- **Cloudflare Worker**: storefront, admin panel, REST API, payment verification, provider delivery and scheduled reconciliation.
- **Cloudflare D1**: plans, orders, encrypted provider credentials and application settings.
- **TG Tools**: Telegram username lookup, Premium purchase and transaction reconciliation.
- **BluePal**: invoice creation and server-side payment verification.
- **Android**: secure WebView client that only keeps the Blue Premium origin in-app; payment pages open externally.
- **GitHub Actions**: builds an installable Android APK on every Android change.

## Security

Provider API keys are never committed to GitHub. The admin panel stores them encrypted with AES-GCM using `CONFIG_ENCRYPTION_KEY`, which only exists as a Cloudflare Worker secret. Order lookups require a random per-order token and BluePal webhook data is never trusted without re-fetching the invoice from BluePal.

## Local development

```bash
npm install
npx wrangler d1 migrations apply blue-premium-db --local
npm run dev
```

## Production deployment

Cloudflare bindings are defined in `wrangler.jsonc`. Apply migrations and deploy:

```bash
npx wrangler d1 migrations apply blue-premium-db --remote
npm run deploy
```

The production deployment can run without repository secrets. The admin password hash is initialized directly in D1, while session and encryption keys are generated inside the Worker on first use and kept out of the public API. You can optionally migrate those internal keys to Cloudflare Secrets later.

TG Tools and BluePal API keys are entered from `/admin` after deployment and are stored encrypted in D1. The admin password can also be rotated from the dashboard.

## API flow

1. Client loads active 3/6/12-month plans.
2. Telegram username is verified with TG Tools.
3. BluePal invoice is created in Rial from the Toman plan price.
4. Payment is re-verified from BluePal before any provider call.
5. Paid order is atomically claimed and sent to TG Tools.
6. Pending TG Tools transactions are reconciled automatically by the Worker cron.

## Android

The Android project lives under `android/`. GitHub Actions produces `app-debug.apk` as the `bluepremium-apk` artifact. This debug-signed APK is directly installable for testing; production Play/Bazaar signing should use a persistent private release keystore stored outside the repository.


## Live deployment

- Store: `https://bluepremium.hazhanhasani4268-0f9.workers.dev/`
- Admin: `https://bluepremium.hazhanhasani4268-0f9.workers.dev/admin`
- Health: `/health`
- Cloudflare cron: every 5 minutes for price sync and order reconciliation.


## Android stable signing

Production APKs are built as signed `release` artifacts with a persistent signing identity.

- Certificate SHA-256: `EB:E3:B4:F6:52:FF:A9:C9:73:1B:CE:07:D9:E5:3B:66:6A:EE:C5:A8:FC:ED:2C:6A:2F:BB:13:60:D5:15:5F:D2`
- The private signing material is not committed to GitHub.
- GitHub Actions obtains signing material from the Blue Premium Worker using GitHub OIDC scoped to this repository and the `main` branch.
- CI verifies the final APK certificate fingerprint before uploading the artifact.
- The original debug-signed test APK cannot be upgraded in place to the first stable-signed release; uninstall it once. Stable releases after that can update each other normally.
