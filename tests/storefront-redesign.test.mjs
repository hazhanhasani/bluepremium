import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const part=async n=>readFile(new URL('../src/parts/'+String(n).padStart(3,'0')+'.part',import.meta.url),'utf8');
const [feature,routes,market]=await Promise.all([part(24),part(1),part(22)]);

test('new app shell decorates storefront and preserves existing payment DOM',()=>{
  const decorator=new Function(feature+';return bpDecorateExperience;')();
  const input='<html lang="fa" dir="rtl"><head></head><body><main class="shell"><header class="topbar"></header>'+
    '<section id="plans"></section><section id="checkout"><button id="buy">Buy</button></section></main>'+
    '<nav class="app-nav"></nav></body></html>';
  const rendered=decorator(input);
  assert.match(rendered,/bp-experience-v3/);
  assert.match(rendered,/bpExperienceClient/);
  assert.match(rendered,/id="checkout"/);
  assert.match(rendered,/id="buy"/);
  const script=rendered.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  assert.doesNotThrow(()=>new Function(script));
});

test('production route keeps all existing account, TG Tools, checkout decorators',()=>{
  assert.match(routes,/bpDecorateExperience\(tgDecorateStore\(bpDecorateStoreHtml\(storeHtmlV4\(\)\)\)\)/);
  assert.match(market,/window\.bpSelectMarketKind=kind=>load\(kind\)/);
});

test('six actual views and six navigation buttons replace anchor scrolling',()=>{
  assert.match(feature,/for\(const name of \['home','premium','market','orders','account'\]\)/);
  assert.match(feature,/grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
  assert.match(feature,/bp-tab-view\[hidden\]\{display:none!important\}/);
  assert.match(feature,/data-bp-tab/);
  assert.match(feature,/data-bp-active/);
  assert.match(feature,/data-bp-go="premium"/);
  assert.match(feature,/data-bp-go="stars"/);
  assert.match(feature,/market\.appendChild|panel\.market\.appendChild/);
});

test('old premium and digital orders are preserved and shown in Orders view',()=>{
  assert.match(feature,/document\.getElementById\('order'\)/);
  assert.match(feature,/document\.getElementById\('tgOrder'\)/);
  assert.match(feature,/premiumOrder\.appendChild\(legacy\)/);
  assert.match(feature,/marketOrder\.appendChild\(marketDetails\)/);
  assert.match(feature,/bp:market-order-created/);
  assert.match(market,/dispatchEvent\(new CustomEvent\('bp:market-order-created'/);
  assert.match(market,/if\(pane\.getClientRects\(\)\.length\)/);
});

test('checkout remains original and no payment API is duplicated in tab controller',()=>{
  assert.doesNotMatch(feature,/fetch\(['"]\/api\/market\/orders/);
  assert.doesNotMatch(feature,/blupalRequest|bpWalletBuy|payment_provider/);
  assert.match(feature,/getElementById\('checkout'\)/);
  assert.match(feature,/getElementById\('bp_account'\)/);
  assert.match(feature,/scroll-margin/); // not required for offscreen fixed nav but retained safely
});

test('mobile UX supports reduced motion and readable 6-item dock',()=>{
  assert.match(feature,/prefers-reduced-motion/);
  assert.match(feature,/bp-app-nav/);
  assert.match(feature,/aria-current/);
  assert.match(feature,/grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
});
