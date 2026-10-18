# BluePremium — UX & Engineering Research
**Date:** 2026-10-18  
**Status:** Research complete, MagicPath prototype built; implementation not released.  
**Project:** [hazhanhasani/bluepremium](https://github.com/hazhanhasani/bluepremium)  
**Prototype:** MagicPath project `462487314254401536` / component `462487380176277504` / revision `462487380176277505`.  
**Design reference:** [Figma BluePremium 390px screen](https://www.figma.com/design/2Vhq61kgTHcJgCADeWbQ5s)  
**Visual benchmark:** EsalaT Gift screenshot provided by the product owner. This benchmark does not grant rights to copy its trademarks, source art, or exact UI.

## 1. Executive assessment

The immediate constraint is not lack of visual styling: the application consists of 29 concatenated Worker source fragments and a series of DOM/CSS decoration layers. The product-facing UI is consequently hard to refine as a coherent design system. The first Midnight Luxe iteration demonstrated that polished gradients without a new information hierarchy did not solve the product experience. A later v5.1 iteration moved to four product cards and a five-item dock, but still lacks professional category-specific artwork, systematic interaction states, and authenticated end-to-end UI evaluation.

**Recommendation:** Keep the current Worker backend, D1 schema, validated checkout and callback pathways intact. Deliver a component-based storefront incrementally using a private staging deployment. Launch via a CI pipeline only after functional and visual QA.

## 2. Evidence by source

| Source | Evidence found | Limits |
| --- | --- | --- |
| GitHub | 29 `src/parts/*.part` files compiled by `scripts/build-worker.mjs` into a single `dist/worker.js`; Node test suite; Wrangler/D1 config; v5 decorators in parts 028–029. | Static inspection does not prove authenticated checkout integrity. |
| Figma | Existing 390px target includes profile, wallet shortcut, 188px hero, 2×2 products, five-item dock. | Frame art has simplistic stars/glyphs, not an established component library or responsive variants. |
| Canva | Three related *Blue Panel* promotional layouts available, but no dedicated *BluePremium* brand kit found in this audit. | Different product identity; do not automatically reuse Blue Panel artwork as BluePremium. |
| MagicPath | New interactive prototype built: premium product art, stars art, gifts, digital, five live navigation states and read-only order/account screens. Build/revision completed. | Prototype has placeholder brand glyph, no authenticated Telegram data and no real provider/payment integration. |
| PostHog | Active connected 'Default project', project ID 659778, shows `ingested_event=false`; session recording disabled; snippet onboarding incomplete. | **No observed conversion rates, rage-clicks, retention, or user recordings exist yet**. Do not infer customer trends. |
| Writing Style | Search returned generated files and no qualifying user-authored BluePremium commerce copy. | Use plain, concise Persian functional microcopy until real writing examples are available. |
| Cloudflare | Existing `bluepremium` Worker is configured with D1 and five-minute cron; Wrangler name `bluepremium`, `main` points to `dist/worker.js`; original production Worker previously required manual sync after merging GitHub PR. | No evidence of active Git-connected automatic deployment. |
| Product Design | Product Design workflow and research/audit guidance reviewed. | Its complete Work-mode prototype/audit workflow is not supported in standard Chat; the other connected design and browser tools remain usable independently. |

**Reference docs:**  
- Telegram Mini Apps: https://core.telegram.org/bots/webapps  
- Cloudflare Git integration: https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/  
- Cloudflare branch previews: https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/  
- WCAG 2.2 target size: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum/  

## 3. Ranked opportunities

### P0 — Consistent real deployments
**Observed:** v5 was merged to GitHub, but the Telegram Mini App still served the previous Worker version until manually deployed.  
**Recommended:** Connect Cloudflare Workers Builds to GitHub repo `hazhanhasani/bluepremium`, production branch `main`; set build command `npm ci && npm run build` and deploy command `npx wrangler deploy`, configuring account permissions through Cloudflare's managed Git integration. Use isolated PR previews and avoid attaching production D1 to them. Add version markers to HTML / health responses and post-deploy smoke tests of the *real Telegram Mini App URL*.  
**Acceptance:** Merging a passing PR triggers exactly one deployment; production page and commit SHA agree; rollback is available; no payment traffic is served by a preview.

### P0 — Protect real payment and authorization
**Recommended:** Preserve the existing order lifecycle, server-verified quote, payment callback signature checks, Telegram init-data server verification, forced-join gate, wallet transactions and admin authorization. Do not trust client UI state to unlock purchases. Use real provider prices only. Tokens belong in secure storage (not source, screenshots, analytics events or logs).  
**Acceptance:** Tests cover paid/cancelled/repeated callbacks, retries, duplicate webhook delivery, unauthorized clients, rate limits, balance debits, and no provider product available.

### P0 — Instrument a privacy-safe funnel
**Observed:** PostHog has no events, so business recommendations cannot be based on actual conversions.  
**Suggested event taxonomy:** `storefront_viewed`, `category_selected`, `product_opened`, `checkout_started`, `order_created`, `payment_completed`, `payment_failed`, `forced_join_shown`, `ui_error`. Use anonymous opaque IDs, app version, category and non-sensitive error codes; avoid bot token, Telegram initData, phone, username, card number, unredacted query string, or other secrets.  
**Consent and privacy:** Determine applicable disclosure/legal basis before enabling session replay; redact inputs and payment content; begin with aggregate events on staging.  
**Acceptance:** Events arrive in the correct PostHog project; duplicate events are deduplicated; dashboard shows a conversion funnel without private user data.

### P1 — Storefront architecture and visual system
**Observed:** Presentation logic added as decorators `src/parts/024–029.part`.  
**Recommended:** Create an isolated storefront component layer, starting with Header, Hero, ProductCard, Catalog, BottomNav, EmptyState and OrderStatus. Use semantic design tokens and original licensed assets. Avoid adding more global `!important` overrides and one-off DOM mutations. Incrementally swap the storefront, not the payment contract.  
**Acceptance:** Five product navigation routes remain functional; all layout states exist at 320px, 360px, 390px, tablet; text remains readable at zoom and larger font scale; no horizontal overflow; keyboard navigation and reduced motion work.

### P1 — Telegram-native interaction and QA
**Recommended:** Verify expanding/minimizing the app, theme changes, safe area and content safe area, keyboard overlap, bottom navigation, native back-button behavior and responsive height. Primary buttons should offer generously sized touch areas; WCAG 2.2 minimum target is 24×24 CSS pixels with specified exceptions.  
**Acceptance:** On Android and iOS Telegram WebView: drawer/modal closes through back action, dock never overlaps native UI, error/loading states are distinguishable, account data requires verified initData.

### P2 — Copy and brand
**Recommended:** Create a dedicated BluePremium Brand Kit with approved logo, licensed artworks, RTL typography, color tokens, accessibility contrast levels, voice and microcopy. Keep descriptive purchase buttons, avoid unnecessary emoji, avoid generic hype, do not advertise products without verified provider catalog support.  
**Acceptance:** Shared design assets match the live UI; no fake price or stock claims, no legacy Blue Panel branding in BluePremium UI.

## 4. Prototype handoff

**MagicPath Project:** `462487314254401536`  
**Component:** `462487380176277504`; **Revision:** `462487380176277505` (build completed)  
**Canvas:** `BluePremium UX Lab`  
**Properties:** Original dimensional SVGs, RTL layout, header wallet shortcut, hero, four services, five navigation tabs, sample Premium/Stars option selectors, account and orders empty state, modal dismiss, keyboard focus and reduced-motion support.  
**Important:** Demo offers and all payment flows are explicitly disabled. The app does not import authenticated user data.

## 5. Safe implementation sequence

1. Review final mobile render and replace temporary brand glyph with the **approved original** BluePremium logo (no generated surrogate in production).
2. Extract design tokens and build components on a new `design/storefront-v6` branch, using actual data bindings from existing Worker routes; do not migrate D1 for purely visual changes.
3. Add screenshot regression baselines (e.g. Playwright), interaction tests at mobile widths and Telegram API behavior tests.
4. Create non-production Worker with independent D1, dummy/injected payment providers, protected test credentials and versioned preview URL.
5. Enable Cloudflare Git-triggered builds with staging review, main merge gate and validated prod smoke check.
6. Run live payment integration in a controlled staging setup, then staged production rollout and rollback readiness.
7. Only when privacy and event strategy are approved, add PostHog production instrumentation and data quality monitoring.

## Definition of done
- [ ] High-fidelity approved BluePremium logo and art
- [ ] Polished Figma components with tokens and responsive variants
- [ ] MagicPath prototype reviewed across five views
- [ ] CI build and preview smoke test passing
- [ ] Real provider pricing and checkout contract regression passing
- [ ] Authenticated Telegram WebView E2E verified
- [ ] No customer, D1 or payment secrets in analytics or client bundle
- [ ] Automatic deployment and reliable rollback verified
- [ ] Production released after explicit launch decision

**This document is research and a delivery plan, not a claim that the full redesign or deployment automation has been shipped.**
