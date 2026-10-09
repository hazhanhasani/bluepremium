import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=async n=>readFile(new URL('../src/parts/'+String(n).padStart(3,'0')+'.part',import.meta.url),'utf8');
const [entry,market,visual,polish,phase]=await Promise.all([read(1),read(22),read(24),read(26),read(25)]);

test('the product-polish layer is mounted after the existing checkout and member views',()=>{
  assert.match(entry,/bpMarketPolishDecorate\(bpPhaseOneDecorate\(bpDecorateExperience\(tgDecorateStore\(bpDecorateStoreHtml\(storeHtmlV4\(\)\)\)\)\)\)/);
  const render=new Function(polish+';return bpMarketPolishDecorate;')();
  const markup='<html><head></head><body><div id="tg-digital-shop"><div id="tgCategories"></div><div id="tgItems"></div><div id="tgFeedback"></div></div></body></html>';
  const output=render(markup);
  assert.match(output,/bp-market-polish-v1/);
  assert.match(output,/id="tgItems"/);
  const injected=output.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(injected);
  assert.doesNotThrow(()=>new Function(injected));
});

test('catalog loading shows skeletons and is resilient to out-of-order responses',()=>{
  assert.match(market,/const thisRequest=\+\+catalogRequest/);
  assert.match(market,/if\(thisRequest!==catalogRequest\)return/);
  assert.match(market,/aria-busy/);
  assert.match(market,/bp-product-skeleton/);
  assert.match(market,/items\.setAttribute\('aria-busy','false'\)/);
  assert.match(market,/data-market-retry/);
});

test('product cards keep exact API price, selected SKU and original checkout',()=>{
  assert.match(market,/all=Array\.isArray\(d\.products\)\?d\.products:\[\]/);
  assert.match(market,/format\(x\.price_toman\)/);
  assert.match(market,/data-index/);
  assert.match(market,/selected=all\[Number\(b\.dataset\.index\)\]/);
  assert.match(market,/expected_price_toman:selected\.price_toman/);
  assert.match(market,/\/api\/market\/orders/);
  assert.match(market,/payment,expected_price_toman/);
  assert.doesNotMatch(polish,/fetch\(|wallet\/purchase|blupalRequest|market\/orders\/.*POST/);
});

test('states prevent selling catalog without valid price and provide retry',()=>{
  for(const cls of ['bp-market-disabled-state','bp-market-empty-state','bp-market-error-state','bp-market-quote-state']){
    assert.ok(market.includes(cls));
  }
  assert.match(market,/items\.onclick=e=>/);
  assert.match(market,/if\(e\.target\.closest\('\[data-market-retry\]'\)\)\{load\(currentKind\);return\}/);
  assert.match(polish,/\.bp-product-skeleton/);
  assert.match(polish,/prefers-reduced-motion/);
});

test('category buttons are real controls, not decorative fake chips',()=>{
  assert.match(market,/aria-pressed/);
  assert.match(market,/categories\.onclick=e=>/);
  assert.match(polish,/categories\.querySelectorAll\('button\[data-kind\]'\)/);
  assert.match(polish,/new MutationObserver\(updateCategories\)/);
  assert.match(polish,/new MutationObserver\(updateItems\)/);
});

test('artwork and prices remain presentation-only and mobile responsive',()=>{
  const css=new Function(polish+';return bpMarketPolishCss;')()();
  assert.match(css,/#32282E/);
  assert.match(css,/#E7EFE5/);
  assert.match(css,/#F7E5D9/);
  assert.match(css,/\.bp-product-price/);
  assert.match(css,/\.tg-paychoices/);
  assert.match(css,/max-width:600px/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(visual,/new MutationObserver\(drawProducts\)/);
  assert.match(phase,/bpPhaseOneClient/);
});
