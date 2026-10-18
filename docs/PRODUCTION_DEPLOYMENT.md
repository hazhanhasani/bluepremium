# BluePremium V6 — Production releases

Worker: `bluepremium`, production branch: `main`. The live Worker uses D1 `DB` and the cron `*/5 * * * *`.

## Entry and rollback

- Telegram Mini App: `/?from=telegram`.
- Legacy, validated V5 checkout: `/?legacy=1`.
- Live build ID: `/health` `ui` field, plus root `x-bluepremium-ui` HTTP header.
- V6 only reads authenticated Telegram data; payment requests still run in the original V5 checkout.
- In case of a Worker-wide issue, use Cloudflare **Deployments → Rollback**. Do not alter D1 history or provider keys.

## Automatic GitHub deployment (opt-in)

Workflow: `.github/workflows/bluepremium-production-deploy.yml`.

On selected changes to `main`, it runs browser and API security tests, rebuilds the V6 UI into Worker source, and checks checkout regression. **It does not deploy until separately enabled.**

One-time activation:
1. GitHub → **Settings → Secrets and variables → Actions → Secrets**: create `BLUEPREMIUM_CLOUDFLARE_API_TOKEN`. Use a *dedicated, restricted* Cloudflare Workers deployment token, never commit it or share it in chat.
2. GitHub → **Settings → Secrets and variables → Actions → Variables**: create `BLUEPREMIUM_AUTODEPLOY` with the exact value `enabled`.
3. Run the **BluePremium Production Deploy** workflow manually once and check the live smoke verification.
4. Afterwards, relevant `main` changes are built, validated, deployed and checked automatically.

Until both settings are configured, deploy is skipped after tests. If the secret is missing but enabled, the job fails safely before deploying.

Alternative: connect this Worker through Cloudflare Dashboard → Workers & Pages → bluepremium → Settings → Builds → Connect GitHub. Use just **one** production deployment mechanism. Native Builds also needs the React bundling step before `wrangler deploy`.

## Safety criteria

Verify:
- `/health`: expected V6 version
- `/?from=telegram`: V6 homepage
- `/?legacy=1&tab=premium`: secure V5 checkout
- `/?legacy=1&tab=catalog&kind=stars`: Stars product list
- `/api/plans`: real prices
- D1 binding and cron intact
- Real Telegram login, wallet, mandatory join and actual payment callbacks must still be tested under supervised staging; do not use real money for exploratory testing.
