# BluePremium v5 — Visual Benchmark and Delivery Notes

## Benchmark
Reference: EsalaT Gift mobile Telegram storefront screenshot provided during design review.
This is a visual benchmark, not a license to copy its assets or identity.

| Area | Previous BluePremium v5 | v5.1 review target |
| --- | --- | --- |
| Hero | Large editorial headline consuming the first fold | Compact product-first banner with original BluePremium artwork |
| Above-fold commerce | Two promoted cards, account overview, four small categories | Four equal-weight service actions in a 2 × 2 grid |
| Account | Overview occupied prime selling area even when unauthenticated | Compact welcome and wallet shortcut; full account widgets follow catalog |
| Navigation | Six cramped destinations | Five visible destinations; catalog available through its card |
| Artwork | Generic SVG and flat presentation | Brand-specific vector artworks with layered light, glow and matching product tones |
| Microcopy | Abstract slogans | Concise Persian, accurate functionality-specific actions |

## Deliverables
- Editable Figma reference: https://www.figma.com/design/2Vhq61kgTHcJgCADeWbQ5s
- Product layer: `src/parts/029.part` (CSS and DOM-only refinements).
- Display-only Cloudflare preview: https://bluepremium-v5-preview.hazhanhasani4268-0f9.workers.dev/
- Preview is read-only, with dummy pricing and disabled real payments and admin APIs.

## Routes and reality checks
- Premium button: existing `bpOpenTab('premium')` path.
- Stars button: existing category `stars`.
- Gift card: existing `catalog` view filtered to `gift`.
- Digital card: existing `catalog` view.
- Do **not** invent or enable ChatGPT subscriptions when the provider catalog lacks one.
- The five visible tabs do not delete the existing catalog view or order history.
- No new payment, provider or wallet logic is introduced in this UI layer.

## Quality checklist
- 320px, 350px, 390px and desktop viewport: no sideways scroll or clipped CTA.
- At mobile viewport: hero before 2×2 product services; account overview follows merchandise.
- All 4 cards are keyboard reachable and open the intended view.
- Visual state of five-tab navigation matches `aria-current`; catalog remains accessible.
- Optional Telegram data must never be trusted as HTML: write to `textContent`.
- No account balances shown without validated Telegram init data.
- `prefers-reduced-motion`, 44px-or-larger primary touch targets, 4.5:1 text contrast targets.
- Checkout, BluePal verification, customer balances, mandatory join and TG Tools delivery require independent staging validation before merging.

## Audit result
The first 'Midnight Luxe v5' deployment was not compositionally comparable to the benchmark; CSS styling alone is insufficient. The v5.1 redesign fixes the primary screen hierarchy and card count but original visual assets and fine typography still require additional refinement. Tests confirm structure, not purchase correctness or subjective pixel fidelity.
