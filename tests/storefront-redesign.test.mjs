import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const part=async n=>readFile(new URL('../src/parts/'+String(n).padStart(3,'0')+'.part',import.meta.url),'utf8');
const [feature,routes,market]=await Promise.all([part(24),part(1),part(22)]);

test('new storefront decorator preserves existing checkout and injects accessible quick-buy UI',()=>{
  const decorator=new Function(feature+';return bpDecorateExperience;')();
  const original='<html lang="fa" dir="rtl"><head></head><body><main class="shell"><header class="topbar"></header><section id="plans"></section><section id="checkout"><button id="buy">Buy</button></section></main><nav class="app-nav"></nav></body></html>';
  const html=decorator(original);
  assert.match(html,/id="bp-experience-v2"/);
  assert.match(html,/bpExperienceClient/);
  assert.match(html,/id="checkout"/);
  assert.match(html,/id="buy"/);
  const embedded=html.match(/<script>([\s\S]+)<\/script>/)?.[1];
  assert.ok(embedded);
  assert.doesNotThrow(()=>new Function(embedded));
});

test('route applies enhanced decorator on original, authenticated storefront',()=>{
  assert.match(routes,/bpDecorateExperience\(tgDecorateStore\(bpDecorateStoreHtml\(storeHtmlV4\(\)\)\)\)/);
  assert.match(market,/window\.bpSelectMarketKind=kind=>load\(kind\)/);
});

test('quick-buy preserves production payment flows rather than duplicating checkout',()=>{
  assert.doesNotMatch(feature,/fetch\(['"]\/api\/market\/orders/);
  assert.doesNotMatch(feature,/blupalRequest|bpWalletBuy|payment_provider/);
  assert.match(feature,/data-bp-target="premium"/);
  assert.match(feature,/data-bp-target="stars"/);
  assert.match(feature,/openMarket\(kind\)/);
});

test('mobile navigation is single-row and respects reduced motion',()=>{
  assert.match(feature,/repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(feature,/prefers-reduced-motion/);
  assert.match(feature,/scroll-margin-top/);
  assert.match(feature,/\.mobile-cta\{display:none!important\}/);
});
